import "dotenv/config";

import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import pg from "pg";
import { OllamaEmbeddings } from "@langchain/ollama";

const DOCS_BASE = "https://docs.langchain.com";

const { Pool } = pg;

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ?? "postgresql://admin:admin@localhost:5432/embedding",
});

const EMBEDDING_DIMENSIONS = 1024;

// Curated LangChain OSS pages for this tutorial. Expand this list or filter
// llms.txt URLs to index more of the site.
const DOC_PATHS = [
  "oss/javascript/langchain/agents",
  "oss/javascript/deepagents/rag",
  "oss/javascript/langchain/tools",
  "oss/javascript/langchain/models",
  "oss/javascript/deepagents/retrieval",
  "oss/javascript/langchain/knowledge-base",
  "oss/javascript/langchain/middleware",
  "oss/javascript/deepagents/overview",
  "oss/javascript/deepagents/subagents",
  "oss/javascript/deepagents/streaming",
  "oss/javascript/deepagents/frontend/subagent-streaming",
  "oss/javascript/deepagents/backends",
  "oss/javascript/langgraph/overview",
  "oss/javascript/langgraph/quickstart",
];

async function loadLangchainDocs(docPaths) {
  const docs = [];
  const url = `${DOCS_BASE}/${docPaths}.md`;
  console.log("URL: " + url);
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    docs.push(
      new Document({
        pageContent: text,
        metadata: { source: `${DOCS_BASE}/${docPaths}` },
      }),
    );
  } catch {
    console.log("ERROR");
  }
  return docs;
}

for (let i = 0; i < DOC_PATHS.length; i++) {
  const docs = await loadLangchainDocs(DOC_PATHS[i]);
  console.log("DOCS NUMBER: " + i + " loaded to db");
  console.log(`Loaded ${docs.length} documentation pages.`);

  const totalChars = docs.reduce((sum, doc) => sum + doc.pageContent.length, 0);
  console.log(`Total characters: ${totalChars}`);
  if (docs.length === 0) continue;

  console.log(docs[0].pageContent.slice(0, 500));

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1024,
    chunkOverlap: 128,
  });
  const allSplits = await textSplitter.splitDocuments(docs);
  console.log(`Split documentation into ${allSplits.length} chunks.`);

  const embeddings = new OllamaEmbeddings({
    model: "qwen3-embedding:latest",
    baseUrl: "http://localhost:11434",
    keepAlive: "10m",
    dimensions: EMBEDDING_DIMENSIONS,
  });

  const vectors = await embeddings.embedDocuments(
    allSplits.map((split) => split.pageContent),
  );
  const source = docs[0].metadata.source;
  const db = await pool.connect();

  try {
    await db.query("BEGIN");
    await db.query('DELETE FROM "Embedding"."Document" WHERE source = $1', [
      source,
    ]);

    for (let chunkIndex = 0; chunkIndex < allSplits.length; chunkIndex++) {
      const split = allSplits[chunkIndex];
      const lineFrom = split.pageContent
        .slice(0, Math.max(0, docs[0].pageContent.indexOf(split.pageContent)))
        .split("\n").length;
              const lineTo = lineFrom + split.pageContent.split("\n").length - 1;
      const vector = `[${vectors[chunkIndex].join(",")}]`;

      await db.query(
        `INSERT INTO "Embedding"."Document"
          (source, text, embedding, line_from, line_to)
         VALUES ($1, $2, $3::vector, $4, $5)`,
        [source, split.pageContent, vector, lineFrom, lineTo],
      );
    }

    await db.query("COMMIT");
    console.log(`Indexed ${allSplits.length} chunks in pgvector.`);
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    db.release();
  }
}

await pool.end();
