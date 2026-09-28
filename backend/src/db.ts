import { MongoClient, Db } from "mongodb";
import { DATABASE_NAME, MONGO_URI } from "./mongo/mongoClientFactory.js";

const client = new MongoClient(MONGO_URI);

let db: Db;

export async function connectDB() {
  await client.connect();

  db = client.db(DATABASE_NAME);

  console.log("MongoDB connected");
}

export function getDB(): Db {
  if (!db) {
    throw new Error("Database not initialized");
  }

  return db;
}
