import winkNLP from "wink-nlp";
import model from "wink-eng-lite-web-model";
import bm25 from "wink-bm25-text-search";
import type { CodeContentResult } from "../../types/types.js";

export const rankHierarchyByKeywords = (
  documents: CodeContentResult[],
  query: string,
): CodeContentResult[] => {
  const keywords = documents.flatMap((document, documentIndex) =>
    (document.content.keywords ?? [])
      .filter((keyword) => keyword.trim().length > 0)
      .map((keyword) => ({ documentIndex, keyword })),
  );
  if (keywords.length === 0 || query.trim().length === 0) return [];

  const nlp = winkNLP(model);
  const engine = bm25();
  engine.defineConfig({
    fldWeights: { text: 1 },
    bm25Params: { k1: 1.5, b: 0.75, k: 1 },
  });
  engine.definePrepTasks([(text: string) => nlp.readDoc(text).tokens().out()]);
  keywords.forEach(({ keyword }, index) =>
    engine.addDoc({ text: keyword }, index),
  );
  // The engine requires at least three documents, even for a smaller corpus.
  for (let index = keywords.length; index < 3; index++) {
    engine.addDoc({ text: "" }, index);
  }
  engine.consolidate();

  const scoresByDocument = new Map<number, number[]>();
  for (const [keywordIndex, score] of engine.search(query, keywords.length)) {
    const documentIndex = keywords[keywordIndex].documentIndex;
    const scores = scoresByDocument.get(documentIndex) ?? [];
    scores.push(score);
    scoresByDocument.set(documentIndex, scores);
  }

  return [...scoresByDocument]
    .map(([documentIndex, scores]) => ({
      content: {
        ...documents[documentIndex].content,
        score: scores
          .sort((a, b) => b - a)
          .slice(0, 5)
          .reduce((sum, score) => sum + score, 0),
      },
    }))
    .sort((a, b) => b.content.score - a.content.score)
    .slice(0, 40);
};
