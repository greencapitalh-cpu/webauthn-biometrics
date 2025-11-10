import { randomBase64 } from "./crypto.js";

export const generateChallenge = () => randomBase64(32);

export const publicKeyOptions = (challenge, userId, userName) => ({
  challenge,
  rp: {
    name: "BioID WebAuthn",
    id: "webauthn-biometrics.onrender.com"
  },
  user: {
    id: Buffer.from(userId).toString("base64url"),
    name: userName || "anonymous",
    displayName: userName || "Anonymous User"
  },
  pubKeyCredParams: [{ type: "public-key", alg: -7 }],
  timeout: 60000,
  authenticatorSelection: {
    authenticatorAttachment: "platform",
    residentKey: "preferred",
    userVerification: "required"
  },
  attestation: "none"
});
