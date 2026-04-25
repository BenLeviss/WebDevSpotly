import request from "supertest";
import { Request, Response } from "express";
import commentRouter from "../src/routes/comment";
import commentController from "../src/controllers/comment";
import { authenticate } from "../src/middleware/auth";
import { attachDefaultGuardBehavior, createTestApp } from "./helpers/testApp";

jest.mock("../src/controllers/comment", () => ({
    __esModule: true,
    default: {
        createComment: jest.fn(),
        getCommentsByPost: jest.fn(),
        getAllComments: jest.fn(),
        getCommentById: jest.fn(),
        updateCommentById: jest.fn(),
        deleteCommentById: jest.fn(),
    },
}));

jest.mock("../src/middleware/auth", () => ({
    authenticate: jest.fn(),
}));

const mockedCommentController = commentController as jest.Mocked<typeof commentController>;
const mockedAuthenticate = authenticate as jest.Mock;

const app = createTestApp("/comment", commentRouter);

describe("Comment endpoints", () => {
    beforeEach(() => {
        attachDefaultGuardBehavior(mockedAuthenticate);
    });

    describe("GET /comment", () => {
        it("returns all comments for authorized user", async () => {
            mockedCommentController.getAllComments.mockImplementation(async (_req: Request, res: Response) => {
                res.status(200).json([{ _id: "c1" }, { _id: "c2" }]);
            });

            const response = await request(app)
                .get("/comment")
                .set("Authorization", "Bearer access-token");

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(2);
        });

        it("returns 401 when authorization header is missing", async () => {
            const response = await request(app).get("/comment");

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Access token required" });
            expect(mockedCommentController.getAllComments).not.toHaveBeenCalled();
        });
    });

    describe("GET /comment/:commentId", () => {
        it("returns a comment by id", async () => {
            mockedCommentController.getCommentById.mockImplementation(async (req: Request, res: Response) => {
                expect(req.params.commentId).toBe("c1");
                return res.status(200).json({ _id: "c1", content: "hello" });
            });

            const response = await request(app)
                .get("/comment/c1")
                .set("Authorization", "Bearer access-token");

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({ _id: "c1", content: "hello" });
        });

        it("returns 404 for unknown comment", async () => {
            mockedCommentController.getCommentById.mockImplementation(async (_req: Request, res: Response) => {
                return res.status(404).json({ error: "Comment not found" });
            });

            const response = await request(app)
                .get("/comment/missing")
                .set("Authorization", "Bearer access-token");

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: "Comment not found" });
        });
    });

    describe("PUT /comment/:commentId", () => {
        it("updates own comment", async () => {
            mockedCommentController.updateCommentById.mockImplementation(async (req: Request, res: Response) => {
                expect(req.params.commentId).toBe("c1");
                expect(req.body.content).toBe("updated");
                return res.status(200).json({ _id: "c1", content: "updated" });
            });

            const response = await request(app)
                .put("/comment/c1")
                .set("Authorization", "Bearer access-token")
                .send({ content: "updated" });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ _id: "c1", content: "updated" });
        });

        it("returns 403 when editing another user comment", async () => {
            mockedCommentController.updateCommentById.mockImplementation(async (_req: Request, res: Response) =>
                res.status(403).json({ error: "You can only update your own comments" })
            );

            const response = await request(app)
                .put("/comment/c1")
                .set("Authorization", "Bearer access-token")
                .send({ content: "updated" });

            expect(response.status).toBe(403);
            expect(response.body).toEqual({ error: "You can only update your own comments" });
        });
    });

    describe("DELETE /comment/:commentId", () => {
        it("deletes own comment", async () => {
            mockedCommentController.deleteCommentById.mockImplementation(async (req: Request, res: Response) => {
                expect(req.params.commentId).toBe("c1");
                return res.status(200).json({ message: "Comment deleted successfully" });
            });

            const response = await request(app)
                .delete("/comment/c1")
                .set("Authorization", "Bearer access-token");

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: "Comment deleted successfully" });
        });

        it("returns 500 for internal server errors", async () => {
            mockedCommentController.deleteCommentById.mockImplementation(async (_req: Request, res: Response) =>
                res.status(500).json({ error: "Internal failure" })
            );

            const response = await request(app)
                .delete("/comment/c1")
                .set("Authorization", "Bearer access-token");

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: "Internal failure" });
        });
    });
});
