import { randomBase64 } from "./crypto.js";

export const generateChallenge = () => randomBase64(32);

export const publicKeyOptions = (challenge) => ({
  challenge,
  rp: { name: "Render WebAuthn Demo" },
  user: {
    id: randomBase64(16),
    name: "anonymous",
    displayName: "Anonymous User",
  },
  pubKeyCredParams: [{ type: "public-key", alg: -7 }],
  timeout: 60000,
  attestation: "direct",
});
