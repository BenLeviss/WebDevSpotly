import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

/** Shape of the user payload attached to an authenticated request. */
type RequestWithUser = Request & { user: { userId: string; username: string; email: string } };

/**
 * Authentication Middleware
 * Verifies the JWT access token from the Authorization header and attaches
 * the decoded user payload to the request object.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = verifyAccessToken(token);

        if (!decoded) {
            return res.status(403).json({ error: 'Invalid or expired access token' });
        }

        (req as RequestWithUser).user = {
            userId: decoded.userId,
            username: decoded.username,
            email: decoded.email
        };

        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid token' });
    }
};
