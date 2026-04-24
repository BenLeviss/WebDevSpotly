import request from "supertest";
import { Request, Response } from "express";
import postRouter from "../routes/posts";
import postsController from "../controllers/posts";
import commentController from "../controllers/comment";
import { authenticate } from "../middleware/auth";
import { uploadImage } from "../middleware/upload";
import {
    attachDefaultGuardBehavior,
    attachDefaultUploadBehavior,
    createTestApp,
} from "./helpers/testApp";

jest.mock("../controllers/posts", () => ({
    __esModule: true,
    default: {
        createPost: jest.fn(),
        getPosts: jest.fn(),
        getPostById: jest.fn(),
        updatePostById: jest.fn(),
        deletePostById: jest.fn(),
        toggleLike: jest.fn(),
    },
}));

jest.mock("../controllers/comment", () => ({
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

jest.mock("../middleware/auth", () => ({
    authenticate: jest.fn(),
}));

jest.mock("../middleware/upload", () => ({
    uploadImage: jest.fn(),
}));

const mockedPostsController = postsController as jest.Mocked<typeof postsController>;
const mockedCommentController = commentController as jest.Mocked<typeof commentController>;
const mockedAuthenticate = authenticate as jest.Mock;
const mockedUploadImage = uploadImage as jest.Mock;

const app = createTestApp("/post", postRouter);

describe("Post endpoints", () => {
    beforeEach(() => {
        attachDefaultGuardBehavior(mockedAuthenticate);
        attachDefaultUploadBehavior(mockedUploadImage);
    });

    describe("POST /post", () => {
        it("creates a post with valid payload and auth", async () => {
            mockedPostsController.createPost.mockImplementation(async (req: Request, res: Response) => {
                expect(req.body).toMatchObject({ title: "A title", content: "Body" });
                expect(req.file).toEqual({ filename: "test-photo.png" });
                res.status(201).json({ _id: "p1", title: "A title" });
            });

            const response = await request(app)
                .post("/post")
                .set("Authorization", "Bearer access-token")
                .set("x-attach-image", "true")
                .send({ title: "A title", content: "Body" });

            expect(response.status).toBe(201);
            expect(response.body).toEqual({ _id: "p1", title: "A title" });
            expect(mockedUploadImage).toHaveBeenCalledTimes(1);
            expect(mockedAuthenticate).toHaveBeenCalledTimes(1);
        });

        it("returns 401 when auth header is missing", async () => {
            const response = await request(app).post("/post").send({ title: "No auth" });

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Access token required" });
            expect(mockedPostsController.createPost).not.toHaveBeenCalled();
        });
    });

    describe("GET /post", () => {
        it("returns posts and validates query params", async () => {
            mockedPostsController.getPosts.mockImplementation(async (req: Request, res: Response) => {
                expect(req.query).toMatchObject({ userId: "u1", skip: "0", limit: "10" });
                res.status(200).json([{ _id: "p1" }, { _id: "p2" }]);
            });

            const response = await request(app)
                .get("/post")
                .set("Authorization", "Bearer access-token")
                .query({ userId: "u1", skip: 0, limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(2);
        });

        it("returns 500 for server-side failure", async () => {
            mockedPostsController.getPosts.mockImplementation(async (_req: Request, res: Response) => {
                res.status(500).json({ error: "Database unavailable" });
            });

            const response = await request(app)
                .get("/post")
                .set("Authorization", "Bearer access-token");

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: "Database unavailable" });
        });

        it("returns 401 when auth header is missing", async () => {
            const response = await request(app).get("/post");

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Access token required" });
            expect(mockedPostsController.getPosts).not.toHaveBeenCalled();
        });
    });

    describe("GET /post/:postId", () => {
        it("returns post by id", async () => {
            mockedPostsController.getPostById.mockImplementation(async (req: Request, res: Response) => {
                expect(req.params.postId).toBe("p1");
                res.status(200).json({ _id: "p1", title: "Post" });
            });

            const response = await request(app)
                .get("/post/p1")
                .set("Authorization", "Bearer access-token");

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({ _id: "p1" });
        });

        it("returns 404 when post does not exist", async () => {
            mockedPostsController.getPostById.mockImplementation(async (_req: Request, res: Response) => {
                res.status(404).json({ error: "Post not found" });
            });

            const response = await request(app)
                .get("/post/not-found")
                .set("Authorization", "Bearer access-token");

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: "Post not found" });
        });

        it("returns 401 without authorization header", async () => {
            const response = await request(app).get("/post/p1");

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Access token required" });
            expect(mockedPostsController.getPostById).not.toHaveBeenCalled();
        });
    });

    describe("PUT /post/:postId", () => {
        it("updates post with valid payload", async () => {
            mockedPostsController.updatePostById.mockImplementation(async (req: Request, res: Response) => {
                expect(req.params.postId).toBe("p1");
                expect(req.body.title).toBe("Updated");
                return res.status(200).json({ _id: "p1", title: "Updated" });
            });

            const response = await request(app)
                .put("/post/p1")
                .set("Authorization", "Bearer access-token")
                .send({ title: "Updated" });

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({ _id: "p1", title: "Updated" });
        });

        it("returns 403 when user does not own post", async () => {
            mockedPostsController.updatePostById.mockImplementation(async (_req: Request, res: Response) => {
                return res.status(403).json({ error: "You can only update your own posts" });
            });

            const response = await request(app)
                .put("/post/p1")
                .set("Authorization", "Bearer access-token")
                .send({ title: "Updated" });

            expect(response.status).toBe(403);
            expect(response.body).toEqual({ error: "You can only update your own posts" });
        });

        it("returns 401 without authorization header", async () => {
            const response = await request(app).put("/post/p1").send({ title: "Updated" });

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Access token required" });
            expect(mockedPostsController.updatePostById).not.toHaveBeenCalled();
        });
    });

    describe("DELETE /post/:postId", () => {
        it("deletes post for owner", async () => {
            mockedPostsController.deletePostById.mockImplementation(async (req: Request, res: Response) => {
                expect(req.params.postId).toBe("p1");
                return res.status(200).json({ message: "Post deleted successfully" });
            });

            const response = await request(app)
                .delete("/post/p1")
                .set("Authorization", "Bearer access-token");

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: "Post deleted successfully" });
        });

        it("returns 404 for unknown post", async () => {
            mockedPostsController.deletePostById.mockImplementation(async (_req: Request, res: Response) => {
                return res.status(404).json({ error: "Post not found" });
            });

            const response = await request(app)
                .delete("/post/not-found")
                .set("Authorization", "Bearer access-token");

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: "Post not found" });
        });

        it("returns 401 without authorization header", async () => {
            const response = await request(app).delete("/post/p1");

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Access token required" });
            expect(mockedPostsController.deletePostById).not.toHaveBeenCalled();
        });
    });

    describe("POST /post/:postId/comment", () => {
        it("creates comment with valid content", async () => {
            mockedCommentController.createComment.mockImplementation(async (req: Request, res: Response) => {
                expect(req.params.postId).toBe("p1");
                expect(req.body.content).toBe("Nice post");
                return res.status(201).json({ _id: "c1", content: "Nice post" });
            });

            const response = await request(app)
                .post("/post/p1/comment")
                .set("Authorization", "Bearer access-token")
                .send({ content: "Nice post" });

            expect(response.status).toBe(201);
            expect(response.body).toEqual({ _id: "c1", content: "Nice post" });
        });

        it("returns 404 when post is not found", async () => {
            mockedCommentController.createComment.mockImplementation(async (_req: Request, res: Response) => {
                return res.status(404).json({ error: "Post not found" });
            });

            const response = await request(app)
                .post("/post/unknown/comment")
                .set("Authorization", "Bearer access-token")
                .send({ content: "Nice post" });

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: "Post not found" });
        });

        it("returns 401 without authorization header", async () => {
            const response = await request(app).post("/post/p1/comment").send({ content: "Nice post" });

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Access token required" });
            expect(mockedCommentController.createComment).not.toHaveBeenCalled();
        });
    });

    describe("GET /post/:postId/comment", () => {
        it("returns comments for a post", async () => {
            mockedCommentController.getCommentsByPost.mockImplementation(async (req: Request, res: Response) => {
                expect(req.params.postId).toBe("p1");
                res.status(200).json([{ _id: "c1" }]);
            });

            const response = await request(app)
                .get("/post/p1/comment")
                .set("Authorization", "Bearer access-token");

            expect(response.status).toBe(200);
            expect(response.body).toEqual([{ _id: "c1" }]);
        });

        it("returns 401 without auth header", async () => {
            const response = await request(app).get("/post/p1/comment");

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Access token required" });
            expect(mockedCommentController.getCommentsByPost).not.toHaveBeenCalled();
        });
    });

    describe("POST /post/:postId/like", () => {
        it("toggles like for authorized user", async () => {
            mockedPostsController.toggleLike.mockImplementation(async (req: Request, res: Response) => {
                expect(req.params.postId).toBe("p1");
                return res.status(200).json({ _id: "p1", likes: ["u1"] });
            });

            const response = await request(app)
                .post("/post/p1/like")
                .set("Authorization", "Bearer access-token");

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ _id: "p1", likes: ["u1"] });
        });

        it("returns 404 for invalid post id", async () => {
            mockedPostsController.toggleLike.mockImplementation(async (_req: Request, res: Response) => {
                return res.status(404).json({ error: "Post not found" });
            });

            const response = await request(app)
                .post("/post/not-found/like")
                .set("Authorization", "Bearer access-token");

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: "Post not found" });
        });

        it("returns 401 without authorization header", async () => {
            const response = await request(app).post("/post/p1/like");

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Access token required" });
            expect(mockedPostsController.toggleLike).not.toHaveBeenCalled();
        });
    });
});
