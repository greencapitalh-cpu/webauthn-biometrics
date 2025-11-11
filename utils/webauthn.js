import { randomBase64 } from "./crypto.js";

/**
 * Genera un desafío aleatorio para WebAuthn
 */
export const generateChallenge = () => randomBase64(32);

/**
 * Opciones públicas para el registro (enroll) WebAuthn
 */
export const publicKeyOptions = (challenge, userId, userName) => ({
  challenge,
  rp: {
    name: "UDoChain BioID",
    id: "udochain.com", // ✅ permite subdominios: bioid, app, validate...
  },
  user: {
    id: Buffer.from(userId).toString("base64url"),
    name: userName || "anonymous",
    displayName: userName || "Anonymous User"
  },
  pubKeyCredParams: [
    { type: "public-key", alg: -7 }, // ES256
    { type: "public-key", alg: -257 } // RS256
  ],
  timeout: 60000,
  authenticatorSelection: {
    authenticatorAttachment: "platform",
    residentKey: "preferred",
    userVerification: "required"
  },
  attestation: "none"
});
