import { Request, Response } from "express";
import Comment from "../models/comment";
import Post from "../models/post";

const createComment = async (req: Request, res: Response) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        const comment = await Comment.create({
            postId: post._id,
            userId: (req as any).user.userId,
            content
        });
        const populatedComment = await Comment.findById(comment._id).populate('userId', 'username email');
        res.status(201).json(populatedComment);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

const getCommentsByPost = async (req: Request, res: Response) => {
    try {
        const { postId } = req.params;
        const comments = await Comment.find({ postId }).populate('userId', 'username email');
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

const getAllComments = async (req: Request, res: Response) => {
    try {
        const comments = await Comment.find({}).populate('userId', 'username email');
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

const getCommentById = async (req: Request, res: Response) => {
    try {
        const comment = await Comment.findById(req.params.commentId).populate('userId', 'username email');
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }
        res.json(comment);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

const updateCommentById = async (req: Request, res: Response) => {
    const commentId = req.params.commentId;
    const { content } = req.body;
    try {
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }
        if ((comment.userId as any).toString() !== (req as any).user.userId) {
            return res.status(403).json({ error: "You can only update your own comments" });
        }
        const updatedComment = await Comment.findByIdAndUpdate(commentId, { content }, { returnDocument: 'after' }).populate('userId', 'username email');
        res.send(updatedComment);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

const deleteCommentById = async (req: Request, res: Response) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }
        if ((comment.userId as any).toString() !== (req as any).user.userId) {
            return res.status(403).json({ error: "You can only delete your own comments" });
        }
        await Comment.findByIdAndDelete(req.params.commentId);
        res.send({ message: "Comment deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export default {
    createComment,
    getCommentsByPost,
    getAllComments,
    getCommentById,
    updateCommentById,
    deleteCommentById
};
