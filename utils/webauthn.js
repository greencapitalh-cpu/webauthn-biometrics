import { randomBase64 } from "./crypto.js";

/**
 * Genera un desafío aleatorio (challenge) para WebAuthn.
 */
export const generateChallenge = () => randomBase64(32);

/**
 * Configuración pública del registro (enroll) de WebAuthn.
 * Se ajusta al dominio bioid.udochain.com.
 */
export const publicKeyOptions = (challenge, userId, userName) => ({
  challenge,
  rp: {
    name: "UDoChain BioID",
    id: "bioid.udochain.com", // ✅ RP ID fijo del dominio
  },
  user: {
    id: Buffer.from(userId).toString("base64url"),
    name: userName || "anonymous",
    displayName: userName || "Anonymous User",
  },
  pubKeyCredParams: [
    { type: "public-key", alg: -7 },   // ES256 (ECDSA)
    { type: "public-key", alg: -257 }, // RS256 (RSA)
  ],
  timeout: 60000,
  authenticatorSelection: {
    authenticatorAttachment: "platform",  // FaceID, TouchID o PIN del dispositivo
    residentKey: "preferred",
    userVerification: "required",
  },
  attestation: "none",
});

/**
 * Configuración pública de la verificación (login) de WebAuthn.
 */
export const publicKeyRequestOptions = (challenge, credentials) => ({
  challenge,
  allowCredentials: credentials.map((cred) => ({
    id: cred.credentialId,
    type: "public-key",
  })),
  timeout: 60000,
  userVerification: "required",
});
