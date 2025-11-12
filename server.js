import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { connectDB } from "./db/mongo.js";
import webauthnRoutes from "./routes/webauthnRoutes.js";
import { requireAuth } from "./middleware/requireAuth.js"; // 🧩 Nuevo

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// 🔹 CORS seguro: permite solo dominios de UDoChain
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

// 🔹 Healthcheck para Render
app.get("/healthz", (_, res) => res.json({ ok: true }));

// ✅ Autenticación antes de servir frontend
app.use(requireAuth);

// 🔹 Servir frontend solo si está autenticado
app.use(express.static(publicDir));
app.get("/", (_, res) => res.sendFile(path.join(publicDir, "index.html")));

// 🔹 Rutas no encontradas → JSON estándar
app.use((_, res) => res.status(404).json({ error: "Not Found" }));

// 🔹 Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ BioID corriendo en puerto ${PORT} y protegido por login`)
);
