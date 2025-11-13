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

// 🔹 CORS seguro: permite solo dominios de UDoChain
app.use(cors({
  origin: [
    "https://bioid.udochain.com",
    "https://app.udochain.com",
    "https://validate.udochain.com"
  ],
  credentials: true
}));

app.use(express.json({ limit: "10mb" }));

// 🔹 Conexión a MongoDB
connectDB();

// ✅ Asegurar carpeta public exista (por si Render limpia el entorno)
const publicDir = path.join(__dirname, "public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
  console.log("📁 Carpeta /public creada automáticamente");
}

// 🔹 API principal
app.use("/api/webauthn", webauthnRoutes);

// 🔹 Healthcheck para Render
app.get("/healthz", (_, res) => res.json({ ok: true }));

// ✅ Endpoint especial para WebAuthn (.well-known)
app.get("/.well-known/webauthn", (_, res) => {
  res.json({ rp_id: "bioid.udochain.com" });
});

// 🔹 Servir frontend estático
app.use(express.static(publicDir));
app.get("/", (_, res) => res.sendFile(path.join(publicDir, "index.html")));

// 🔹 Rutas no encontradas → JSON estándar
app.use((_, res) => res.status(404).json({ error: "Not Found" }));

// 🔹 Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
