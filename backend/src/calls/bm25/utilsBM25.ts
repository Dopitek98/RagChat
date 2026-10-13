import type { ResultBm25 } from "../../types/types.js";
import { bm25Search } from "../../retrival/utils.js";
import { getAllDocuments } from "../../mongo/mongoClientFactory.js";

export const returnTopFiveDocuments = async (state: any) => {
  const tempUploads: ResultBm25[] = [];
  const documents = await getAllDocuments();
  for (const query of state.searchQueries) {
    console.log("Query: " + query);

    const bf25Queries = await bm25Search(query, documents);
    bf25Queries.forEach((el) => {
      tempUploads.push({
        pageContent: el.text,
        score: el.score,
        id: el._id,
        source: el.source,
        fromLine: el.FromLine,
        toLine: el.ToLine,
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

  return documentsByScore.sort((a, b) => b.score - a.score).slice(0, 5);
};
