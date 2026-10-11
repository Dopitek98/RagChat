import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { Collection, MongoClient } from "mongodb";
import { defaultEmbeddingModel } from "../models/models.js";
import { MongoHistoryInput, MyDocument } from "../types/types.js";

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

type ExtendedDocument = MyDocument & {
  fromLine: number;
  toLine: number;
};

export async function extendGivenContext(
  source: string,
  fromLines: number,
  toLines: number,
): Promise<ExtendedDocument[]> {
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
            _id: 0,
            source: 1,
            fromLine: "$loc.lines.from",
            toLine: "$loc.lines.to",
          },
        },
      )
      .toArray();

    return documents as unknown as ExtendedDocument[];
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
  retrievedContext?: MongoHistoryInput[],
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
      retrievedContext,
    });

    return documents?.insertedId || "no result";
  } finally {
    await client.close();
  }
}

export async function findQueryResult(
  userQuery: string,
  searchType: string,
  threadId?: string,
) {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();

    const collection = client
      .db(DATABASE_NAME)
      .collection(HISTORY_COLLECTION_NAME);

    const documents = await collection.findOne({
      userQuery,
      searchType,
      threadId: threadId || { $exists: false },
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
      .sort({ createdAt: 1 })
      .toArray();

    const conversations = new Map<string, any>();

    for (const document of documents) {
      const threadId =
        typeof document.threadId === "string" && document.threadId.trim()
          ? document.threadId
          : `history-entry:${document._id.toString()}`;
      const existingConversation = conversations.get(threadId);

      if (existingConversation) {
        existingConversation.messageCount += 1;
        existingConversation.messages.push(document);
        continue;
      }

      conversations.set(threadId, {
        _id: document._id,
        createdAt: document.createdAt,
        threadId,
        messageCount: 1,
        messages: [document],
      });
    }

    return {
      entries: [...conversations.values()].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      ),
    };
  } finally {
    await client.close();
  }
}
