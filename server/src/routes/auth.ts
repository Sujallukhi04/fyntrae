import express from "express";
import * as authController from "../controller/authController";
import { protectRoute } from "../middleware/auth";

const router = express.Router();

router.post("/login", authController.login);
router.post("/register", authController.register);
router.get("/me", protectRoute, authController.getAuthUser);

export default router;
