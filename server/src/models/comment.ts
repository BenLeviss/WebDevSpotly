import mongoose, { Schema } from 'mongoose';

const commentSchema: Schema = new Schema(
    {
        postId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            required: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        content: { type: String, required: true }
    },
    { timestamps: true }
);

export default mongoose.model("Comments", commentSchema);
