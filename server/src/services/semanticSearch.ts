import Post from "../models/post";
import PlaceEmbedding from "../models/placeEmbedding";
import { createEmbeddings } from "../utils/llmClient";

const TOP_K = 5;
const MIN_SIMILARITY = 0.2;
const CHUNK_WORDS = 80;
const CHUNK_OVERLAP = 20;

export interface SemanticSearchResult {
    placeId: string;
    placeName: string;
    category: string;
    description: string;
    similarity: number;
}

/**
 * Build searchable text from only the requested 3 fields.
 */
export const buildSearchableText = (
    placeName: string,
    category: string,
    description: string
): string => {
    return `Place name: ${placeName}. Category: ${category}. Description: ${description}.`;
};

/**
 * Chunk long text before embedding to keep retrieval robust for longer descriptions.
 */
const chunkText = (text: string, maxWords = CHUNK_WORDS, overlap = CHUNK_OVERLAP): string[] => {
    const words = text.split(/\s+/).map((w) => w.trim()).filter(Boolean);
    if (words.length === 0) return [];
    if (words.length <= maxWords) return [words.join(" ")];

    const step = Math.max(1, maxWords - overlap);
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += step) {
        const chunkWords = words.slice(i, i + maxWords);
        if (chunkWords.length === 0) break;
        chunks.push(chunkWords.join(" "));
        if (i + maxWords >= words.length) break;
    }
    return chunks;
};

const averageEmbeddings = (vectors: number[][]): number[] => {
    if (vectors.length === 0) return [];
    const dim = vectors[0].length;
    const sum = new Array<number>(dim).fill(0);

    for (const vec of vectors) {
        for (let i = 0; i < dim; i++) {
            sum[i] += vec[i] ?? 0;
        }
    }

    return sum.map((v) => v / vectors.length);
};

const cosineSimilarity = (a: number[], b: number[]): number => {
    let dot = 0;
    let normA = 0;
    let normB = 0;

    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const buildVectorFromSearchableText = async (searchableText: string): Promise<number[]> => {
    const chunks = chunkText(searchableText);
    const embeddings = await createEmbeddings(chunks.length ? chunks : [searchableText]);
    return averageEmbeddings(embeddings);
};

/**
 * Create or update one place embedding, keyed by placeId.
 */
export const upsertPlaceEmbedding = async (
    placeId: string,
    placeName: string,
    category: string,
    description: string
): Promise<void> => {
    const searchableText = buildSearchableText(placeName, category, description);
    const embedding = await buildVectorFromSearchableText(searchableText);

    await PlaceEmbedding.findOneAndUpdate(
        { placeId },
        {
            placeId,
            placeName,
            category,
            description,
            searchableText,
            embedding
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
};

/**
 * Delete embedding when place is deleted.
 */
export const deletePlaceEmbedding = async (placeId: string): Promise<void> => {
    await PlaceEmbedding.findOneAndDelete({ placeId });
};

/**
 * Rebuild embeddings for all existing places.
 */
export const reindexAllPlaceEmbeddings = async (): Promise<number> => {
    const posts = await Post.find({}, "title category content").lean();
    let indexed = 0;

    for (const post of posts as Array<{ _id: unknown; title?: string; category?: string; content?: string }>) {
        await upsertPlaceEmbedding(
            String(post._id),
            post.title || "",
            post.category || "",
            post.content || ""
        );
        indexed += 1;
    }

    return indexed;
};

/**
 * Semantic search over place embeddings using cosine similarity.
 */
export const semanticSearchPlaces = async (
    query: string,
    topK = TOP_K
): Promise<SemanticSearchResult[]> => {
    const docs = await PlaceEmbedding.find({}, "placeId placeName category description embedding").lean();
    if (docs.length === 0) {
        return [];
    }

    const queryVec = (await createEmbeddings([query]))[0];

    const scored = docs
        .map((doc) => {
            const embedding = Array.isArray(doc.embedding) ? doc.embedding : [];
            return {
                placeId: String(doc.placeId),
                placeName: doc.placeName || "",
                category: doc.category || "",
                description: doc.description || "",
                similarity: cosineSimilarity(queryVec, embedding)
            };
        })
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK)
        .filter((item) => item.similarity >= MIN_SIMILARITY)
        .map((item) => ({
            ...item,
            similarity: Number(item.similarity.toFixed(4))
        }));

    return scored;
};
