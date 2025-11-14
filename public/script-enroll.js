const form = document.getElementById("enrollForm");
const status = document.getElementById("status");

// 🔐 Token lock (igual que WAPP)
const params = new URLSearchParams(window.location.search);
const token = params.get("token") || localStorage.getItem("token");
if (!token) window.location.href = "https://app.udochain.com";
if (token) localStorage.setItem("token", token);

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
    bioidUserId = token; // o podés usar crypto.randomUUID() si querés algo único
    localStorage.setItem("bioidUserId", bioidUserId);
  }
  const userId = bioidUserId;

  try {
    // --- Iniciar en backend ---
    const start = await fetch("/api/bioid/enroll/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, data: formData }),
    });

    const res = await start.json();
    if (!res.ok) throw new Error("Failed to start enrollment");

    // ======================================================
    // 🧬 Generar user handle (máx. 64 bytes)
    // ======================================================
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

    // 🧩 Guardar credencial localmente para futuras verificaciones
    const credentialId = cred.id;
    localStorage.setItem("bioidCredentialId", credentialId);
    console.log("💾 Stored credentialId:", credentialId);

    // ======================================================
    // 💾 Finalizar registro en backend
    // ======================================================
    const finish = await fetch("/api/bioid/enroll/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, webauthnId: credentialId, data: formData }),
    });

    const result = await finish.json();
    if (result.ok) {
      status.textContent = "✅ Biometric enrolled successfully. Redirecting...";
      setTimeout(() => {
        // 🔁 FIX: redirige limpio a /verify (sin .html)
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
