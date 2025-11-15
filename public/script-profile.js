// ======================================================
// 👤 UDoChain BioID — Profile Management (v2.1)
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
if (token) localStorage.setItem("token", token);

const userId = localStorage.getItem("bioidUserId") || token;
let enrolled = false;
let bioidHash = null;

// ======================================================
// 🚀 Inicializar
// ======================================================
async function initProfile() {
  status.textContent = "⏳ Checking your enrollment status...";
  try {
    const check = await fetch(`/api/bioid/status/${userId}`);
    const checkData = await check.json();

    enrolled = checkData.enrolled;
    bioidHash = checkData.hash;

    form.style.display = "flex";
    title.textContent = enrolled ? "Edit Profile" : "Complete Your Enrollment";
    subtitle.textContent = enrolled
      ? "You can update your personal information below."
      : "Please fill in your details to enroll in BioID.";

    if (enrolled && bioidHash) {
      const res = await fetch(`/api/bioid/hash/${bioidHash}`);
      const data = await res.json();
      if (data.ok) {
        for (const key in data) {
          if (form.elements[key]) form.elements[key].value = data[key];
        }
        saveBtn.textContent = "💾 Save Changes";
      }
    } else {
      saveBtn.textContent = "🧬 Enroll Now";
    }

    status.textContent = "";
  } catch (err) {
    console.error("Error loading profile:", err);
    status.textContent = "❌ Failed to load profile.";
  }
}

// ======================================================
// 💾 Guardar cambios o enrolar nuevo usuario
// ======================================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  status.textContent = "⏳ Saving information...";

  try {
    if (enrolled) {
      // 🔹 Actualización de usuario existente
      const res = await fetch("/api/bioid/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, data }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Update failed");
      status.textContent = "✅ Profile updated successfully!";
    } else {
      // 🔹 Nuevo enrolamiento
      const start = await fetch("/api/bioid/enroll/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const startRes = await start.json();
      if (!startRes.ok) throw new Error("Enrollment start failed");

      const cred = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: { name: "UDoChain BioID", id: "bioid.udochain.com" },
          user: {
            id: new TextEncoder().encode(userId).slice(0, 32),
            name: userId.slice(0, 64),
            displayName: `${data.firstName} ${data.lastName}`,
          },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }],
          timeout: 60000,
          authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
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

      const result = await finish.json();
      if (!result.ok) throw new Error(result.error || "Enrollment failed");

      bioidHash = result.bioidHash;
      status.textContent = "✅ Enrolled successfully!";
    }

    // 🔁 Redirección según origen
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
