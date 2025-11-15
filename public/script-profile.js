// ======================================================
// 👤 UDoChain BioID — Profile Page (Dashboard / Validate unified)
// ======================================================
const form = document.getElementById("profileForm");
const status = document.getElementById("status");
const title = document.getElementById("title");
const subtitle = document.getElementById("subtitle");
const saveBtn = document.getElementById("saveBtn");

const params = new URLSearchParams(window.location.search);
const token = params.get("token") || localStorage.getItem("token");
const from = params.get("from") || "dashboard";
const sessionId = params.get("sessionId") || null;

if (!token) window.location.href = "https://app.udochain.com";
localStorage.setItem("token", token);

const userId = localStorage.getItem("bioidUserId") || token;
localStorage.setItem("bioidUserId", userId);

let enrolled = false;
let bioidHash = null;

// ======================================================
// 🚀 Inicialización
// ======================================================
async function initProfile() {
  status.textContent = "⏳ Verificando estado BioID...";
  try {
    const checkRes = await fetch(`/api/bioid/status/${userId}`);
    const check = await checkRes.json();
    enrolled = check.enrolled;
    bioidHash = check.hash;

    form.style.display = "flex";
    if (enrolled) {
      title.textContent = "Edit Your BioID Information";
      subtitle.textContent = "You can update your personal details below.";
      saveBtn.textContent = "💾 Save Changes";
      // Cargar datos existentes
      await loadUserData();
    } else {
      title.textContent = "Enroll in UDoChain BioID";
      subtitle.textContent = "Please fill in your details to register your BioID.";
      saveBtn.textContent = "🧬 Enroll Now";
    }

    status.textContent = "";
  } catch (err) {
    console.error("Init error:", err);
    status.textContent = "❌ Error initializing profile.";
  }
}

// ======================================================
// 📥 Cargar datos del usuario existente
// ======================================================
async function loadUserData() {
  try {
    const res = await fetch(`/api/bioid/hash/${bioidHash}`);
    const data = await res.json();
    if (data.ok) {
      Object.entries(data).forEach(([key, value]) => {
        if (form.elements[key]) form.elements[key].value = value || "";
      });
    }
  } catch (err) {
    console.error("❌ Error loading user data:", err);
  }
}

// ======================================================
// 💾 Guardar datos (update o enroll)
// ======================================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  status.textContent = "⏳ Saving...";

  try {
    if (enrolled) {
      // 🔹 Actualizar datos existentes
      const res = await fetch("/api/bioid/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, data }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Update failed");
      status.textContent = "✅ Profile updated successfully!";
    } else {
      // 🔹 Enroll nuevo usuario
      const start = await fetch("/api/bioid/enroll/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const startRes = await start.json();
      if (!startRes.ok) throw new Error("Enrollment start failed");

      // 🔐 Crear credencial biométrica
      const handle = new TextEncoder().encode(userId).slice(0, 32);
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: { name: "UDoChain BioID", id: "bioid.udochain.com" },
          user: {
            id: handle,
            name: userId.slice(0, 64),
            displayName: `${data.firstName} ${data.lastName}`,
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

      const credentialId = cred.id;
      localStorage.setItem("bioidCredentialId", credentialId);

      const finish = await fetch("/api/bioid/enroll/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, webauthnId: credentialId, data }),
      });
      const finishRes = await finish.json();
      if (!finishRes.ok) throw new Error("Enrollment finish failed");
      bioidHash = finishRes.bioidHash;
      status.textContent = "✅ BioID enrolled successfully!";
    }

    // 🔁 Redirección final
    setTimeout(() => {
      if (from === "validate" && sessionId) {
        window.location.href = `https://validate.udochain.com?sessionId=${sessionId}&bioidHash=${bioidHash || ""}`;
      } else {
        window.location.href = "https://wapp.udochain.com";
      }
    }, 1200);
  } catch (err) {
    console.error("❌ Save error:", err);
    status.textContent = `❌ ${err.message}`;
  }
});

initProfile();
