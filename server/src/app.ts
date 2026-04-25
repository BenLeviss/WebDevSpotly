import dotenv from "dotenv";
dotenv.config();

import express, { Express } from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import swaggerUi from "swagger-ui-express";

import postRouter from "./routes/posts";
import commentRouter from "./routes/comment";
import userRouter from "./routes/user";
import authRouter from "./routes/auth";
import swaggerSpec from "./swagger";
import aiSearchRouter from "./routes/aiSearch";

const promise = new Promise<Express>((resolve, reject) => {
    const db = mongoose.connection;
    db.on("error", (error) => console.error(error));
    db.once("open", () => console.log("Connected to Database"));

    mongoose
        .connect(process.env.DATABASE_URL || "")
        .then(() => {
            console.log("pass mongo connect");
            const app = express();

            // Enable CORS for the React frontend
            app.use(cors({
                origin: process.env.CLIENT_URL || "http://localhost:5173",
                credentials: true
            }));

            app.use(express.json());
            app.use(express.urlencoded({ extended: true, limit: '11mb' }));

            // Serve uploaded images as static files.
            // A saved path like "/uploads/photo-123.jpg" becomes accessible
            // at http://localhost:3000/uploads/photo-123.jpg
            app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

            app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
            app.get("/api-docs.json", (_req, res) => {
                res.json(swaggerSpec);
            });

            app.use("/auth", authRouter);
            app.use("/post", postRouter);
            app.use("/comment", commentRouter);
            app.use("/user", userRouter);
            app.use("/ai", aiSearchRouter);
            app.use('/uploads', express.static('uploads'));
            
            resolve(app);
        })
        .catch((err) => {
            console.log(err);
            reject(err);
        });
});

export default promise;
