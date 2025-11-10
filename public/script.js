const output = document.getElementById("output");
const log = (msg) => (output.textContent = JSON.stringify(msg, null, 2));

// --- ENROLL ---
document.getElementById("enrollBtn").onclick = async () => {
  try {
    const start = await fetch("/api/webauthn/enroll/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const options = await start.json();
    options.challenge = Uint8Array.from(atob(options.challenge), c => c.charCodeAt(0));
    options.user.id = Uint8Array.from(atob(options.user.id), c => c.charCodeAt(0));

    const cred = await navigator.credentials.create({ publicKey: options });
    const id = cred.id;

    const finish = await fetch("/api/webauthn/enroll/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const result = await finish.json();
    log(result);
  } catch (err) {
    log({ error: err.message });
  }
};

// --- VERIFY ---
document.getElementById("verifyBtn").onclick = async () => {
  try {
    const start = await fetch("/api/webauthn/verify/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const options = await start.json();
    options.challenge = Uint8Array.from(atob(options.challenge), c => c.charCodeAt(0));

    const cred = await navigator.credentials.get({ publicKey: options });
    const id = cred.id;

    const finish = await fetch("/api/webauthn/verify/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const result = await finish.json();
    log(result);
  } catch (err) {
    log({ error: err.message });
  }
};
