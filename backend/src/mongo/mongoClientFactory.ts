import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { Collection, MongoClient } from "mongodb";
import { defaultEmbeddingModel } from "../models/models.js";
import { MyDocument } from "../types/types.js";

export const DATABASE_NAME = "Embedding";
//export const COLLECTION_NAME = "Document";
export const COLLECTION_NAME = "Document2";
export const HISTORY_COLLECTION_NAME = "History";
export const DEFAULT_CHUNK_EXTENSION = 30; // Number of lines to extend the context by
export const MONGO_URI =
  process.env.MONGO_URI ??
  "mongodb://admin:admin@localhost:27017/admin?directConnection=true";

export const client = new MongoClient(MONGO_URI);

export const collection = client
  .db(DATABASE_NAME)
  .collection<MyDocument>(COLLECTION_NAME);

export async function extendGivenContext(
  source: string,
  fromLines: number,
  toLines: number,
) {
  try {
    await client.connect();

    const documents = await collection
      .find(
        {
          $and: [
            {
              source: source,
            },
            {
              "loc.lines.from": {
                $gte: fromLines,
              },
            },
            { "loc.lines.to": { $lte: toLines } },
          ],
        },
        {
          sort: { "loc.lines.from": 1 },
          projection: {
            text: 1,
            _id: 1,
            source: 1,
            fromLine: "$loc.lines.from",
            toLine: "$loc.lines.to",
          },
        },
      )
      .toArray();

    return documents;
  } finally {
    await client.close();
  }
}

export const vectorStore = new MongoDBAtlasVectorSearch(defaultEmbeddingModel, {
  //@ts-ignore
  collection: collection as Collection<Document>,
  indexName: "vector_index",
  textKey: "text",
  embeddingKey: "embedding",
});

export async function getAllDocuments() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();

    const collection = client.db(DATABASE_NAME).collection(COLLECTION_NAME);

    const documents = await collection
      .find(
        {},
        {
          projection: {
            text: 1,
            _id: 1,
            source: 1,
            FromLine: "$loc.lines.from",
            ToLine: "$loc.lines.to",
          },
        },
      )
      .toArray();

    return documents;
  } finally {
    await client.close();
  }
}

export async function persistQueryResult(
  queryResult: string,
  queryReasoning: string,
  userQuery: string,
  searchType?: string,
  threadId?: string,
) {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();

    const collection = client
      .db(DATABASE_NAME)
      .collection(HISTORY_COLLECTION_NAME);

    const documents = await collection.insertOne({
      queryResult,
      queryReasoning,
      userQuery,
      searchType,
      createdAt: new Date(),
      threadId,
    });

    return documents?.insertedId || "no result";
  } finally {
    await client.close();
  }
}

export async function findQueryResult(userQuery: string, searchType: string) {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();

    const collection = client
      .db(DATABASE_NAME)
      .collection(HISTORY_COLLECTION_NAME);

    const documents = await collection.findOne({
      userQuery,
      searchType,
    });

    return documents || { message: "No result found" };
  } finally {
    await client.close();
  }
}

export async function findHistory() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();

    const collection = client
      .db(DATABASE_NAME)
      .collection(HISTORY_COLLECTION_NAME);

    const documents = await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(15)
      .toArray();

    return documents || { message: "No result found" };
  } finally {
    await client.close();
  }
}
