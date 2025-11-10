import express from "express";
import crypto from "crypto";

const router = express.Router();

// 🧠 Guardado temporal en memoria (se reinicia en cada deploy)
const userCredentials = new Map();

// 🔸 Genera un challenge aleatorio
const generateChallenge = (length = 32) =>
  crypto.randomBytes(length).toString("base64url");

// --- Registro de credencial ---
router.post("/enroll/start", (req, res) => {
  const challenge = generateChallenge();
  const rp = {
    name: "BioID WebAuthn",
    id: "webauthn-biometrics.onrender.com"
  };

  res.json({
    challenge,
    rp,
    user: {
      id: crypto.randomBytes(16).toString("base64url"),
      name: "test-user",
      displayName: "Test User"
    }
  });
});

router.post("/enroll/finish", (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "Missing credential id" });

    const hash = crypto.createHash("sha256").update(id).digest("hex");
    userCredentials.set(id, { id, hash });
    console.log("✅ Credential stored:", id);

    res.json({ ok: true, hash });
  } catch (err) {
    console.error("Enroll error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- Verificación de credencial ---
router.post("/verify/start", (req, res) => {
  const challenge = generateChallenge();
  res.json({ challenge });
});

router.post("/verify/finish", (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing credential id" });

  const record = userCredentials.get(id);
  if (!record)
    return res.status(404).json({ error: "Credential not found" });

  res.json({ ok: true, hash: record.hash });
});

export default router;
