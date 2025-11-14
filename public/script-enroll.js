const form = document.getElementById("enrollForm");
const status = document.getElementById("status");

// Bloqueo simple por token (igual que WAPP)
const params = new URLSearchParams(window.location.search);
const token = params.get("token") || localStorage.getItem("token");
if (!token) window.location.href = "https://app.udochain.com";
if (token) localStorage.setItem("token", token);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  status.textContent = "⏳ Starting enrollment...";
  const formData = Object.fromEntries(new FormData(form).entries());
  const userId = token; // simplificado: se asocia al token

  try {
    const start = await fetch("/api/bioid/enroll/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, data: formData }),
    });

    const res = await start.json();
    if (!res.ok) throw new Error("Failed to start enrollment");

    // Iniciar biometría WebAuthn
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge: new Uint8Array(32),
        rp: { name: "UDoChain BioID", id: "bioid.udochain.com" },
        user: {
          id: new TextEncoder().encode(userId),
          name: userId,
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

    const webauthnId = cred.id;
    const finish = await fetch("/api/bioid/enroll/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, webauthnId, data: formData }),
    });

    const result = await finish.json();
    if (result.ok) {
      status.textContent = "✅ Biometric enrolled successfully. Redirecting...";
      setTimeout(() => {
        window.location.href = `/verify.html?token=${token}&bioidHash=${result.bioidHash}`;
      }, 1200);
    } else {
      throw new Error(result.error || "Enrollment failed");
    }
  } catch (err) {
    console.error(err);
    status.textContent = `❌ Error: ${err.message}`;
  }
});
