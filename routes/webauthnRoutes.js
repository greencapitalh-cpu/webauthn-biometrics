import express from "express";
import base64url from "base64url";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { getCredentials } from "../db/mongo.js";

const router = express.Router();
const rpID = "bioid.udochain.com";
const origin = `https://${rpID}`;
const rpName = "UDoChain BioID";

/**
 * 🧬 Registro biométrico — Paso 1
 */
router.post("/enroll/start", async (req, res) => {
  const { userId = "anonymous", userName = "User" } = req.body;
  const col = getCredentials();

  const options = generateRegistrationOptions({
    rpName,
    rpID,
    userID: userId,
    userName,
    attestationType: "none",
    authenticatorSelection: { userVerification: "preferred" },
  });

  await col.updateOne(
    { userId },
    { $set: { currentChallenge: options.challenge } },
    { upsert: true }
  );

  res.json({ ok: true, options });
});

/**
 * 🧬 Registro biométrico — Paso 2
 */
router.post("/enroll/finish", async (req, res) => {
  const { userId, attResp } = req.body;
  const col = getCredentials();
  const user = await col.findOne({ userId });

  try {
    const verification = await verifyRegistrationResponse({
      response: attResp,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified)
      return res.status(400).json({ ok: false, error: "Verification failed" });

    const { credentialPublicKey, credentialID } = verification.registrationInfo;

    await col.updateOne(
      { userId },
      {
        $set: {
          credentialID: base64url.encode(credentialID),
          publicKey: base64url.encode(credentialPublicKey),
          counter: 0,
          updatedAt: new Date(),
        },
      }
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * 🔐 Verificación biométrica — Paso 1
 */
router.post("/verify/start", async (req, res) => {
  const { userId } = req.body;
  const col = getCredentials();
  const user = await col.findOne({ userId });

  if (!user?.credentialID)
    return res.status(404).json({ ok: false, error: "User not registered" });

  const options = generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
  });

  await col.updateOne({ userId }, { $set: { currentChallenge: options.challenge } });

  res.json({ ok: true, options });
});

/**
 * 🔐 Verificación biométrica — Paso 2 (retorna a Validate)
 */
router.post("/verify/finish", async (req, res) => {
  const { userId, authResp, redirect } = req.body;
  const col = getCredentials();
  const user = await col.findOne({ userId });

  if (!user)
    return res.status(404).json({ ok: false, error: "User not found" });

  try {
    const verification = await verifyAuthenticationResponse({
      response: authResp,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialPublicKey: base64url.toBuffer(user.publicKey),
        credentialID: base64url.toBuffer(user.credentialID),
        counter: user.counter,
      },
    });

    if (!verification.verified)
      return res.status(400).json({ ok: false, error: "Verification failed" });

    await col.updateOne(
      { userId },
      { $set: { counter: verification.authenticationInfo.newCounter } }
    );

    const hash = base64url.encode(
      Buffer.from(verification.authenticationInfo.newCounter.toString())
    );

    // ✅ Redirigir de vuelta a Validate con el hash biométrico
    const redirectUrl = redirect || "https://validate.udochain.com";
    res.redirect(`${redirectUrl}?bioidHash=${hash}`);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
