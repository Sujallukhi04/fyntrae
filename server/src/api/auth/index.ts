import express from "express";
import * as authController from "./controller";
import { protectRoute } from "../../middleware/auth";
import { upload } from "../../utils/multer";
import { validateRefreshToken } from "../../middleware/refresh";

const router = express.Router();

router.post("/login", authController.login);

router.post("/register", authController.register);

router.put("/", protectRoute, upload.single("file"), authController.updateUser);

router.put(
  "/change-password",
  protectRoute,
  validateRefreshToken,
  authController.changePassword
);

// router.delete("/account" , protectRoute, authControler.deleteUser)

router.post("/refresh", validateRefreshToken, authController.refresh);

router.get(
  "/logout",
  protectRoute,
  validateRefreshToken,
  authController.logoutUser
);

router.put("/verify-email/:token", authController.verifyEmail);

router.post("/send-resetlink", authController.sendResetPassword);

router.post("/resetpassword/:token", authController.resetPasswordWithToken);

router.get("/me", protectRoute, authController.getAuthUser);

export default router;
