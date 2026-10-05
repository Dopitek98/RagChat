import { MemorySaver } from "@langchain/langgraph";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { client, DATABASE_NAME } from "../mongo/mongoClientFactory.js";

export const checkpointer = new MemorySaver();

export async function createMongoDBCheckpointer() {
  await client.connect();

  return new MongoDBSaver({
    client,
    dbName: DATABASE_NAME,
    checkpointCollectionName: "checkpoints",
  });
}
