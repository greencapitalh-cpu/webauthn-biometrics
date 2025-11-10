import express from "express";
import crypto from "crypto";

const router = express.Router();

// Almacenamiento temporal en memoria (sin DB aún)
const userCredentials = new Map();

/**
 * Genera un challenge aleatorio en formato base64url
 */
const generateChallenge = (length = 32) =>
  crypto.randomBytes(length).toString("base64url");

/**
 * POST /api/webauthn/enroll/start
 * Genera un challenge inicial para el registro biométrico
 */
router.post("/enroll/start", (req, res) => {
  const challenge = generateChallenge();
  const rp = {
    name: "BioID WebAuthn",
    id: "webauthn-biometrics.onrender.com",
  };

  // 🟢 Devolver challenge y parámetros de registro
  res.json({
    challenge,
    rp,
    user: {
      id: crypto.randomBytes(16).toString("base64url"),
      name: "test-user",
      displayName: "Test User",
    },
  });
});

/**
 * POST /api/webauthn/enroll/finish
 * Recibe la credencial creada y genera un hash del credentialId
 */
router.post("/enroll/finish", (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "Missing credential id" });

    const hash = crypto.createHash("sha256").update(id).digest("hex");
    userCredentials.set(id, { id, hash });

    res.json({ ok: true, hash });
  } catch (err) {
    console.error("Enroll finish error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/webauthn/verify/start
 * Devuelve un nuevo challenge para autenticación
 */
router.post("/verify/start", (req, res) => {
  const challenge = generateChallenge();
  res.json({ challenge });
});

/**
 * POST /api/webauthn/verify/finish
 * Verifica si la credencial existe y devuelve el hash asociado
 */
router.post("/verify/finish", (req, res) => {
  const { id } = req.body;

  if (!id) return res.status(400).json({ error: "Missing credential id" });

  const record = userCredentials.get(id);
  if (!record)
    return res.status(404).json({ error: "Credential not found" });

  res.json({ ok: true, hash: record.hash });
});

export default router;
