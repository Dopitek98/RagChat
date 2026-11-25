import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { Collection, MongoClient, ObjectId } from "mongodb";
import { defaultEmbeddingModel } from "../models/models.js";
import {
  CodeContentResult,
  MongoHistoryInput,
  MyDocument,
} from "../types/types.js";

export const DATABASE_NAME = "Embedding";
//export const COLLECTION_NAME = "Document";
export const DOCUMENT_COLLECTION_NAME = "Document2";
export const HISTORY_COLLECTION_NAME = "History";
export const HIERARCHY_COLLECTION_NAME = "Hierarchy";
export const DEFAULT_CHUNK_EXTENSION = 30; // Number of lines to extend the context by
export const SMALL_CHUNK_EXTENSION = 3; // Number of lines to extend the context by
export const MONGO_URI =
  process.env.MONGO_URI ??
  "mongodb://admin:admin@localhost:27017/admin?directConnection=true";

export const client = new MongoClient(MONGO_URI);

export const documentCollection = client
  .db(DATABASE_NAME)
  .collection<MyDocument>(DOCUMENT_COLLECTION_NAME);

export const hierarchyCollection = client
  .db(DATABASE_NAME)
  .collection<any>(HIERARCHY_COLLECTION_NAME);

export type RelatedHierarchyDocument = {
  _id: ObjectId;
  source: string | null;
  name: string | null;
  parentName: string | null;
  description: string | null;
  type?: string | null;
};

export async function getHierarchyDocumentsByIds(
  ids: ObjectId[],
): Promise<RelatedHierarchyDocument[]> {
  if (ids.length === 0) return [];

  try {
    await client.connect();

    const documents = await hierarchyCollection
      .find(
        { _id: { $in: ids } },
        {
          projection: {
            _id: 1,
            source: 1,
            name: 1,
            parentName: 1,
            description: 1,
            type: 1,
          },
        },
      )
      .toArray();

    return documents.map((document) => ({
      _id: document._id,
      source: document.source ?? null,
      name: document.name ?? null,
      parentName: document.parentName ?? null,
      description: document.description ?? null,
      type: document.type ?? null,
    }));
  } finally {
    await client.close();
  }
}

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

    const documents = await documentCollection
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

export const documentVectorStore = new MongoDBAtlasVectorSearch(
  defaultEmbeddingModel,
  {
    //@ts-ignore
    collection: documentCollection as Collection<Document>,
    indexName: "vector_index",
    textKey: "text",
    embeddingKey: "embedding",
  },
);

export const hierarchyVectorStore = new MongoDBAtlasVectorSearch(
  defaultEmbeddingModel,
  {
    //@ts-ignore
    collection: hierarchyCollection as Collection<Document>,
    indexName: "vector_index",
    textKey: "text",
    embeddingKey: "embedding",
  },
);
export async function getAllDocuments() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();

    const collection = client
      .db(DATABASE_NAME)
      .collection(DOCUMENT_COLLECTION_NAME);

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

export async function getAllHierarchyKeywords(): Promise<CodeContentResult[]> {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const documents = await client
      .db(DATABASE_NAME)
      .collection(HIERARCHY_COLLECTION_NAME)
      .find(
        {},
        {
          projection: {
            level: 1,
            keywords: 1,
            name: 1,
            parentName: 1,
            child: 1,
            description: 1,
            source: 1,
          },
        },
      )
      .toArray();

    return documents.map((doc) => ({
      content: {
        id: doc._id,
        level: doc.level,
        keywords: Array.isArray(doc.keywords)
          ? doc.keywords.filter(
              (keyword: unknown): keyword is string =>
                typeof keyword === "string",
            )
          : null,
        score: 0,
        name: doc.name,
        parentName: doc.parentName ?? null,
        child: doc.child ?? null,
        description: doc.description ?? null,
        source: doc.source ?? null,
      },
    }));
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
