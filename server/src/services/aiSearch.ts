import { z } from "zod";
import { chatComplete, createEmbeddings } from "../utils/llmClient";
import Post from "../models/post";

// ── Output schema (validated with Zod) ──────────────────────────────────────

export const SearchFiltersSchema = z.object({
    category: z.string().nullable().optional(),
    keywordsInclude: z.array(z.string()).default([]),
    keywordsExclude: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    sort: z
        .enum(["newest", "oldest", "mostLiked", "relevance"])
        .nullable()
        .optional()
});

export const ParsedQuerySchema = z.object({
    normalizedQuery: z.string(),
    filters: SearchFiltersSchema,
    confidence: z.number().min(0).max(1),
    warnings: z.array(z.string()).default([])
});

export type ParsedQuery = z.infer<typeof ParsedQuerySchema>;

interface RAGChunk {
    postId: string;
    category: string;
    text: string;
}

const CHUNK_WORDS = 80;
const CHUNK_OVERLAP = 20;
const MAX_POSTS_FOR_RETRIEVAL = 120;
const MAX_CHUNKS_FOR_EMBEDDING = 220;
const TOP_K = 8;

// ── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a search query parser for "Spotly", a place-discovery app where users share and explore spots like cafes, parks, restaurants, and hidden gems.

Your job is to parse a free-text user query into a structured JSON object.

Return ONLY a valid JSON object with these exact fields:
{
  "normalizedQuery": "cleaned-up version of the query as a short phrase",
  "filters": {
    "category": "one of: cafe, restaurant, park, bar, museum, beach, gym, library, other — or null if unclear",
    "keywordsInclude": ["array of important keywords to include"],
    "keywordsExclude": ["array of things user wants to avoid — extract from phrases like 'not', 'without', 'no X'"],
    "tags": ["inferred lifestyle/vibe tags like: quiet, cozy, outdoor, study, family, pet-friendly, romantic, budget, luxury, etc."],
    "sort": "one of: newest, oldest, mostLiked, relevance — or null if no sort preference"
  },
  "confidence": 0.0 to 1.0 (how confident you are in the parsing),
  "warnings": ["any ambiguities or issues with the query, empty array if none"]
}

Rules:
- Always return valid JSON, never markdown or explanation text.
- Extract negative intent (e.g. "no loud music" → keywordsExclude: ["loud music"]).
- Be conservative with confidence: vague queries should score below 0.5.
- Use English tags/keywords regardless of input language.
- If the query is completely irrelevant to place discovery, set confidence below 0.2 and add a warning.
- You may receive retrieved context chunks from real posts. Use them to improve grounding and confidence.
- Never invent categories or tags that clearly conflict with retrieved context.`;

const toWords = (value: string) => value.split(/\s+/).map((w) => w.trim()).filter(Boolean);

const chunkText = (text: string, maxWords = CHUNK_WORDS, overlap = CHUNK_OVERLAP): string[] => {
    const words = toWords(text);
    if (words.length <= maxWords) return words.length ? [words.join(" ")] : [];

    const chunks: string[] = [];
    const step = Math.max(1, maxWords - overlap);
    for (let i = 0; i < words.length; i += step) {
        const chunkWords = words.slice(i, i + maxWords);
        if (chunkWords.length === 0) break;
        chunks.push(chunkWords.join(" "));
        if (i + maxWords >= words.length) break;
    }
    return chunks;
};

const cosineSimilarity = (a: number[], b: number[]) => {
    let dot = 0;
    let normA = 0;
    let normB = 0;

    const length = Math.min(a.length, b.length);
    for (let i = 0; i < length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const buildChunkCorpus = async (): Promise<RAGChunk[]> => {
    const posts = await Post.find({}, "title content category")
        .sort({ createdAt: -1 })
        .limit(MAX_POSTS_FOR_RETRIEVAL)
        .lean();

    const chunks: RAGChunk[] = [];

    for (const post of posts as Array<{ _id: unknown; title?: string; content?: string; category?: string }>) {
        const title = (post.title || "").trim();
        const content = (post.content || "").trim();
        const category = (post.category || "other").trim() || "other";
        const baseText = [title, content].filter(Boolean).join(". ");

        if (!baseText) continue;

        const postChunks = chunkText(baseText);
        for (const text of postChunks) {
            chunks.push({
                postId: String(post._id),
                category,
                text
            });
            if (chunks.length >= MAX_CHUNKS_FOR_EMBEDDING) return chunks;
        }
    }

    return chunks;
};

const retrieveRelevantChunks = async (query: string): Promise<RAGChunk[]> => {
    const corpus = await buildChunkCorpus();
    if (corpus.length === 0) return [];

    const queryEmbedding = (await createEmbeddings([query]))[0];
    const chunkEmbeddings = await createEmbeddings(corpus.map((c) => c.text));

    const scored = corpus.map((chunk, idx) => ({
        chunk,
        score: cosineSimilarity(queryEmbedding, chunkEmbeddings[idx])
    }));

    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, TOP_K)
        .map((item) => item.chunk);
};

// ── Service function ─────────────────────────────────────────────────────────

export const parseSearchQuery = async (query: string): Promise<ParsedQuery> => {
    const retrievedChunks = await retrieveRelevantChunks(query);

    const retrievalContext = retrievedChunks.length > 0
        ? retrievedChunks
            .map((chunk, idx) => `#${idx + 1} [postId=${chunk.postId}, category=${chunk.category}] ${chunk.text}`)
            .join("\n")
        : "No matching post context was retrieved.";

    const raw = await chatComplete([
        { role: "system", content: SYSTEM_PROMPT },
        {
            role: "user",
            content: `Query: ${query}\n\nRetrieved context chunks:\n${retrievalContext}`
        }
    ]);

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        throw new Error("LLM returned invalid JSON: " + raw.slice(0, 200));
    }

    const result = ParsedQuerySchema.safeParse(parsed);
    if (!result.success) {
        throw new Error(
            "LLM response failed schema validation: " +
            result.error.issues.map((i) => i.message).join(", ")
        );
    }

    const normalizedWarnings = [...result.data.warnings];
    if (retrievedChunks.length === 0) {
        normalizedWarnings.push("No relevant context chunks found in posts corpus.");
    }

    return {
        ...result.data,
        warnings: normalizedWarnings
    };
};
