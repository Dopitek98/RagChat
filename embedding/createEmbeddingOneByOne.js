import "dotenv/config";

import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { MongoClient } from "mongodb";
import { OllamaEmbeddings } from "@langchain/ollama";

const DOCS_BASE = "https://docs.langchain.com";

const client = new MongoClient(
  "mongodb://admin:admin@localhost:27017/admin?directConnection=true",
);

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
    if (!response.ok) console.log("ERROR");
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
  console.log(docs[0].pageContent.slice(0, 500));

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 64,
  });
  const allSplits = await textSplitter.splitDocuments(docs);
  console.log(`Split documentation into ${allSplits.length} chunks.`);

  async function createCollection() {
    try {
      await client.connect();

      const db = client.db("Embedding");

      await db.createCollection("Document2");

      console.log("Collection created successfully");
    } catch (error) {
      console.error(error);
    } finally {
      await client.close();
    }
  }

  await createCollection();

  await client.connect();

  console.log("Connected to MongoDB");
  const collection = client.db("Embedding").collection("Document2");

  const embeddings = new OllamaEmbeddings({
    model: "qwen3-embedding:latest", // Default value
    baseUrl: "http://localhost:11434", // Default value
    keepAlive: "10m",
    dimensions: 1024,
  });

  const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
    collection: collection,
    indexName: "vector_index",
    textKey: "text",
    embeddingKey: "embedding",
  });

  console.log("Adding documents to vector store...");
  await vectorStore.addDocuments(allSplits);
  console.log(`Indexed ${allSplits.length} chunks.`);

  const existingIndexes = await collection
    .listSearchIndexes("vector_index")
    .toArray();

  const dimensions = 1024;

  if (existingIndexes.length === 0) {
    await collection.createSearchIndex({
      name: "vector_index",
      type: "vectorSearch",
      definition: {
        fields: [
          {
            type: "vector",
            path: "embedding",
            numDimensions: dimensions,
            similarity: "cosine",
          },
        ],
      },
    });
  }

  client.close();
}
