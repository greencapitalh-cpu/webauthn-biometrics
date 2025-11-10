import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";
import { generateChallenge, publicKeyOptions } from "./utils/webauthn.js";
import { sha256Hex } from "./utils/crypto.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// --- MongoDB connection ---
const client = new MongoClient(process.env.MONGODB_URI);
let db, credentials;

async function connectDB() {
  try {
    await client.connect();
    db = client.db("webauthn");
    credentials = db.collection("credentials");
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
}
connectDB();

// --- Health check ---
app.get("/healthz", (_, res) => res.json({ ok: true }));

// --- ENROLL START ---
app.post("/api/webauthn/enroll/start", (_, res) => {
  const challenge = generateChallenge();
  const options = publicKeyOptions(challenge);
  res.json(options);
});

// --- ENROLL FINISH ---
app.post("/api/webauthn/enroll/finish", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ ok: false, error: "Missing credential ID" });

    const hash = sha256Hex(id);
    await credentials.updateOne(
      { credentialId: id },
      { $set: { credentialId: id, hash, updatedAt: new Date() } },
      { upsert: true }
    );

    console.log(`[REGISTER] ${id} -> ${hash}`);
    res.json({ ok: true, hash });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- VERIFY START ---
app.post("/api/webauthn/verify/start", (_, res) => {
  const challenge = generateChallenge();
  res.json({ challenge });
});

// --- VERIFY FINISH ---
app.post("/api/webauthn/verify/finish", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ ok: false, error: "Missing credential ID" });

    const record = await credentials.findOne({ credentialId: id });
    if (!record) return res.status(404).json({ ok: false, error: "Credential not found" });

    console.log(`[VERIFY] ${id} verified`);
    res.json({ ok: true, hash: record.hash });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ WebAuthn server running on port ${PORT}`));
