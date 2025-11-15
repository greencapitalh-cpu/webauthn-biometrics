import { sha256Hex } from "../utils/crypto.js";
import { getUsers } from "../db/mongo.js";

// ======================================================
// 🔍 Check enrollment status
// ======================================================
export async function checkStatus(req, res) {
  const { userId } = req.params;
  const user = await getUsers().findOne({ userId });
  res.json({ enrolled: !!user, hash: user?.bioidHash || null });
}

// ======================================================
// 🧬 Start enrollment
// ======================================================
export async function startEnroll(req, res) {
  const { userId } = req.body;
  const existing = await getUsers().findOne({ userId });
  if (existing) return res.json({ ok: true, redirect: "/verify.html" });
  res.json({ ok: true, next: "webauthn" });
}

// ======================================================
// 🧩 Finish enrollment
// ======================================================
export async function finishEnroll(req, res) {
  const { userId, webauthnId, data } = req.body;
  const bioidHash = sha256Hex(webauthnId);

  const {
    firstName,
    lastName,
    documentType,
    documentNumber,
    nationality,
    residence,
    birthdate,
    companyName,
  } = data;

  await getUsers().updateOne(
    { userId },
    {
      $set: {
        userId,
        bioidHash,
        firstName,
        lastName,
        documentType,
        documentNumber,
        nationality,
        residence,
        birthdate,
        companyName: companyName || "",
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  res.json({ ok: true, bioidHash });
}

// ======================================================
// 🔐 Start verification
// ======================================================
export async function startVerify(req, res) {
  res.json({ challenge: Math.random().toString(36).substring(2) });
}

// ======================================================
// ✅ Finish verification
// ======================================================
export async function finishVerify(req, res) {
  const { userId, webauthnId } = req.body;
  const user = await getUsers().findOne({ userId });
  if (!user || !webauthnId) return res.status(400).json({ ok: false });
  const match = sha256Hex(webauthnId) === user.bioidHash;
  res.json({ ok: match, bioidHash: user.bioidHash });
}

// ======================================================
// 📄 Get user info by hash
// ======================================================
export async function getUserByHash(req, res) {
  try {
    const { hash } = req.params;
    const user = await getUsers().findOne({ bioidHash: hash });
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });

    res.json({
      ok: true,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      companyName: user.companyName || "",
      documentType: user.documentType || "",
      documentNumber: user.documentNumber || "",
      birthdate: user.birthdate || "",
      nationality: user.nationality || "",
      residence: user.residence || "",
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

// ======================================================
// ✏️ updateUserData — Edit existing user information
// ======================================================
export async function updateUserData(req, res) {
  try {
    const { userId, data } = req.body;
    if (!userId) return res.status(400).json({ ok: false, error: "Missing userId" });

    const result = await getUsers().updateOne(
      { userId },
      {
        $set: {
          firstName: data.firstName,
          lastName: data.lastName,
          documentType: data.documentType,
          documentNumber: data.documentNumber,
          nationality: data.nationality,
          residence: data.residence,
          birthdate: data.birthdate,
          companyName: data.companyName || "",
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0)
      return res.status(404).json({ ok: false, error: "User not found" });

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ updateUserData error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
