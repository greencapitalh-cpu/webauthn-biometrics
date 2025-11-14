import express from "express";
import { startEnroll, finishEnroll, startVerify, finishVerify, checkStatus } from "../controllers/bioidController.js";
const router = express.Router();

router.get("/status/:userId", checkStatus);
router.post("/enroll/start", startEnroll);
router.post("/enroll/finish", finishEnroll);
router.post("/verify/start", startVerify);
router.post("/verify/finish", finishVerify);

export default router;
