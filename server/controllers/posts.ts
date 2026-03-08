import { Request, Response } from "express";
import Post from "../models/post";

const createPost = async (req: Request, res: Response) => {
    try {
        // req.file is set by multer when a file is uploaded.
        // We only store the relative URL path, not the file binary.
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

        const post = await Post.create({
            title: req.body.title,
            content: req.body.content,
            category: req.body.category,
            imageUrl,
            userId: (req as any).user.userId,
        });
        res.status(201).send(post);
    } catch (error) {
        res.status(400).send((error as Error).message);
    }
};

const getPosts = async (req: Request, res: Response) => {
    try {
        const filter = req.query.userId ? { userId: req.query.userId } : {};
        const posts = await Post.find(filter).populate('userId', 'username email');
        res.send(posts);
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};

const getPostById = async (req: Request, res: Response) => {
    try {
        const post = await Post.findById(req.params.postId).populate('userId', 'username email');
        if (post) res.send(post);
        else res.status(404).send("Post not found");
    } catch (error) {
        res.status(400).send((error as Error).message);
    }
};

const updatePostById = async (req: Request, res: Response) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).send("Post not found");
        }

        if ((post.userId as any).toString() !== (req as any).user.userId) {
            return res.status(403).json({
                error: "You can only update your own posts"
            });
        }

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.postId,
            req.body,
            { new: true, runValidators: true }
        );

        res.send(updatedPost);
    } catch (error) {
        res.status(400).send((error as Error).message);
    }
};

const deletePostById = async (req: Request, res: Response) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).send("Post not found");
        }

        if ((post.userId as any).toString() !== (req as any).user.userId) {
            return res.status(403).json({
                error: "You can only delete your own posts"
            });
        }

        await Post.findByIdAndDelete(req.params.postId);
        res.send({ message: "Post deleted successfully" });
    } catch (error) {
        res.status(400).send((error as Error).message);
    }
};

export default {
    createPost,
    getPosts,
    getPostById,
    updatePostById,
    deletePostById,
};
