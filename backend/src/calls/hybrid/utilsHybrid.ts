const DEFAULT_RRF_K = 60;
const DEFAULT_SEMANTIC_RATIO = 0.5;

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

export const buildRrfTopDocuments = <T>(
  semanticDocuments: readonly T[],
  bm25Documents: readonly T[],
  options: {
    getKey: (document: T) => string;
    getScore: (document: T) => number;
    withScore: (document: T, score: number) => T;
    semanticRatio?: number;
    limit?: number;
    merge?: (semantic: T, bm25: T) => T;
  },
): T[] => {
  const ratios = normalizeRatios(options.semanticRatio);
  const documentsByKey = new Map<
    string,
    { document: T; semanticRank?: number; bm25Rank?: number }
  >();

  const rankDocuments = (documents: readonly T[], source: "semantic" | "bm25") => {
    const seen = new Set<string>();
    let rank = 0;
    [...documents]
      .sort((a, b) => options.getScore(b) - options.getScore(a))
      .forEach((document) => {
        const key = options.getKey(document);
        if (seen.has(key)) return;
        seen.add(key);
        rank++;
        const existing = documentsByKey.get(key);
        if (existing) {
          if (source === "bm25") {
            existing.bm25Rank = rank;
            if (options.merge) existing.document = options.merge(existing.document, document);
          }
          return;
        }
        documentsByKey.set(key, {
          document,
          ...(source === "semantic" ? { semanticRank: rank } : { bm25Rank: rank }),
        });
      });
  };

  rankDocuments(semanticDocuments, "semantic");
  rankDocuments(bm25Documents, "bm25");

  return [...documentsByKey.values()]
    .map(({ document, semanticRank, bm25Rank }) => ({
      document,
      score:
        (semanticRank ? ratios.semantic / (DEFAULT_RRF_K + semanticRank) : 0) +
        (bm25Rank ? ratios.bm25 / (DEFAULT_RRF_K + bm25Rank) : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, options.limit ?? 5)
    .map(({ document, score }) => options.withScore(document, score));
};
