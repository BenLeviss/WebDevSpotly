import { Request, Response } from "express";
import User from "../models/user";
import Post from "../models/post";
import Comment from "../models/comment";

const createUser = async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                error: "Username, email, and password are required"
            });
        }

        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(409).json({
                error: "User with this email or username already exists"
            });
        }

        const user = await User.create({ username, email, password });

        const userResponse = {
            _id: user._id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        res.status(201).json(userResponse);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

const getUserById = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

const updateUserById = async (req: Request, res: Response) => {
    try {
        if (req.params.userId !== (req as any).user.userId) {
            return res.status(403).json({
                error: "You can only update your own profile"
            });
        }

        const { username, email, firstName, lastName, bio } = req.body;
        const updateData: any = {};

        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (bio !== undefined) updateData.bio = bio;
        // If a new avatar was uploaded, store only the URL path
        if (req.file) updateData.avatarUrl = `/uploads/${req.file.filename}`;

        const updatedUser = await User.findByIdAndUpdate(
            req.params.userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

const deleteUserById = async (req: Request, res: Response) => {
    try {
        if (req.params.userId !== (req as any).user.userId) {
            return res.status(403).json({
                error: "You can only delete your own account"
            });
        }

        const user = await User.findByIdAndDelete(req.params.userId).select('-password');

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "User deleted successfully", user });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

const getUserPosts = async (req: Request, res: Response) => {
    try {
        const posts = await Post.find({ userId: req.params.userId }).populate('userId', 'username email');
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

const getUserComments = async (req: Request, res: Response) => {
    try {
        const comments = await Comment.find({ userId: req.params.userId }).populate('userId', 'username email');
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export default {
    createUser,
    getAllUsers,
    getUserById,
    getUserPosts,
    getUserComments,
    updateUserById,
    deleteUserById
};
