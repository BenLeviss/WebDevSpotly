import request from "supertest";
import { Request, Response } from "express";
import authRouter from "../routes/auth";
import authController from "../controllers/auth";
import { authenticate } from "../middleware/auth";
import { attachDefaultGuardBehavior, createTestApp } from "./helpers/testApp";

jest.mock("../controllers/auth", () => ({
    __esModule: true,
    default: {
        register: jest.fn(),
        login: jest.fn(),
        googleLogin: jest.fn(),
        logout: jest.fn(),
        refresh: jest.fn(),
    },
}));

jest.mock("../middleware/auth", () => ({
    authenticate: jest.fn(),
}));

const mockedAuthController = authController as jest.Mocked<typeof authController>;
const mockedAuthenticate = authenticate as jest.Mock;

const app = createTestApp("/auth", authRouter);

describe("Auth endpoints", () => {
    beforeEach(() => {
        attachDefaultGuardBehavior(mockedAuthenticate);
    });

    describe("POST /auth/register", () => {
        it("returns 201 on successful registration with valid payload", async () => {
            mockedAuthController.register.mockImplementation(async (req: Request, res: Response) => {
                expect(req.body).toMatchObject({
                    username: "newuser",
                    email: "new@example.com",
                    password: "strongpass",
                });
                return res.status(201).json({ message: "User registered successfully" });
            });

            const response = await request(app).post("/auth/register").send({
                username: "newuser",
                email: "new@example.com",
                password: "strongpass",
            });

            expect(response.status).toBe(201);
            expect(response.body).toEqual({ message: "User registered successfully" });
            expect(mockedAuthController.register).toHaveBeenCalledTimes(1);
        });

        it("returns 400 for missing required fields", async () => {
            mockedAuthController.register.mockImplementation(async (req: Request, res: Response) => {
                expect(req.body.username).toBeUndefined();
                return res.status(400).json({ error: "Username, email, and password are required" });
            });

            const response = await request(app).post("/auth/register").send({
                email: "new@example.com",
                password: "strongpass",
            });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ error: "Username, email, and password are required" });
        });

        it("returns 500 when registration throws unexpected error", async () => {
            mockedAuthController.register.mockImplementation(async (_req: Request, res: Response) =>
                res.status(500).json({ error: "Internal server error" })
            );

            const response = await request(app).post("/auth/register").send({
                username: "newuser",
                email: "new@example.com",
                password: "strongpass",
            });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: "Internal server error" });
        });
    });

    describe("POST /auth/login", () => {
        it("returns 200 with tokens for valid credentials", async () => {
            mockedAuthController.login.mockImplementation(async (req: Request, res: Response) => {
                expect(req.body).toEqual({ email: "new@example.com", password: "strongpass" });
                return res.status(200).json({
                    message: "Login successful",
                    accessToken: "access-token",
                    refreshToken: "refresh-token",
                });
            });

            const response = await request(app).post("/auth/login").send({
                email: "new@example.com",
                password: "strongpass",
            });

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                message: "Login successful",
                accessToken: expect.any(String),
                refreshToken: expect.any(String),
            });
        });

        it("returns 401 for invalid credentials", async () => {
            mockedAuthController.login.mockImplementation(async (_req: Request, res: Response) =>
                res.status(401).json({ error: "Invalid email or password" })
            );

            const response = await request(app).post("/auth/login").send({
                email: "new@example.com",
                password: "badpass",
            });

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Invalid email or password" });
        });

        it("returns 400 for missing login payload fields", async () => {
            mockedAuthController.login.mockImplementation(async (req: Request, res: Response) => {
                expect(req.body.password).toBeUndefined();
                return res.status(400).json({ error: "Email and password are required" });
            });

            const response = await request(app).post("/auth/login").send({
                email: "new@example.com",
            });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ error: "Email and password are required" });
        });
    });

    describe("POST /auth/google", () => {
        it("returns 200 with auth payload for valid Google id token", async () => {
            mockedAuthController.googleLogin.mockImplementation(async (req: Request, res: Response) => {
                expect(req.body.idToken).toBe("google-id-token");
                return res.status(200).json({
                    message: "Google login successful",
                    accessToken: "access-token",
                    refreshToken: "refresh-token",
                    user: { _id: "u1", username: "googleuser", email: "user@gmail.com" },
                });
            });

            const response = await request(app)
                .post("/auth/google")
                .send({ idToken: "google-id-token" });

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                message: "Google login successful",
                accessToken: expect.any(String),
                refreshToken: expect.any(String),
                user: expect.objectContaining({ email: "user@gmail.com" }),
            });
        });

        it("returns 400 when idToken is missing", async () => {
            mockedAuthController.googleLogin.mockImplementation(async (_req: Request, res: Response) =>
                res.status(400).json({ error: "Google idToken is required" })
            );

            const response = await request(app)
                .post("/auth/google")
                .send({});

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ error: "Google idToken is required" });
        });
    });

    describe("POST /auth/logout", () => {
        it("returns 200 when authorized and refresh token is valid", async () => {
            mockedAuthController.logout.mockImplementation(async (req: Request, res: Response) => {
                expect(req.headers.authorization).toBe("Bearer refresh-token");
                return res.status(200).json({ message: "Logout successful" });
            });

            const response = await request(app)
                .post("/auth/logout")
                .set("Authorization", "Bearer refresh-token");

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: "Logout successful" });
            expect(mockedAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockedAuthController.logout).toHaveBeenCalledTimes(1);
        });

        it("returns 401 when Authorization header is missing", async () => {
            const response = await request(app).post("/auth/logout");

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Access token required" });
            expect(mockedAuthController.logout).not.toHaveBeenCalled();
        });
    });

    describe("POST /auth/refresh", () => {
        it("returns 200 with new tokens", async () => {
            mockedAuthController.refresh.mockImplementation(async (req: Request, res: Response) => {
                expect(req.headers.authorization).toBe("Bearer refresh-token");
                return res.status(200).json({
                    message: "Token refreshed successfully",
                    accessToken: "new-access-token",
                    refreshToken: "new-refresh-token",
                });
            });

            const response = await request(app)
                .post("/auth/refresh")
                .set("Authorization", "Bearer refresh-token");

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                message: "Token refreshed successfully",
                accessToken: expect.any(String),
                refreshToken: expect.any(String),
            });
        });

        it("returns 403 for invalid/expired refresh token", async () => {
            mockedAuthController.refresh.mockImplementation(async (_req: Request, res: Response) =>
                res.status(403).json({ error: "Invalid or expired refresh token" })
            );

            const response = await request(app)
                .post("/auth/refresh")
                .set("Authorization", "Bearer invalid-token");

            expect(response.status).toBe(403);
            expect(response.body).toEqual({ error: "Invalid or expired refresh token" });
        });

        it("returns 401 when refresh token header is missing", async () => {
            mockedAuthController.refresh.mockImplementation(async (_req: Request, res: Response) =>
                res.status(401).json({ error: "Refresh token is required in Authorization header" })
            );

            const response = await request(app).post("/auth/refresh");

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Refresh token is required in Authorization header" });
        });
    });
});
