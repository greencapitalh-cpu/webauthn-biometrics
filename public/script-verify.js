// ======================================================
// 🧬 UDoChain BioID — Verification Script (v7.1 Smooth Redirect + Validate Sync)
// ======================================================

const status = document.getElementById("status");
const btn = document.getElementById("verifyBtn");

const params = new URLSearchParams(window.location.search);
const token = params.get("token") || localStorage.getItem("token");
const sessionId = params.get("sessionId"); // 🔹 Necesario para volver a Validate
const bioidUserId = localStorage.getItem("bioidUserId") || token;

// ======================================================
// 🧩 Validación de acceso
// ======================================================
if (!token) window.location.href = "https://app.udochain.com";
if (token) localStorage.setItem("token", token);

// ======================================================
// 🧩 Evento principal de verificación
// ======================================================
btn.onclick = async () => {
  status.textContent = "🔐 Authenticating...";

  try {
    // === 1️⃣ Verificar enrolamiento ===
    const check = await fetch(`/api/bioid/status/${bioidUserId}`);
    const checkData = await check.json();

    if (!checkData.enrolled) {
      status.textContent = "⚠️ No biometric record found. Redirecting to enroll...";
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

    // === 3️⃣ Recuperar credencial local ===
    const savedId = localStorage.getItem("bioidCredentialId");
    if (!savedId) {
      status.textContent = "⚠️ No stored credential. Please re-enroll.";
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

    // === 4️⃣ Autenticar con WebAuthn ===
    let cred = null;
    try {
      cred = await navigator.credentials.get({
        publicKey: {
          challenge: new TextEncoder().encode(challenge),
          rpId: "bioid.udochain.com",
          userVerification: "preferred", // ✅ modo universal
          allowCredentials: [{ id: allowId, type: "public-key" }],
          timeout: 60000,
        },
      });

      if (cred) {
        status.textContent = "✅ Biometric verification successful!";
      }
    } catch (err) {
      console.warn("⚠️ Biometrics not available — continuing fallback mode:", err);
      status.textContent =
        "⚠️ Biometric verification unavailable. Proceeding with standard verification...";
    }

    // === 5️⃣ Finalizar verificación en backend ===
    const finish = await fetch("/api/bioid/verify/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: bioidUserId,
        webauthnId: cred?.id || null,
        verifiedWithBiometrics: !!cred,
      }),
    });

    const result = await finish.json();

    if (result.ok) {
      status.textContent = "✅ Verified! Redirecting to Validate...";

      // ======================================================
      // 🔁 Redirección optimizada a Validate (sin salto intermedio)
      // ======================================================
      const redirectUrl = new URL("https://validate.udochain.com/");
      redirectUrl.searchParams.set("sessionId", sessionId);
      redirectUrl.searchParams.set("bioidHash", result.bioidHash);
      redirectUrl.searchParams.set("step", "final"); // para flujo suave

      // 🧭 replace() → evita parpadeo y limpia historial
      setTimeout(() => {
        window.location.replace(redirectUrl.toString());
      }, 1000);
    } else {
      throw new Error("Verification failed");
    }
  } catch (err) {
    console.error("❌ Verification error:", err);
    status.textContent = `❌ ${err.message}`;
  }
};
