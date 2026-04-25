import { z } from "zod";
import { chatComplete } from "../utils/llmClient";

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
- If the query is completely irrelevant to place discovery, set confidence below 0.2 and add a warning.`;

// ── Service function ─────────────────────────────────────────────────────────

export const parseSearchQuery = async (query: string): Promise<ParsedQuery> => {
    const raw = await chatComplete([
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: query }
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

    return result.data;
};
