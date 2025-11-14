const status = document.getElementById("status");
const btn = document.getElementById("verifyBtn");

const params = new URLSearchParams(window.location.search);
const token = params.get("token") || localStorage.getItem("token");
const file = params.get("file");
const hash = params.get("hash");
const bioidHashFromUrl = params.get("bioidHash");

if (!token) window.location.href = "https://app.udochain.com";
if (token) localStorage.setItem("token", token);

// 🔖 Recuperar userId persistente (enroll)
const bioidUserId = localStorage.getItem("bioidUserId") || token;

btn.onclick = async () => {
  status.textContent = "🔐 Authenticating...";

  try {
    const userId = bioidUserId;

    // === 1️⃣ Verificar si el usuario ya está enrolado ===
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

    // === 3️⃣ Recuperar credencial registrada ===
    const savedId = localStorage.getItem("bioidCredentialId");
    if (!savedId) {
      status.textContent = "⚠️ No stored key found. Please re-enroll.";
      return;
    }

    function base64ToUint8Array(base64) {
      const padding = "=".repeat((4 - (base64.length % 4)) % 4);
      const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
      const rawData = atob(base64Safe);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }

    const allowId = base64ToUint8Array(savedId);
    console.log("🔑 Using stored credential ID for verification");

    // === 4️⃣ Intentar autenticación con WebAuthn ===
    const cred = await navigator.credentials.get({
      publicKey: {
        challenge: new TextEncoder().encode(challenge),
        rpId: "bioid.udochain.com",
        userVerification: "required",
        allowCredentials: [
          {
            id: allowId,
            type: "public-key",
          },
        ],
        timeout: 60000,
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
      // 🧩 Recuperar archivos previos del validate
      const pendingFiles = localStorage.getItem("pendingFiles");

      // 🧭 Redirigir con bioidHash y reinyectar archivos
      const redirectUrl = new URL("https://validate.udochain.com/");
      redirectUrl.searchParams.set("bioidHash", result.bioidHash || bioidHashFromUrl);
      redirectUrl.searchParams.set("file", file || "");
      redirectUrl.searchParams.set("hash", hash || "");

      if (pendingFiles) {
        localStorage.setItem("pendingFiles", pendingFiles);
      }

      status.textContent = "✅ Verified successfully. Redirecting to Validate...";
      setTimeout(() => {
        window.location.href = redirectUrl.toString();
      }, 1200);
    } else {
      throw new Error("Verification failed");
    }
  } catch (err) {
    console.error("❌ Verification error:", err);
    status.textContent = `❌ ${err.message}`;
  }
};
