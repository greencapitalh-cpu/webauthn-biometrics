import { randomBase64 } from "./crypto.js";

/**
 * Genera un challenge aleatorio de 32 bytes codificado en base64url.
 */
export const generateChallenge = () => randomBase64(32);

/**
 * Crea las opciones para el registro (enroll) del autenticador WebAuthn.
 * Fuerza el uso de autenticador local (huella/FaceID) y desactiva opciones remotas
 * como Google Password Manager o Samsung Pass.
 */
export const publicKeyOptions = (challenge, userId, userName) => ({
  challenge,
  rp: {
    name: "BioID WebAuthn",
    id: "webauthn-biometrics.onrender.com", // dominio exacto de tu deploy
  },
  user: {
    id: Buffer.from(userId).toString("base64url"),
    name: userName || "anonymous",
    displayName: userName || "Anonymous User",
  },
  pubKeyCredParams: [
    { type: "public-key", alg: -7 },  // ES256
    { type: "public-key", alg: -257 } // RS256 (opcional)
  ],
  timeout: 60000,
  authenticatorSelection: {
    authenticatorAttachment: "platform", // 🔹 Forzar biometría local del dispositivo
    residentKey: "preferred",            // Permite recordar la clave en el dispositivo
    userVerification: "required",        // Siempre requiere huella / Face ID
  },
  attestation: "none",
});
