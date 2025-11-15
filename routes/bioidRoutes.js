import express from "express";
import {
  startEnroll,
  finishEnroll,
  startVerify,
  finishVerify,
  checkStatus,
  getUserByHash,
  updateUserData, // ✅ Nuevo
} from "../controllers/bioidController.js";

const router = express.Router();

router.get("/status/:userId", checkStatus);
router.post("/enroll/start", startEnroll);
router.post("/enroll/finish", finishEnroll);
router.post("/verify/start", startVerify);
router.post("/verify/finish", finishVerify);
router.get("/hash/:hash", getUserByHash);
router.post("/user/update", updateUserData); // ✅ Nuevo endpoint

export default router;
