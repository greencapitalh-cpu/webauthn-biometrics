import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { connectDB } from "./db/mongo.js";
import webauthnRoutes from "./routes/webauthnRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 🌐 CORS seguro — permite solo dominios oficiales de UDoChain
app.use(
  cors({
    origin: [
      "https://bioid.udochain.com",
      "https://validate.udochain.com",
      "https://app.udochain.com",
      "https://wapp.udochain.com",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

// 🧠 Conexión a MongoDB
connectDB();

// 📁 Asegurar carpeta /public exista
const publicDir = path.join(__dirname, "public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
  console.log("📁 Carpeta /public creada automáticamente");
}

// 🚀 Rutas API principales
app.use("/api/webauthn", webauthnRoutes);

// ✅ Endpoint requerido por el estándar WebAuthn
// Esto informa al navegador que este dominio es el RP (Relying Party)
app.get("/.well-known/webauthn", (_, res) => {
  res.json({
    rp_id: "bioid.udochain.com",
    name: "UDoChain BioID",
    description: "WebAuthn Biometric Authentication for UDoChain",
  });
});

// 💚 Healthcheck (para Render y monitoreo)
app.get("/healthz", (_, res) => res.json({ ok: true }));

// 📄 Servir frontend estático (React / HTML simple)
app.use(express.static(publicDir));
app.get("/", (_, res) => res.sendFile(path.join(publicDir, "index.html")));

// 🧱 Rutas no encontradas → JSON genérico
app.use((_, res) => res.status(404).json({ error: "Not Found" }));

// ⚠️ Manejador global de errores
app.use((err, req, res, next) => {
  console.error("❌ Error global en BioID:", err.stack);
  res.status(500).json({ ok: false, error: "Internal Server Error" });
});

// 🚀 Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ BioID server corriendo correctamente en puerto ${PORT}`)
);
