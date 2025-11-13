const output = document.getElementById("output");
const log = (msg) => (output.textContent = JSON.stringify(msg, null, 2));

function base64urlToUint8Array(base64urlString) {
  const padding = "=".repeat((4 - (base64urlString.length % 4)) % 4);
  const base64 = (base64urlString + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// --- ENROLL ---
document.getElementById("enrollBtn").onclick = async () => {
  try {
    const userId = document.getElementById("userId").value || "anon";
    const userName = document.getElementById("userName").value || "Anonymous";

    // 1️⃣ Primero obtenemos las opciones del servidor
    const startRes = await fetch("/api/webauthn/enroll/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, userName }),
    });
    const options = await startRes.json();
    if (!options.challenge) throw new Error("Sin challenge del servidor");

    // 2️⃣ Convertir los campos a Uint8Array
    options.challenge = base64urlToUint8Array(options.challenge);
    options.user.id = base64urlToUint8Array(options.user.id);

    // 3️⃣ Ejecutar WebAuthn inmediatamente (mantiene gesto del usuario)
    const cred = await navigator.credentials.create({ publicKey: options });
    if (!cred) throw new Error("WebAuthn cancelado o no soportado");
    const id = cred.id;

    // 4️⃣ Enviar resultado al servidor
    const finish = await fetch("/api/webauthn/enroll/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, userId }),
    });
    const result = await finish.json();
    log(result);

    if (result.ok) {
      output.textContent += "\n✅ Biometría registrada correctamente.";
    } else {
      output.textContent += "\n❌ Error en registro biométrico.";
    }
  } catch (err) {
    log({ error: err.message });
  }
};

// --- VERIFY ---
document.getElementById("verifyBtn").onclick = async () => {
  try {
    const userId = document.getElementById("userId").value || "anon";

    // 1️⃣ Obtener opciones de verificación
    const start = await fetch("/api/webauthn/verify/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const options = await start.json();
    if (!options.challenge) throw new Error("Sin challenge del servidor");

    // 2️⃣ Convertir challenge
    options.challenge = base64urlToUint8Array(options.challenge);

    // 3️⃣ Ejecutar biometría (dentro del click)
    const cred = await navigator.credentials.get({ publicKey: options });
    if (!cred) throw new Error("WebAuthn cancelado o no soportado");
    const id = cred.id;

    // 4️⃣ Finalizar en backend
    const finish = await fetch("/api/webauthn/verify/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, userId }),
    });
    const result = await finish.json();
    log(result);

    // ✅ Integración con Validate
    if (result.ok && result.hash) {
      const bioidHash = result.hash;
      const params = new URLSearchParams(window.location.search);
      const file = params.get("file") || localStorage.getItem("pendingFile") || "desconocido";
      const hash = params.get("hash") || localStorage.getItem("pendingHash") || "nohash";
      const token = params.get("token") || localStorage.getItem("token");
      const origin = params.get("from") || "validate";
      localStorage.setItem("lastBioIDHash", bioidHash);

      if (origin === "validate") {
        const validateUrl = `https://validate.udochain.com/?bioidHash=${encodeURIComponent(
          bioidHash
        )}&file=${encodeURIComponent(file)}&hash=${encodeURIComponent(hash)}${
          token ? `&token=${encodeURIComponent(token)}` : ""
        }`;
        output.textContent += `\n🔁 Redirigiendo a Validate...`;
        setTimeout(() => (window.location.href = validateUrl), 1000);
      } else {
        const appUrl = `https://app.udochain.com/?bioidHash=${encodeURIComponent(bioidHash)}`;
        output.textContent += `\n🔁 Redirigiendo a UDoChain App...`;
        setTimeout(() => (window.location.href = appUrl), 1000);
      }
    }
  } catch (err) {
    log({ error: err.message });
  }
};
