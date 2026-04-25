import { Request, Response } from "express";
import { parseSearchQuery } from "../services/aiSearch";

/**
 * POST /ai/parse-query
 * Parses a free-text search query into structured filters using an LLM.
 */
export const parseQuery = async (req: Request, res: Response) => {
    const { query } = req.body;

    // 400 – missing or wrong type
    if (!query || typeof query !== "string") {
        return res.status(400).json({
            error: "Missing required field: query (string)"
        });
    }

    const trimmed = query.trim();

    // 400 – empty after trim
    if (trimmed.length === 0) {
        return res.status(400).json({ error: "query must not be empty" });
    }

    // 422 – too long to be a useful search query
    if (trimmed.length > 500) {
        return res.status(422).json({
            error: "query is too long (max 500 characters)"
        });
    }

    try {
        const result = await parseSearchQuery(trimmed);
        return res.json(result);
    } catch (err: unknown) {
        const message = (err as Error).message ?? "Unknown error";

        // Detect OpenAI rate-limit
        if (
            message.includes("429") ||
            message.toLowerCase().includes("rate limit") ||
            message.toLowerCase().includes("quota")
        ) {
            return res.status(429).json({
                error: "AI service rate limit reached. Please try again later."
            });
        }

        // Detect bad LLM output (schema / JSON parse)
        if (
            message.includes("schema validation") ||
            message.includes("invalid JSON")
        ) {
            return res.status(422).json({
                error: "AI returned an unexpected response. Please try again.",
                details: message
            });
        }

        // Missing API key or config issue
        if (message.includes("OPENAI_API_KEY")) {
            return res.status(500).json({
                error: "AI service is not configured on the server."
            });
        }

        return res.status(500).json({ error: "Internal server error", details: message });
    }
};
