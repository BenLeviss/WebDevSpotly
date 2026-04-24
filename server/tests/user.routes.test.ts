import request from "supertest";
import { Request, Response } from "express";
import userRouter from "../routes/user";
import userController from "../controllers/user";
import { authenticate } from "../middleware/auth";
import { uploadImage } from "../middleware/upload";
import {
    attachDefaultGuardBehavior,
    attachDefaultUploadBehavior,
    createTestApp,
} from "./helpers/testApp";

jest.mock("../controllers/user", () => ({
    __esModule: true,
    default: {
        createUser: jest.fn(),
        getAllUsers: jest.fn(),
        getUserById: jest.fn(),
        getUserPosts: jest.fn(),
        getUserComments: jest.fn(),
        updateUserById: jest.fn(),
        deleteUserById: jest.fn(),
    },
}));

jest.mock("../middleware/auth", () => ({
    authenticate: jest.fn(),
}));

jest.mock("../middleware/upload", () => ({
    uploadImage: jest.fn(),
}));

const mockedUserController = userController as jest.Mocked<typeof userController>;
const mockedAuthenticate = authenticate as jest.Mock;
const mockedUploadImage = uploadImage as jest.Mock;

const app = createTestApp("/user", userRouter);

describe("User endpoints", () => {
    beforeEach(() => {
        attachDefaultGuardBehavior(mockedAuthenticate);
        attachDefaultUploadBehavior(mockedUploadImage);
    });

    describe("POST /user", () => {
        it("creates user with valid payload", async () => {
            mockedUserController.createUser.mockImplementation(async (req: Request, res: Response) => {
                expect(req.body).toMatchObject({
                    username: "john",
                    email: "john@example.com",
                    password: "password123",
                });
                return res.status(201).json({ _id: "u1", username: "john" });
            });

            const response = await request(app).post("/user").send({
                username: "john",
                email: "john@example.com",
                password: "password123",
            });

            expect(response.status).toBe(201);
            expect(response.body).toEqual({ _id: "u1", username: "john" });
        });

        it("returns 409 when email or username already exists", async () => {
            mockedUserController.createUser.mockImplementation(async (_req: Request, res: Response) => {
                return res.status(409).json({ error: "User with this email or username already exists" });
            });

            const response = await request(app).post("/user").send({
                username: "john",
                email: "john@example.com",
                password: "password123",
            });

            expect(response.status).toBe(409);
            expect(response.body).toEqual({ error: "User with this email or username already exists" });
        });
    });

    describe("GET /user", () => {
        it("returns all users for authorized request", async () => {
            mockedUserController.getAllUsers.mockImplementation(async (_req: Request, res: Response) => {
                res.status(200).json([{ _id: "u1" }, { _id: "u2" }]);
            });

            const response = await request(app)
                .get("/user")
                .set("Authorization", "Bearer access-token");

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(2);
        });

        it("returns 401 without bearer token", async () => {
            const response = await request(app).get("/user");

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Access token required" });
            expect(mockedUserController.getAllUsers).not.toHaveBeenCalled();
        });
    });

    describe("GET /user/:userId", () => {
        it("returns user profile by id", async () => {
            mockedUserController.getUserById.mockImplementation(async (req: Request, res: Response) => {
                expect(req.params.userId).toBe("u1");
                return res.status(200).json({ _id: "u1", username: "john" });
            });

            const response = await request(app)
                .get("/user/u1")
                .set("Authorization", "Bearer access-token");

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ _id: "u1", username: "john" });
        });

        it("returns 404 when user does not exist", async () => {
            mockedUserController.getUserById.mockImplementation(async (_req: Request, res: Response) => {
                return res.status(404).json({ error: "User not found" });
            });

            const response = await request(app)
                .get("/user/missing")
                .set("Authorization", "Bearer access-token");

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: "User not found" });
        });

        it("returns 401 when authorization header is missing", async () => {
            const response = await request(app).get("/user/u1");

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Access token required" });
            expect(mockedUserController.getUserById).not.toHaveBeenCalled();
        });
    });

    describe("GET /user/:userId/posts", () => {
        it("returns user posts", async () => {
            mockedUserController.getUserPosts.mockImplementation(async (req: Request, res: Response) => {
                expect(req.params.userId).toBe("u1");
                res.status(200).json([{ _id: "p1" }]);
            });

            const response = await request(app)
                .get("/user/u1/posts")
                .set("Authorization", "Bearer access-token");

            expect(response.status).toBe(200);
            expect(response.body).toEqual([{ _id: "p1" }]);
        });

        it("returns 500 on unhandled error path", async () => {
            mockedUserController.getUserPosts.mockImplementation(async (_req: Request, res: Response) => {
                res.status(500).json({ error: "Unexpected error" });
            });

            const response = await request(app)
                .get("/user/u1/posts")
                .set("Authorization", "Bearer access-token");

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: "Unexpected error" });
        });

        it("returns 401 for missing authorization header", async () => {
            const response = await request(app).get("/user/u1/posts");

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Access token required" });
            expect(mockedUserController.getUserPosts).not.toHaveBeenCalled();
        });
    });

    describe("GET /user/:userId/comments", () => {
        it("returns user comments", async () => {
            mockedUserController.getUserComments.mockImplementation(async (req: Request, res: Response) => {
                expect(req.params.userId).toBe("u1");
                res.status(200).json([{ _id: "c1" }]);
            });

            const response = await request(app)
                .get("/user/u1/comments")
                .set("Authorization", "Bearer access-token");

            expect(response.status).toBe(200);
            expect(response.body).toEqual([{ _id: "c1" }]);
        });

        it("returns 401 for unauthorized access", async () => {
            const response = await request(app).get("/user/u1/comments");

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Access token required" });
            expect(mockedUserController.getUserComments).not.toHaveBeenCalled();
        });
    });

    describe("PUT /user/:userId", () => {
        it("updates own user profile", async () => {
            mockedUserController.updateUserById.mockImplementation(async (req: Request, res: Response) => {
                expect(req.params.userId).toBe("u1");
                expect(req.body.firstName).toBe("John");
                expect(req.file).toEqual({ filename: "test-photo.png" });
                return res.status(200).json({ _id: "u1", firstName: "John" });
            });

            const response = await request(app)
                .put("/user/u1")
                .set("Authorization", "Bearer access-token")
                .set("x-attach-image", "true")
                .send({ firstName: "John" });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ _id: "u1", firstName: "John" });
            expect(mockedAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockedUploadImage).toHaveBeenCalledTimes(1);
        });

        it("returns 403 when updating another user", async () => {
            mockedUserController.updateUserById.mockImplementation(async (_req: Request, res: Response) => {
                return res.status(403).json({ error: "You can only update your own profile" });
            });

            const response = await request(app)
                .put("/user/u2")
                .set("Authorization", "Bearer access-token")
                .send({ firstName: "John" });

            expect(response.status).toBe(403);
            expect(response.body).toEqual({ error: "You can only update your own profile" });
        });

        it("returns 401 when authorization header is missing", async () => {
            const response = await request(app).put("/user/u1").send({ firstName: "John" });

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Access token required" });
            expect(mockedUserController.updateUserById).not.toHaveBeenCalled();
        });
    });

    describe("DELETE /user/:userId", () => {
        it("deletes own user account", async () => {
            mockedUserController.deleteUserById.mockImplementation(async (req: Request, res: Response) => {
                expect(req.params.userId).toBe("u1");
                return res.status(200).json({ message: "User deleted successfully" });
            });

            const response = await request(app)
                .delete("/user/u1")
                .set("Authorization", "Bearer access-token");

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: "User deleted successfully" });
        });

        it("returns 404 when deleting non-existing user", async () => {
            mockedUserController.deleteUserById.mockImplementation(async (_req: Request, res: Response) => {
                return res.status(404).json({ error: "User not found" });
            });

            const response = await request(app)
                .delete("/user/missing")
                .set("Authorization", "Bearer access-token");

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: "User not found" });
        });

        it("returns 401 when authorization header is missing", async () => {
            const response = await request(app).delete("/user/u1");

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Access token required" });
            expect(mockedUserController.deleteUserById).not.toHaveBeenCalled();
        });
    });
});
