import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

/**
 * Authentication Middleware
 * Verifies JWT token from Authorization header and adds user to request
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                error: 'Access token required'
            });
        }

        // Verify token
        const decoded = verifyAccessToken(token);

        if (!decoded) {
            return res.status(403).json({
                error: 'Invalid or expired access token'
            });
        }

        // Add user info to request (use type assertion in controllers to access)
        (req as any).user = {
            userId: decoded.userId,
            username: decoded.username,
            email: decoded.email
        };

        next();
    } catch (error) {
        return res.status(403).json({
            error: 'Invalid token'
        });
    }
};
