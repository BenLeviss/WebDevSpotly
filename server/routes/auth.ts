import { Router } from "express";
import authController from "../controllers/auth";
import { authenticate } from "../middleware/auth";

const router = Router();

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected routes (require authentication)
router.post("/logout", authenticate, authController.logout);
router.post("/refresh", authController.refresh);

export default router;
