const output = document.getElementById("output");
const log = (msg) => (output.textContent = JSON.stringify(msg, null, 2));

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

document.getElementById("enrollBtn").onclick = async () => {
  try {
    const userId = document.getElementById("userId").value || "anon";
    const userName = document.getElementById("userName").value || "Anonymous";

    const start = await fetch("/api/webauthn/enroll/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, userName })
    });
    const options = await start.json();

    options.challenge = base64urlToUint8Array(options.challenge);
    options.user.id = base64urlToUint8Array(options.user.id);

    const cred = await navigator.credentials.create({ publicKey: options });
    const id = cred.id;

    const finish = await fetch("/api/webauthn/enroll/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, userId })
    });
    const result = await finish.json();
    log(result);
  } catch (err) {
    log({ error: err.message });
  }
};

document.getElementById("verifyBtn").onclick = async () => {
  try {
    const userId = document.getElementById("userId").value || "anon";
    const start = await fetch("/api/webauthn/verify/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    const options = await start.json();

    options.challenge = base64urlToUint8Array(options.challenge);

    const cred = await navigator.credentials.get({ publicKey: options });
    const id = cred.id;

    const finish = await fetch("/api/webauthn/verify/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, userId })
    });
    const result = await finish.json();
    log(result);
  } catch (err) {
    log({ error: err.message });
  }
};
