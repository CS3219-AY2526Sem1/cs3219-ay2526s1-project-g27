import { MongoClient, Db } from "mongodb";

let client: MongoClient;
let db: Db; 

export async function connectToDB() {
  const mongoDBUri = process.env.DB_LOCAL_URI; // Simplified for Docker context
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
      
      // Select the specific database and store it
      db = client.db(dbName);

    } catch (error) {
      console.error("Failed to connect to MongoDB", error);
      process.exit(1);
    }
  }
  return client;
}

export { db };