import express from "express";
import {
  startEnroll,
  finishEnroll,
  startVerify,
  finishVerify,
  checkStatus,
  getUserByHash, // nuevo controlador
} from "../controllers/bioidController.js";

const router = express.Router();

router.get("/status/:userId", checkStatus);
router.post("/enroll/start", startEnroll);
router.post("/enroll/finish", finishEnroll);
router.post("/verify/start", startVerify);
router.post("/verify/finish", finishVerify);

// 🆕 Buscar datos por bioidHash
router.get("/hash/:hash", getUserByHash);

export default router;
