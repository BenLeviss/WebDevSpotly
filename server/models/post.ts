import mongoose, { Schema } from 'mongoose';

const postSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        content: { type: String },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
);

export default mongoose.model('Posts', postSchema);
