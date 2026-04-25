import jwt, { SignOptions } from 'jsonwebtoken';

// Secrets — crash loudly at startup if missing so we never sign tokens with a weak fallback
if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    throw new Error('ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be set in environment variables');
}

const ACCESS_TOKEN_SECRET  = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

// Token expiration times from environment variables
const ACCESS_TOKEN_EXPIRY  = process.env.ACCESS_TOKEN_EXPIRY  || '15m';
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
    const options: SignOptions = { expiresIn: ACCESS_TOKEN_EXPIRY as SignOptions['expiresIn'] };
    return jwt.sign(payload as object, ACCESS_TOKEN_SECRET, options);
};

/**
 * Generate a refresh token (long-lived)
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
    const options: SignOptions = { expiresIn: REFRESH_TOKEN_EXPIRY as SignOptions['expiresIn'] };
    return jwt.sign(payload as object, REFRESH_TOKEN_SECRET, options);
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
