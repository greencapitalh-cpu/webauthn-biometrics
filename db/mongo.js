import { MongoClient } from "mongodb";

let db, users;
export async function connectDB() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db("udochain");
    users = db.collection("bioid_users");
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB error:", err.message);
  }
}
export function getUsers() {
  return users;
}
