import express from "express";
const commentRouter = express.Router();
import commentController from "../controllers/comment";
import { authenticate } from "../middleware/auth";

// All comment routes require authentication
commentRouter.get("/", authenticate, commentController.getAllComments);
commentRouter.get("/:commentId", authenticate, commentController.getCommentById);
commentRouter.put("/:commentId", authenticate, commentController.updateCommentById);
commentRouter.delete("/:commentId", authenticate, commentController.deleteCommentById);

export default commentRouter;
