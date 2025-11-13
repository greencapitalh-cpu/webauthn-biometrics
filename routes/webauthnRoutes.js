import express from "express";
import { generateChallenge, publicKeyOptions, publicKeyRequestOptions } from "../utils/webauthn.js";
import { sha256Hex } from "../utils/crypto.js";
import { getCredentials } from "../db/mongo.js";

const router = express.Router();

// 🧠 Memoria temporal de desafíos (por usuario)
const challenges = new Map();

// --- ENROLL START ---
router.post("/enroll/start", (req, res) => {
  try {
    const { userId = "anonymous", userName = "User" } = req.body;
    const challenge = generateChallenge();
    challenges.set(userId, challenge);

    // ✅ Tomar host dinámico (funciona desde validate/app también)
    const host = req.get("origin") || req.get("host") || "https://bioid.udochain.com";
    const options = publicKeyOptions(challenge, userId, userName, host);

    return res.json(options);
  } catch (err) {
    console.error("❌ ENROLL START error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
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
      {
        $set: {
          userId,
          credentialId: id,
          hash,
          challenge: challenges.get(userId) || null,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    challenges.delete(userId);
    return res.json({ ok: true, hash });
  } catch (err) {
    console.error("❌ ENROLL FINISH error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// --- VERIFY START ---
router.post("/verify/start", async (req, res) => {
  try {
    const { userId = "anonymous" } = req.body;
    const challenge = generateChallenge();
    challenges.set(userId, challenge);

    const creds = await getCredentials().find({ userId }).toArray();
    const options = publicKeyRequestOptions(challenge, creds);

    return res.json(options);
  } catch (err) {
    console.error("❌ VERIFY START error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// --- VERIFY FINISH ---
router.post("/verify/finish", async (req, res) => {
  try {
    const { id, userId = "anonymous" } = req.body;
    if (!id) return res.status(400).json({ ok: false, error: "Missing credential ID" });

    const record = await getCredentials().findOne({ userId, credentialId: id });
    if (!record) return res.status(404).json({ ok: false, error: "Credential not found" });

    // ✅ Retorna hash para Validate
    return res.json({ ok: true, hash: record.hash });
  } catch (err) {
    console.error("❌ VERIFY FINISH error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
