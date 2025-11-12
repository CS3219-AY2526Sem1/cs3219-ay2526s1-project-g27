# /*
# AI Assistance Disclosure:
# Tool: ChatGPT (model: GPT‑5), Claude 4.5 Sonnet 
# Scope: 
# - Template code, iterated on it 
# Author review: 
# - Verify through running 
# - Code inspection and changes as needed 
# */

import { MongoClient, Db, Collection } from "mongodb";
import { UserProfile, UserAuth } from "../models/Profile";

let client: MongoClient;
let db: Db; 



export async function connectToDatabase() {
  const mongoDBUri = process.env.DB_LOCAL_URI;
  const dbName = process.env.DB_NAME;

  if (!mongoDBUri) {
    throw new Error("DB_LOCAL_URI is not defined in environment variables.");
  }
  if (!dbName) {
    throw new Error("DB_NAME is not defined in environment variables.");
  }

  if (!client) {
    try {
      client = new MongoClient(mongoDBUri);
      await client.connect();
      console.log("MongoDB connected via native driver");
      
      db = client.db(dbName);
      await createIndexes();

    } catch (error) {
      console.error("Failed to connect to MongoDB", error);
      throw error;
    }
  }
  return { client, db };
}

async function createIndexes() {
  const profileCollection = db.collection<UserProfile>("profiles");
  await profileCollection.createIndex({ userId: 1 }, { unique: true });
  console.log("Indexes created");
}


export function getDatabase(): Db {
  if (!db) {
    throw new Error("Database not initialized. Call connectToDatabase first.");
  }
  return db;
}

export function getProfileCollection(): Collection<UserProfile> {
  return getDatabase().collection<UserProfile>("profiles");
}
export function getUserCollection(): Collection<UserAuth> {
  return getDatabase().collection<UserAuth>("user");
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    console.log("MongoDB connection closed");
  }
}