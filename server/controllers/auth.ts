import { Request, Response } from "express";
import User from "../models/user";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
} from "../utils/jwt";

/**
 * Register a new user
 * POST /auth/register
 */
const register = async (req: Request, res: Response) => {
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

        const user = await User.create({
            username,
            email,
            password,
            refreshTokens: []
        });

        const tokenPayload = {
            userId: String(user._id),
            username: user.username as string,
            email: user.email as string
        };

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        if (!user.refreshTokens) {
            user.refreshTokens = [];
        }
        (user.refreshTokens as string[]).push(refreshToken);
        await user.save();

        res.status(201).json({
            message: "User registered successfully",
            accessToken,
            refreshToken,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

/**
 * Login user
 * POST /auth/login
 */
const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        const isPasswordValid = await (user as any).comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        const tokenPayload = {
            userId: String(user._id),
            username: user.username as string,
            email: user.email as string
        };

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        if (!user.refreshTokens) {
            user.refreshTokens = [];
        }
        (user.refreshTokens as string[]).push(refreshToken);
        await user.save();

        res.json({
            message: "Login successful",
            accessToken,
            refreshToken,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

/**
 * Logout user
 * POST /auth/logout
 */
const logout = async (req: Request, res: Response) => {
    try {
        const authHeaders = req.headers['authorization'];
        const token = authHeaders && authHeaders.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                error: "Refresh token is required in Authorization header"
            });
        }

        const decoded = verifyRefreshToken(token);

        if (!decoded) {
            return res.status(403).json({
                error: "Invalid refresh token"
            });
        }

        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(403).json({
                error: "User not found"
            });
        }

        if (!user.refreshTokens || !(user.refreshTokens as string[]).includes(token)) {
            user.refreshTokens = [];
            await user.save();
            return res.status(403).json({
                error: "Invalid request - all tokens invalidated for security"
            });
        }

        const tokenIndex = (user.refreshTokens as string[]).indexOf(token);
        (user.refreshTokens as string[]).splice(tokenIndex, 1);
        await user.save();

        res.json({ message: "Logout successful" });
    } catch (error) {
        res.status(403).json({ error: (error as Error).message });
    }
};

/**
 * Refresh access token
 * POST /auth/refresh
 */
const refresh = async (req: Request, res: Response) => {
    try {
        const authHeaders = req.headers['authorization'];
        const token = authHeaders && authHeaders.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                error: "Refresh token is required in Authorization header"
            });
        }

        const decoded = verifyRefreshToken(token);

        if (!decoded) {
            return res.status(403).json({
                error: "Invalid or expired refresh token"
            });
        }

        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(403).json({
                error: "User not found"
            });
        }

        if (!user.refreshTokens || !(user.refreshTokens as string[]).includes(token)) {
            user.refreshTokens = [];
            await user.save();
            return res.status(403).json({
                error: "Token reuse detected - all tokens invalidated for security"
            });
        }

        const tokenPayload = {
            userId: decoded.userId,
            username: decoded.username,
            email: decoded.email
        };

        const newAccessToken = generateAccessToken(tokenPayload);
        const newRefreshToken = generateRefreshToken(tokenPayload);

        const tokenIndex = (user.refreshTokens as string[]).indexOf(token);
        (user.refreshTokens as string[])[tokenIndex] = newRefreshToken;
        await user.save();

        res.json({
            message: "Token refreshed successfully",
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        res.status(403).json({ error: (error as Error).message });
    }
};

export default {
    register,
    login,
    logout,
    refresh
};
