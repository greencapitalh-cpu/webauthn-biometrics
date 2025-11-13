import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { connectDB } from "./db/mongo.js";
import webauthnRoutes from "./routes/webauthnRoutes.js";
import { requireAuth } from "./middleware/requireAuth.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// ✅ CORS: habilitar tus dominios oficiales y cabeceras WebAuthn
const allowedOrigins = [
  "https://bioid.udochain.com",
  "https://validate.udochain.com",
  "https://app.udochain.com",
  "https://wapp.udochain.com",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json({ limit: "10mb" }));

// 🔹 Conexión a MongoDB
connectDB();

// ✅ Asegurar carpeta public exista
const publicDir = path.join(__dirname, "public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
  console.log("📁 Carpeta /public creada automáticamente");
}

// 🔹 API principal (no protegida)
app.use("/api/webauthn", webauthnRoutes);

// 🔹 Healthcheck
app.get("/healthz", (_, res) => res.json({ ok: true }));

// ✅ Protección de frontend (solo usuarios autenticados)
app.use(requireAuth);

// 🔹 Servir frontend solo si está autenticado
app.use(express.static(publicDir));
app.get("/", (_, res) => res.sendFile(path.join(publicDir, "index.html")));

// 🔹 Rutas no encontradas
app.use((_, res) => res.status(404).json({ error: "Not Found" }));

// 🔹 Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ BioID corriendo en puerto ${PORT} con CORS funcional`)
);
