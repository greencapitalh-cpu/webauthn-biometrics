// 🧬 MÓDULO: webauthn-biometrics
// 📄 Archivo: db/mongo.js

import { MongoClient } from "mongodb";

let db, credentials;

export async function connectDB() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db("webauthn");
    credentials = db.collection("credentials");
    console.log("✅ MongoDB conectado (BioID)");
  } catch (err) {
    console.error("❌ Error MongoDB:", err.message);
  }
}

export function getCredentials() {
  return credentials;
}
