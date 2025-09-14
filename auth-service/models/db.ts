import { MongoClient } from "mongodb";

let client;

export async function connectToDB() {
  const mongoDBUri =
    process.env.ENV === "PROD"
      ? process.env.DB_CLOUD_URI
      : process.env.DB_LOCAL_URI;

  if (!mongoDBUri) {
    throw new Error("MongoDB URI is not defined in environment variables.");
  }

  if (!client) {
    client = new MongoClient(mongoDBUri);
    await client.connect();
    console.log("✅ MongoDB connected via native driver");
  }

  return client;
}

// Export the client for Better Auth
export { client };