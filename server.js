import express from "express";
import cors from "cors";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { generateChallenge, publicKeyOptions } from "./utils/webauthn.js";
import { sha256Hex } from "./utils/crypto.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const credentials = new Map();

// Health check
app.get("/healthz", (req, res) => res.json({ ok: true }));

// --- ENROLL START ---
app.post("/api/webauthn/enroll/start", (req, res) => {
  const challenge = generateChallenge();
  const options = publicKeyOptions(challenge);
  res.json(options);
});

// --- ENROLL FINISH ---
app.post("/api/webauthn/enroll/finish", (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ ok: false, error: "Missing credential ID" });

    const hash = sha256Hex(id);
    credentials.set(id, hash);
    console.log(`[REGISTER] Stored credential: ${id} => ${hash}`);
    res.json({ ok: true, hash });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- VERIFY START ---
app.post("/api/webauthn/verify/start", (req, res) => {
  const challenge = generateChallenge();
  res.json({ challenge });
});

// --- VERIFY FINISH ---
app.post("/api/webauthn/verify/finish", (req, res) => {
  try {
    const { id } = req.body;
    if (!id || !credentials.has(id))
      return res.status(404).json({ ok: false, error: "Credential not found" });

    const hash = credentials.get(id);
    console.log(`[VERIFY] Credential verified: ${id}`);
    res.json({ ok: true, hash });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ WebAuthn server running on port ${PORT}`));
