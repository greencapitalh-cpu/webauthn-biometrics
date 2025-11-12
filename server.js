import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { connectDB } from "./db/mongo.js";
import webauthnRoutes from "./routes/webauthnRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

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

connectDB();

// 📁 Asegurar carpeta public
const publicDir = path.join(__dirname, "public");
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

app.use("/api/webauthn", webauthnRoutes);

// Endpoint WebAuthn estándar
app.get("/.well-known/webauthn", (_, res) =>
  res.json({
    rp_id: "bioid.udochain.com",
    name: "UDoChain BioID",
    description: "WebAuthn Biometrics Authentication",
  })
);

app.get("/healthz", (_, res) => res.json({ ok: true }));

app.use(express.static(publicDir));
app.get("/", (_, res) => res.sendFile(path.join(publicDir, "index.html")));

app.use((err, req, res, next) => {
  console.error("❌ BioID error:", err);
  res.status(500).json({ ok: false, error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ BioID corriendo en puerto ${PORT}`));
