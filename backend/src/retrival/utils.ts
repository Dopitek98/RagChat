import type { ContentResult, Result } from "../types/types.js";
import {
  client,
  extendGivenContext,
  vectorStore,
} from "../mongo/mongoClientFactory.js";
import winkNLP from "wink-nlp";
import model from "wink-eng-lite-web-model";
import bm25 from "wink-bm25-text-search";
import { ObjectId } from "mongodb";

export const prepareDocumentBySimilaritySearch = async (state: any) => {
  await client.connect();
  const uploads: ContentResult[] = [];
  for (const query of state.searchQueries) {
    const tempUploads: ContentResult[] = [];
    const retrievedDocs = await vectorStore.similaritySearchWithScore(query, 4);

    retrievedDocs.forEach(([doc, score]: [any, number]) => {
      tempUploads.push({
        content: {
          source: doc.metadata.source ?? "unknown",
          pageContent: doc.pageContent,
          score: score,
          fromLine: doc.metadata.loc.lines.from,
          toLine: doc.metadata.loc.lines.to,
        },
      });
    });

    const topScoredResponse = tempUploads.reduce((max, current) =>
      current.content.score > max.content.score ? current : max,
    );

    uploads.push({ content: topScoredResponse.content });
  }
  await client.close();
  return uploads;
};

export const filterOutDuplicatesFromTopQueries = (uploads: ContentResult[]) => {
  return uploads
    .filter(
      (item, index, self) =>
        index ===
        self.findIndex((obj) => obj.content.fromLine === item.content.fromLine),
    )
    .map((el) => el.content);
};

export const groupAndMergeBySource = (items: Result[], padding = 30) => {
  // @ts-ignore
  const groups = Object.groupBy(items, (item) => item.source);

  return Object.entries(groups).flatMap(([source, group]: [string, any]) => {
    const expandedRanges = group
      .map((item: Result) => ({
        source,
        fromLine: item.fromLine - padding >= 0 ? item.fromLine - padding : 0,
        toLine: item.toLine + padding,
      }))
      .sort((a: any, b: any) => a.fromLine - b.fromLine);

    const mergedRanges: Result[] = [];

    for (const current of expandedRanges) {
      const previous = mergedRanges.at(-1);

      // @ts-ignore
      if (!previous || current.fromLine > previous.toLine) {
        mergedRanges.push({ ...current });
        continue;
      }
      // @ts-ignore
      previous.fromLine = Math.min(previous.fromLine, current.fromLine);

      // @ts-ignore
      previous.toLine = Math.max(previous.toLine, current.toLine);
    }

    return mergedRanges;
  });
};

export const extendChunksWithMoreContext = async (topQueries: Result[]) => {
  const extendedChunks = [];
  for (let i = 0; i < topQueries.length; i++) {
    const extendedResult = await extendGivenContext(
      topQueries[i].source,
      topQueries[i].fromLine,
      topQueries[i].toLine,
    );

    // const merged = extendedResult
    //   .flat()
    //   .map((item) => item.text)
    //   .join("\n");

    extendedChunks.push(extendedResult);
  }
  return extendedChunks;
};

export async function bm25Search(query: string, documents: any[]) {
  const nlp = winkNLP(model);

  const engine = bm25();

  engine.defineConfig({
    fldWeights: {
      text: 1,
    },
    bm25Params: {
      k1: 1.5,
      b: 0.75,
      k: 1,
    },
  });

  engine.definePrepTasks([
    (text: string) => {
      return nlp.readDoc(text).tokens().out();
    },
  ]);

  for (const doc of documents) {
    engine.addDoc({ text: doc.text }, doc._id);
  }

  engine.consolidate();

  const results = engine.search(query);

  const resultDoc = [];
  for (let i = 0; i < results.length; i++) {
    const docToAdd = documents.find((el) =>
      el._id.equals(new ObjectId(results[i][0])),
    );
    if (docToAdd) {
      docToAdd.score = results[i][1];
    }
    resultDoc.push(docToAdd);
  }

  return resultDoc;
}
