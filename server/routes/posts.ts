import express from "express";
const postRouter = express.Router();
import postsController from "../controllers/posts";
import commentController from "../controllers/comment";
import { authenticate } from "../middleware/auth";

// All post routes require authentication
postRouter.post("/", authenticate, postsController.createPost);
postRouter.get("/", authenticate, postsController.getPosts);
postRouter.get("/:postId", authenticate, postsController.getPostById);
postRouter.put("/:postId", authenticate, postsController.updatePostById);
postRouter.delete("/:postId", authenticate, postsController.deletePostById);

// Comment routes under posts
postRouter.post("/:postId/comment", authenticate, commentController.createComment);
postRouter.get("/:postId/comment", authenticate, commentController.getCommentsByPost);

export default postRouter;
