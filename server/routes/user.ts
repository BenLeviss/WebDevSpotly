import { Router } from "express";
import userController from "../controllers/user";
import { authenticate } from "../middleware/auth";
import { uploadImage } from "../middleware/upload";

const router = Router();

// Create a new user (public)
router.post("/", userController.createUser);

// All other user routes require authentication
router.get("/", authenticate, userController.getAllUsers);
router.get("/:userId/posts", authenticate, userController.getUserPosts);
router.get("/:userId/comments", authenticate, userController.getUserComments);
router.get("/:userId", authenticate, userController.getUserById);
router.put("/:userId", authenticate, uploadImage, userController.updateUserById);
router.delete("/:userId", authenticate, userController.deleteUserById);

export default router;
