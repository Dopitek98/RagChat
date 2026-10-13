import type { HybridDocument, Result, ResultBm25 } from "../../types/types.js";

const DEFAULT_RRF_K = 60;
const DEFAULT_SEMANTIC_RATIO = 0.5;

const getDocumentKey = (source: string, fromLine: number, toLine: number) =>
  `${source}:${fromLine}:${toLine}`;

const normalizeRatios = (semanticRatio?: number) => {
  const semantic =
    typeof semanticRatio === "number" &&
    semanticRatio >= 0 &&
    semanticRatio <= 1
      ? semanticRatio
      : DEFAULT_SEMANTIC_RATIO;

  return {
    semantic,
    bm25: 1 - semantic,
  };
};

export const buildRrfTopDocuments = (
  semanticDocuments: Result[],
  bm25Documents: ResultBm25[],
  semanticRatio?: number,
) => {
  const ratios = normalizeRatios(semanticRatio);
  const documentsByKey = new Map<string, HybridDocument>();

  semanticDocuments
    .slice()
    .sort((a, b) => b.score - a.score)
    .forEach((item, index) => {
      const key = getDocumentKey(item.source, item.fromLine, item.toLine);
      documentsByKey.set(key, {
        source: item.source,
        fromLine: item.fromLine,
        toLine: item.toLine,
        pageContent: item.pageContent,
        semanticRank: index + 1,
        score: 0,
      });
    });

  bm25Documents
    .slice()
    .sort((a, b) => b.score - a.score)
    .forEach((item, index) => {
      const key = getDocumentKey(item.source, item.fromLine, item.toLine);
      const existing = documentsByKey.get(key);

      if (existing) {
        existing.bm25Rank = index + 1;
        if (!existing.pageContent && item.pageContent) {
          existing.pageContent = item.pageContent;
        }
        return;
      }

      documentsByKey.set(key, {
        source: item.source,
        fromLine: item.fromLine,
        toLine: item.toLine,
        pageContent: item.pageContent,
        bm25Rank: index + 1,
        score: 0,
      });
    });

  const scoredDocuments = Array.from(documentsByKey.values()).map((item) => {
    const semanticPart = item.semanticRank
      ? ratios.semantic * (1 / (DEFAULT_RRF_K + item.semanticRank))
      : 0;
    const bm25Part = item.bm25Rank
      ? ratios.bm25 * (1 / (DEFAULT_RRF_K + item.bm25Rank))
      : 0;

    return {
      ...item,
      score: semanticPart + bm25Part,
    };
  });

  return scoredDocuments
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((item) => ({
      source: item.source,
      pageContent: item.pageContent,
      score: item.score,
      fromLine: item.fromLine,
      toLine: item.toLine,
    }));
};
