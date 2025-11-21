const form = document.getElementById("enrollForm");
const status = document.getElementById("status");

// 🔐 Token lock (igual que WAPP)
const params = new URLSearchParams(window.location.search);
const token = params.get("token") || localStorage.getItem("token");
const emailFromUrl = params.get("email");
if (!token) window.location.href = "https://app.udochain.com";
if (token) localStorage.setItem("token", token);
if (emailFromUrl) localStorage.setItem("userEmail", emailFromUrl);

// ======================================================
// 🚀 Enrollment Flow
// ======================================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  status.textContent = "⏳ Starting enrollment...";
  const formData = Object.fromEntries(new FormData(form).entries());

  // 🔖 Persistir userId local si no existe
  let bioidUserId = localStorage.getItem("bioidUserId");
  if (!bioidUserId) {
    bioidUserId = token;
    localStorage.setItem("bioidUserId", bioidUserId);
  }
  const userId = bioidUserId;
  const userEmail = localStorage.getItem("userEmail") || null;

  try {
    // --- Iniciar en backend ---
    const start = await fetch("/api/bioid/enroll/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, data: formData }),
    });

    const res = await start.json();
    if (!res.ok) throw new Error("Failed to start enrollment");

    async function getUserHandle(id) {
      const msgUint8 = new TextEncoder().encode(id);
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
      return new Uint8Array(hashBuffer).slice(0, 32);
    }

    const handle = await getUserHandle(userId);
    console.log("✅ User handle length:", handle.length, "bytes");

    // ======================================================
    // 🔐 Crear credencial WebAuthn
    // ======================================================
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge: new Uint8Array(32),
        rp: { name: "UDoChain BioID", id: "bioid.udochain.com" },
        user: {
          id: handle,
          name: userId.slice(0, 64),
          displayName: `${formData.firstName} ${formData.lastName}`,
        },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }],
        timeout: 60000,
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        attestation: "none",
      },
    });

    const credentialId = cred.id;
    localStorage.setItem("bioidCredentialId", credentialId);

    // ======================================================
    // 💾 Finalizar registro en backend (ahora con email)
    // ======================================================
    const finish = await fetch("/api/bioid/enroll/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        webauthnId: credentialId,
        data: formData,
        userEmail, // ✅ enviado al backend
      }),
    });

    const result = await finish.json();
    if (result.ok) {
      status.textContent = "✅ Biometric enrolled successfully. Redirecting...";
      setTimeout(() => {
        window.location.href = `/verify?token=${token}&bioidHash=${result.bioidHash}`;
      }, 1200);
    } else {
      throw new Error(result.error || "Enrollment failed");
    }
  } catch (err) {
    console.error(err);
    status.textContent = `❌ Error: ${err.message}`;
  }
});
