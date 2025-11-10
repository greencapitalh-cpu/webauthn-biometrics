import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import webauthnRoutes from "./routes/webauthnRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 🔹 Middlewares base
app.use(cors());
app.use(express.json());

// 🔹 API Routes
app.use("/api/webauthn", webauthnRoutes);

// 🔹 Healthcheck simple
app.get("/healthz", (req, res) => res.json({ ok: true }));

// 🔹 Servir frontend
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// 🔹 Manejar rutas inexistentes → siempre JSON
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// 🔹 Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
