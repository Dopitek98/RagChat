import { pool } from "../db.js";
import { defaultEmbeddingModel } from "../models/models.js";

export const DATABASE_NAME = "Embedding";
export const COLLECTION_NAME = "Document2";
export const DEFAULT_CHUNK_EXTENSION = 30;

export type PgDocument = {
  id: number;
  text: string;
  source: string;
  line_from: number;
  line_to: number;
  embedding?: number[];
  score?: number;
};

function vectorLiteral(values: number[]) {
  return `[${values.join(",")}]`;
}

export async function similaritySearchWithScore(query: string, limit = 4) {
  const [embedding] = await defaultEmbeddingModel.embedDocuments([query]);
  const result = await pool.query<PgDocument>(
    `SELECT id, text, source, line_from, line_to,
            1 - (embedding <=> $1::vector) AS score
       FROM "Embedding"."Document2"
      ORDER BY embedding <=> $1::vector
      LIMIT $2`,
    [vectorLiteral(embedding), limit],
  );
  return result.rows;
}

export async function extendGivenContext(source: string, fromLines: number, toLines: number) {
  const result = await pool.query<PgDocument>(
    `SELECT id, text, source, line_from, line_to
       FROM "Embedding"."Document2"
      WHERE source = $1 AND line_from >= $2 AND line_to <= $3
      ORDER BY line_from ASC`,
    [source, fromLines, toLines],
  );
  return result.rows;
}

export async function getAllDocuments() {
  const result = await pool.query<PgDocument>(
    `SELECT id, text, source, line_from, line_to FROM "Embedding"."Document2"`,
  );
  return result.rows;
}

