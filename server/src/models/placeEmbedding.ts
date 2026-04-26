import mongoose, { Schema, Document } from "mongoose";

export interface IPlaceEmbedding extends Document {
    placeId: mongoose.Types.ObjectId;
    placeName: string;
    category: string;
    description: string;
    searchableText: string;
    embedding: number[];
    createdAt: Date;
    updatedAt: Date;
}

const placeEmbeddingSchema: Schema<IPlaceEmbedding> = new Schema(
    {
        placeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Posts",
            required: true,
            unique: true,
            index: true
        },
        placeName: { type: String, required: true },
        category: { type: String, default: "" },
        description: { type: String, default: "" },
        searchableText: { type: String, required: true },
        embedding: {
            type: [Number],
            required: true,
            default: []
        }
    },
    { timestamps: true }
);

export default mongoose.model<IPlaceEmbedding>("PlaceEmbedding", placeEmbeddingSchema);
