import mongoose, { Schema } from 'mongoose';

const postSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        content: { type: String },
        category: { type: String },
        // Only the file path is stored, e.g. "/uploads/photo-1234567890.jpg"
        // The actual image file lives on disk in the server's /uploads folder
        imageUrl: { type: String },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        // Array of user IDs who liked this post
        likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }]
    },
    { timestamps: true }
);

export default mongoose.model('Posts', postSchema);
