import { MongoClient } from "mongodb";

let db, credentials;

export async function connectDB() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db("webauthn");
    credentials = db.collection("credentials");
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
  }
}

export function getCredentials() {
  return credentials;
}
