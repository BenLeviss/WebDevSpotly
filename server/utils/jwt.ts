import jwt from 'jsonwebtoken';

// Get secrets from environment variables
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret';

// Token expiration times from environment variables
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

interface TokenPayload {
    userId: string;
    username: string;
    email: string;
}

/**
 * Generate an access token (short-lived)
 */
export const generateAccessToken = (payload: TokenPayload): string => {
    return (jwt.sign as any)(payload, ACCESS_TOKEN_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRY
    });
};

/**
 * Generate a refresh token (long-lived)
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
    return (jwt.sign as any)(payload, REFRESH_TOKEN_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRY
    });
};

/**
 * Verify an access token
 */
export const verifyAccessToken = (token: string): TokenPayload | null => {
    try {
        return jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
    } catch (error) {
        return null;
    }
};

/**
 * Verify a refresh token
 */
export const verifyRefreshToken = (token: string): TokenPayload | null => {
    try {
        return jwt.verify(token, REFRESH_TOKEN_SECRET) as TokenPayload;
    } catch (error) {
        return null;
    }
};
