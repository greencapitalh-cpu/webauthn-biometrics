const status = document.getElementById("status");
const btn = document.getElementById("verifyBtn");

const params = new URLSearchParams(window.location.search);
const token = params.get("token") || localStorage.getItem("token");
const file = params.get("file");
const hash = params.get("hash");
const bioidHashFromUrl = params.get("bioidHash");

if (!token) window.location.href = "https://app.udochain.com";
if (token) localStorage.setItem("token", token);

btn.onclick = async () => {
  status.textContent = "🔐 Authenticating...";

  try {
    const userId = token;

    // === 1️⃣ Verificar si el usuario tiene BioID registrado ===
    const check = await fetch(`/api/bioid/status/${userId}`);
    const checkData = await check.json();

    if (!checkData.enrolled) {
      status.textContent = "⚠️ No biometric record found. Redirecting to enrollment...";
      setTimeout(() => {
        window.location.href = `/enroll.html?token=${token}`;
      }, 1500);
      return;
    }

    // === 2️⃣ Obtener challenge del backend ===
    const start = await fetch("/api/bioid/verify/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const { challenge } = await start.json();

    // === 3️⃣ Generar mismo handle que en enroll ===
    async function getUserHandle(id) {
      const msgUint8 = new TextEncoder().encode(id);
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
      return new Uint8Array(hashBuffer).slice(0, 32);
    }

    const handle = await getUserHandle(userId);
    console.log("✅ Using handle length:", handle.length, "bytes");

    // === 4️⃣ Intentar autenticación con WebAuthn ===
    const cred = await navigator.credentials.get({
      publicKey: {
        challenge: new TextEncoder().encode(challenge),
        rpId: "bioid.udochain.com",
        userVerification: "required",
      },
    });

    // === 5️⃣ Enviar resultado al backend ===
    const finish = await fetch("/api/bioid/verify/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, webauthnId: cred.id }),
    });

    const result = await finish.json();

    if (result.ok) {
      status.textContent = "✅ Verified successfully. Redirecting to Validate...";
      const redirect = `https://validate.udochain.com/?bioidHash=${encodeURIComponent(
        result.bioidHash || bioidHashFromUrl
      )}&file=${encodeURIComponent(file)}&hash=${encodeURIComponent(hash)}`;
      setTimeout(() => (window.location.href = redirect), 1200);
    } else {
      throw new Error("Verification failed");
    }
  } catch (err) {
    console.error("❌ Verification error:", err);
    status.textContent = `❌ ${err.message}`;
  }
};
