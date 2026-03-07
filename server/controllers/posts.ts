import { Request, Response } from "express";
import mongoose from "mongoose";
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
        const matchFilter = req.query.userId ? { userId: new mongoose.Types.ObjectId(req.query.userId as string) } : {};

        // Pagination — optional skip & limit query params
        const skip = parseInt(req.query.skip as string) || 0;
        const limit = parseInt(req.query.limit as string) || 0; // 0 = no limit

        const pipeline: any[] = [
            { $match: matchFilter },
            { $sort: { createdAt: -1 } },
        ];

        if (skip > 0) pipeline.push({ $skip: skip });
        if (limit > 0) pipeline.push({ $limit: limit });

        pipeline.push(
            // Lookup comment count for each post
            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',
                    foreignField: 'postId',
                    as: 'commentsArr'
                }
            },
            { $addFields: { commentCount: { $size: '$commentsArr' } } },
            { $unset: 'commentsArr' },
            // Populate userId
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userId'
                }
            },
            { $unwind: '$userId' },
            {
                $project: {
                    'userId.password': 0,
                    'userId.refreshTokens': 0,
                }
            }
        );

        const posts = await Post.aggregate(pipeline);

        res.send(posts);
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};

const getPostById = async (req: Request, res: Response) => {
    try {
        const post = await Post.findById(req.params.postId).populate('userId', 'username email avatarUrl');
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

        // Build update payload — include new imageUrl if a file was uploaded
        const updateData: any = { ...req.body };
        if (req.file) {
            updateData.imageUrl = `/uploads/${req.file.filename}`;
        }

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.postId,
            updateData,
            { returnDocument: 'after', runValidators: true }
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

const toggleLike = async (req: Request, res: Response) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).send("Post not found");

        const userId = (req as any).user.userId;
        const alreadyLiked = (post.likes as any[]).some(
            (id: any) => id.toString() === userId
        );

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.postId,
            alreadyLiked
                ? { $pull: { likes: userId } }
                : { $addToSet: { likes: userId } },
            { returnDocument: 'after' }
        ).populate('userId', 'username email avatarUrl');

        res.send(updatedPost);
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
    toggleLike,
};
