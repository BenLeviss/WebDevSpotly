import { Request, Response } from "express";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import User from "../models/user";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
} from "../utils/jwt";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── Helpers ──────────────────────────────────────────────────────────────────

const normalizeUsername = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 24);

const generateUniqueUsername = async (baseValue: string): Promise<string> => {
    let candidate = normalizeUsername(baseValue) || `user${Date.now()}`;
    if (candidate.length < 3) candidate = `${candidate}001`.slice(0, 3);

    let exists = await User.findOne({ username: candidate });
    while (exists) {
        candidate = `${candidate.slice(0, 20)}${Math.floor(Math.random() * 10000)}`;
        exists = await User.findOne({ username: candidate });
    }
    return candidate;
};

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * Register a new user
 * POST /auth/register
 */
const register = async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;
        const avatarUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

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
            avatarUrl,
            refreshTokens: []
        });

        const tokenPayload = {
            userId: String(user._id),
            username: user.username as string,
            email: user.email as string
        };

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        user.refreshTokens.push(refreshToken);
        await user.save();

        res.status(201).json({
            message: "User registered successfully",
            accessToken,
            refreshToken,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                avatarUrl: user.avatarUrl
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
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const tokenPayload = {
            userId: String(user._id),
            username: user.username as string,
            email: user.email as string
        };

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        user.refreshTokens.push(refreshToken);
        await user.save();

        res.json({
            message: "Login successful",
            accessToken,
            refreshToken,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                avatarUrl: user.avatarUrl
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
        const authHeaders = req.headers["authorization"];
        const token = authHeaders && authHeaders.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                error: "Refresh token is required in Authorization header"
            });
        }

        const decoded = verifyRefreshToken(token);

        if (!decoded) {
            return res.status(403).json({ error: "Invalid refresh token" });
        }

        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(403).json({ error: "User not found" });
        }

        if (!user.refreshTokens.includes(token)) {
            user.refreshTokens = [];
            await user.save();
            return res.status(403).json({
                error: "Invalid request - all tokens invalidated for security"
            });
        }

        const tokenIndex = user.refreshTokens.indexOf(token);
        user.refreshTokens.splice(tokenIndex, 1);
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
        const authHeaders = req.headers["authorization"];
        const token = authHeaders && authHeaders.split(" ")[1];

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
            return res.status(403).json({ error: "User not found" });
        }

        if (!user.refreshTokens.includes(token)) {
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

        const tokenIndex = user.refreshTokens.indexOf(token);
        user.refreshTokens[tokenIndex] = newRefreshToken;
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

/**
 * Google OAuth login / register
 * POST /auth/google
 */
const googleLogin = async (req: Request, res: Response) => {
    try {
        const { idToken } = req.body as { idToken?: string };

        if (!idToken) {
            return res.status(400).json({ error: "Google idToken is required" });
        }

        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.status(500).json({ error: "GOOGLE_CLIENT_ID is not configured on the server" });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        if (!payload?.email || !payload.email_verified) {
            return res.status(401).json({ error: "Invalid or unverified Google account" });
        }

        let user = await User.findOne({ email: payload.email });

        if (!user) {
            const username = await generateUniqueUsername(
                payload.name || payload.email.split("@")[0]
            );
            const generatedPassword = `google_${crypto.randomBytes(12).toString("hex")}`;

            user = await User.create({
                username,
                email: payload.email,
                password: generatedPassword,
                avatarUrl: '/uploads/default-user.png',
                refreshTokens: []
            });
        } else if (!user.avatarUrl || user.avatarUrl === '/default-user.png') {
            user.avatarUrl = '/uploads/default-user.png';
            await user.save();
        }

        const tokenPayload = {
            userId: String(user._id),
            username: user.username as string,
            email: user.email as string
        };

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        user.refreshTokens.push(refreshToken);
        await user.save();

        return res.status(200).json({
            message: "Google login successful",
            accessToken,
            refreshToken,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                avatarUrl: user.avatarUrl
            }
        });
    } catch (error) {
        return res.status(401).json({ error: "Google authentication failed: " + (error as Error).message });
    }
};

export default {
    register,
    login,
    logout,
    refresh,
    googleLogin
};
