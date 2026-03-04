import dotenv from "dotenv";
dotenv.config();

import express, { Express } from "express";
import mongoose from "mongoose";
import cors from "cors";

import postRouter from "./routes/posts";
import commentRouter from "./routes/comment";
import userRouter from "./routes/user";
import authRouter from "./routes/auth";

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
            app.use(express.urlencoded({ extended: true, limit: '1mb' }));

            app.use("/auth", authRouter);
            app.use("/post", postRouter);
            app.use("/comment", commentRouter);
            app.use("/user", userRouter);

            resolve(app);
        })
        .catch((err) => {
            console.log(err);
            reject(err);
        });
});

export default promise;
