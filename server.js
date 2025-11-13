import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { connectDB } from "./db/mongo.js";
import bioidRoutes from "./routes/bioidRoutes.js";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(",") || "*",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

connectDB();

const publicDir = path.join(__dirname, "public");
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
app.use(express.static(publicDir));

app.use("/api/bioid", bioidRoutes);
app.get("/healthz", (_, res) => res.json({ ok: true }));

app.get("/", (_, res) => res.sendFile(path.join(publicDir, "enroll.html")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ BioID running on port ${PORT}`));
