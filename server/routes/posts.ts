import express from "express";
const postRouter = express.Router();
import postsController from "../controllers/posts";
import commentController from "../controllers/comment";
import { authenticate } from "../middleware/auth";
import { uploadImage } from "../middleware/upload";

// All post routes require authentication
// uploadImage runs first (saves file to disk), then authenticate checks token, then controller
postRouter.post("/", uploadImage, authenticate, postsController.createPost);
postRouter.get("/", authenticate, postsController.getPosts);
postRouter.get("/:postId", authenticate, postsController.getPostById);
postRouter.put("/:postId", uploadImage, authenticate, postsController.updatePostById);
postRouter.delete("/:postId", authenticate, postsController.deletePostById);

// Comment routes under posts
postRouter.post("/:postId/comment", authenticate, commentController.createComment);
postRouter.get("/:postId/comment", authenticate, commentController.getCommentsByPost);

// Like toggle route
postRouter.post("/:postId/like", authenticate, postsController.toggleLike);

export default postRouter;
