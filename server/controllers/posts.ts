import { Request, Response } from "express";
import mongoose from "mongoose";
import Post from "../models/post";

/** Locally typed authenticated request — user is set by the authenticate middleware. */
type RequestWithUser = Request & { user: { userId: string; username: string; email: string } };

/** Aggregation pipeline stages used in getPosts */
interface LookupStage {
    $lookup: {
        from: string;
        localField: string;
        foreignField: string;
        as: string;
    };
}
interface MatchStage { $match: Record<string, unknown>; }
interface SortStage { $sort: Record<string, 1 | -1>; }
interface SkipStage { $skip: number; }
interface LimitStage { $limit: number; }
interface AddFieldsStage { $addFields: Record<string, unknown>; }
interface UnsetStage { $unset: string; }
interface UnwindStage { $unwind: string; }
interface ProjectStage { $project: Record<string, unknown>; }

type PipelineStage =
    | LookupStage
    | MatchStage
    | SortStage
    | SkipStage
    | LimitStage
    | AddFieldsStage
    | UnsetStage
    | UnwindStage
    | ProjectStage;

const createPost = async (req: Request, res: Response) => {
    try {
        const { user } = req as RequestWithUser;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

        const post = await Post.create({
            title: req.body.title,
            content: req.body.content,
            category: req.body.category,
            imageUrl,
            userId: user.userId,
        });
        res.status(201).send(post);
    } catch (error) {
        res.status(400).send((error as Error).message);
    }
};

const getPosts = async (req: Request, res: Response) => {
    try {
        const matchFilter: Record<string, unknown> = req.query.userId
            ? { userId: new mongoose.Types.ObjectId(req.query.userId as string) }
            : {};

        const skip = parseInt(req.query.skip as string) || 0;
        const limit = parseInt(req.query.limit as string) || 0;

        const pipeline: PipelineStage[] = [
            { $match: matchFilter },
            { $sort: { createdAt: -1 } },
        ];

        if (skip > 0) pipeline.push({ $skip: skip });
        if (limit > 0) pipeline.push({ $limit: limit });

        pipeline.push(
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
        const { user } = req as RequestWithUser;
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).send("Post not found");
        }

        if (String(post.userId) !== user.userId) {
            return res.status(403).json({ error: "You can only update your own posts" });
        }

        const updateData: Record<string, unknown> = { ...req.body };
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
        const { user } = req as RequestWithUser;
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).send("Post not found");
        }

        if (String(post.userId) !== user.userId) {
            return res.status(403).json({ error: "You can only delete your own posts" });
        }

        await Post.findByIdAndDelete(req.params.postId);
        res.send({ message: "Post deleted successfully" });
    } catch (error) {
        res.status(400).send((error as Error).message);
    }
};

const toggleLike = async (req: Request, res: Response) => {
    try {
        const { user } = req as RequestWithUser;
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).send("Post not found");

        const likes = post.likes as mongoose.Types.ObjectId[];
        const alreadyLiked = likes.some((id) => id.toString() === user.userId);

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.postId,
            alreadyLiked
                ? { $pull: { likes: user.userId } }
                : { $addToSet: { likes: user.userId } },
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
