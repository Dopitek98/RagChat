import { SystemMessage } from "@langchain/core/messages";
import { queryExtenderPrompt } from "../../prompt/queryExtenderPrompt.js";
import { defaultChatModel } from "../../models/models.js";
import type { ResultBm25 } from "../../types/types.js";
import {
  bm25Search,
  extendChunksWithMoreContext,
  groupAndMergeBySource,
} from "../../retrival/utils.js";
import {
  DEFAULT_CHUNK_EXTENSION,
  getAllDocuments,
} from "../../mongo/mongoClientFactory.js";

export const syntheziserBm25ExtendedCall = async (state: any) => {
  const tempUploads: ResultBm25[] = [];
  const documents = await getAllDocuments();
  for (const query of state.searchQueries) {
    console.log("Query: " + query);

    const bf25Queries = await bm25Search(query, documents);
    bf25Queries.forEach((el) => {
      tempUploads.push({
        pageContent: el.text,
        score: el.score,
        id: el.id,
        source: el.source,
        fromLine: el.line_from,
        toLine: el.line_to,
      });
    });
  }

  const documentsByScore = Object.values(
    tempUploads.reduce((acc: Record<string, ResultBm25>, item: ResultBm25) => {
      const id = item.id.toString();

      if (!acc[id]) {
        acc[id] = {
          ...item,
          score: 0,
        };
      }

      acc[id].score += item.score;

      return acc;
    }, {}),
  );

  const topFiveDocuments = documentsByScore
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const mergedRanges = groupAndMergeBySource(
    topFiveDocuments,
    DEFAULT_CHUNK_EXTENSION,
  );

  const extendedChunks = await extendChunksWithMoreContext(mergedRanges);

  const systemMessage: string = queryExtenderPrompt(extendedChunks);
  const response = await defaultChatModel.invoke([
    new SystemMessage(systemMessage),
    ...state.messages,
  ]);

  return {
    messages: [response],
    llmCalls: 1,
  };
};
