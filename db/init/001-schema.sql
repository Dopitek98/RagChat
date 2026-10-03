CREATE EXTENSION IF NOT EXISTS vector;

CREATE SCHEMA IF NOT EXISTS "Embedding";

CREATE TABLE IF NOT EXISTS "Embedding"."Document" (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  text TEXT NOT NULL,
  embedding vector(1024) NOT NULL,
  line_from INTEGER NOT NULL,
  line_to INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "Embedding"."Document2" (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  text TEXT NOT NULL,
  embedding vector(1024) NOT NULL,
  line_from INTEGER NOT NULL,
  line_to INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS document2_source_lines_idx
  ON "Embedding"."Document2" (source, line_from, line_to);

CREATE INDEX IF NOT EXISTS document2_embedding_idx
  ON "Embedding"."Document2"
  USING hnsw (embedding vector_cosine_ops);
