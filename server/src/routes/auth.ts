import { Router } from "express";
import authController from "../controllers/auth";
import { authenticate } from "../middleware/auth";
import { uploadImage } from "../middleware/upload";

const router = Router();

// Public routes
router.post("/register", uploadImage, authController.register);
router.post("/login", authController.login);
router.post("/google", authController.googleLogin);

// Protected routes (require authentication)
router.post("/logout", authenticate, authController.logout);
router.post("/refresh", authController.refresh);

export default router;
