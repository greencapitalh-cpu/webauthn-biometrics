// 🧬 MÓDULO: webauthn-biometrics
// 📄 Archivo: server.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { connectDB } from "./db/mongo.js";
import webauthnRoutes from "./routes/webauthnRoutes.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🌍 CORS seguro
app.use(
  cors({
    origin: [
      "https://validate.udochain.com",
      "https://bioid.udochain.com",
      "https://app.udochain.com",
      "https://wapp.udochain.com",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

// 🧠 Conexión MongoDB
connectDB();

// 📁 Public folder
const publicDir = path.join(__dirname, "public");
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

// 🧬 Rutas WebAuthn
app.use("/api/webauthn", webauthnRoutes);

// ✅ Endpoint requerido por WebAuthn
app.get("/.well-known/webauthn", (_, res) =>
  res.json({
    rp_id: "bioid.udochain.com",
    name: "UDoChain BioID",
    description: "WebAuthn Biometrics Authentication",
  })
);

// 💚 Healthcheck
app.get("/healthz", (_, res) => res.json({ ok: true }));

// 📄 Frontend (mínimo)
app.use(express.static(publicDir));
app.get("/", (_, res) => res.sendFile(path.join(publicDir, "index.html")));

// ⚠️ Errores
app.use((err, req, res, next) => {
  console.error("❌ BioID error:", err);
  res.status(500).json({ ok: false, error: err.message });
});

// 🚀 Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ BioID corriendo en puerto ${PORT}`)
);
