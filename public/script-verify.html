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

    const start = await fetch("/api/bioid/verify/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const { challenge } = await start.json();

    const cred = await navigator.credentials.get({
      publicKey: {
        challenge: new TextEncoder().encode(challenge),
        userVerification: "required",
      },
    });

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
    console.error(err);
    status.textContent = `❌ ${err.message}`;
  }
};
