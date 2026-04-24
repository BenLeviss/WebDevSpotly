import express, { Router, Request, Response, NextFunction } from "express";

export const createTestApp = (basePath: string, router: Router) => {
    const app = express();
    app.use(express.json());
    app.use(basePath, router);

    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
        res.status(500).json({ error: err.message || "Internal server error" });
    });

    return app;
};

export const attachDefaultGuardBehavior = (guardMock: jest.Mock) => {
    guardMock.mockImplementation((req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Access token required" });
        }

        (req as Request & { user: { userId: string; username: string; email: string } }).user = {
            userId: "u1",
            username: "tester",
            email: "tester@example.com",
        };

        next();
    });
};

export const attachDefaultUploadBehavior = (uploadMock: jest.Mock) => {
    uploadMock.mockImplementation((req: Request, _res: Response, next: NextFunction) => {
        if (req.headers["x-attach-image"] === "true") {
            (req as any).file = {
                filename: "test-photo.png",
            };
        }
        next();
    });
};
