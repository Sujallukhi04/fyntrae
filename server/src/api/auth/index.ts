import express from "express";
import * as authController from "./controller";
import { protectRoute } from "../../middleware/auth";
import { upload } from "../../utils/multer";
import { validateRefreshToken } from "../../middleware/refresh";

const router = express.Router();

router.post("/login", authController.login);

router.post("/register", authController.register);

router.put("/", protectRoute, upload.single("file"), authController.updateUser);

router.put("/change-password", protectRoute, authController.changePassword);

// router.delete("/account" , protectRoute, authController.deleteUser)

router.post("/refresh", validateRefreshToken, authController.refresh);

router.get("/logout", protectRoute, authController.logoutUser);

router.get("/me", protectRoute, authController.getAuthUser);

export default router;
