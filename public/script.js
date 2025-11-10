// === WebAuthn Biometric Demo Script ===

// 🔹 Elementos de la interfaz
const output = document.getElementById("output");
const log = (msg) => (output.textContent = JSON.stringify(msg, null, 2));

// --- Helper: Base64URL → Uint8Array ---
function base64urlToUint8Array(base64urlString) {
  const padding = '='.repeat((4 - (base64urlString.length % 4)) % 4);
  const base64 = (base64urlString + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// --- ENROLL (registro biométrico) ---
document.getElementById("enrollBtn").onclick = async () => {
  try {
    log({ status: "Solicitando challenge de registro..." });

    // 1️⃣ Solicita challenge inicial al servidor
    const startResp = await fetch("/api/webauthn/enroll/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const options = await startResp.json();

    if (!options.challenge) throw new Error("Respuesta inválida del servidor");

    // 2️⃣ Convierte campos base64url a bytes
    options.challenge = base64urlToUint8Array(options.challenge);
    options.user.id = base64urlToUint8Array(options.user.id);

    log({ status: "Esperando autenticador biométrico..." });

    // 3️⃣ Llama al autenticador nativo (FaceID / Huella / TouchID)
    const cred = await navigator.credentials.create({ publicKey: options });

    // 4️⃣ Envía la credencial al backend
    const id = cred.id;
    const finishResp = await fetch("/api/webauthn/enroll/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const result = await finishResp.json();
    log(result);
  } catch (err) {
    log({ error: err.message });
  }
};

// --- VERIFY (autenticación biométrica) ---
document.getElementById("verifyBtn").onclick = async () => {
  try {
    log({ status: "Solicitando challenge de verificación..." });

    // 1️⃣ Solicita challenge al servidor
    const startResp = await fetch("/api/webauthn/verify/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const options = await startResp.json();

    if (!options.challenge) throw new Error("Respuesta inválida del servidor");

    // 2️⃣ Convierte el challenge a bytes
    options.challenge = base64urlToUint8Array(options.challenge);

    log({ status: "Solicitando autenticación biométrica..." });

    // 3️⃣ Llama al autenticador (verifica FaceID / Huella)
    const cred = await navigator.credentials.get({ publicKey: options });
    const id = cred.id;

    // 4️⃣ Envía la credencial al backend
    const finishResp = await fetch("/api/webauthn/verify/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const result = await finishResp.json();
    log(result);
  } catch (err) {
    log({ error: err.message });
  }
};
