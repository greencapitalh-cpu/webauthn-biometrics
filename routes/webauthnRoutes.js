import express from "express";
import { generateChallenge, publicKeyOptions } from "../utils/webauthn.js";
import { sha256Hex } from "../utils/crypto.js";
import { getCredentials } from "../db/mongo.js";

const router = express.Router();

// --- ENROLL START ---
router.post("/enroll/start", (req, res) => {
  const { userId = "anonymous", userName = "User" } = req.body;
  const challenge = generateChallenge();
  const options = publicKeyOptions(challenge, userId, userName);
  res.json(options);
});

// --- ENROLL FINISH ---
router.post("/enroll/finish", async (req, res) => {
  try {
    const { id, userId = "anonymous" } = req.body;
    if (!id) return res.status(400).json({ ok: false, error: "Missing credential ID" });

    const hash = sha256Hex(id);
    const col = getCredentials();

    await col.updateOne(
      { userId },
      { $set: { userId, credentialId: id, hash, updatedAt: new Date() } },
      { upsert: true }
    );

    res.json({ ok: true, hash });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// --- VERIFY START ---
router.post("/verify/start", (_, res) => {
  const challenge = generateChallenge();
  res.json({ challenge });
});

// --- VERIFY FINISH ---
router.post("/verify/finish", async (req, res) => {
  try {
    const { id, userId = "anonymous" } = req.body;
    if (!id) return res.status(400).json({ ok: false, error: "Missing credential ID" });

    const record = await getCredentials().findOne({ userId, credentialId: id });
    if (!record) return res.status(404).json({ ok: false, error: "Credential not found" });

    res.json({ ok: true, hash: record.hash });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
