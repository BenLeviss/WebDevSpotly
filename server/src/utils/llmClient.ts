import OpenAI from "openai";

let _client: OpenAI | null = null;

export const getLLMClient = (): OpenAI => {
    if (!_client) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY is not set in environment variables");
        }
        _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return _client;
};

export interface LLMMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

/**
 * Send a chat completion request and return the raw text response.
 * Throws on rate-limit (429) or other API errors.
 */
export const chatComplete = async (
    messages: LLMMessage[],
    model = "gpt-4o-mini"
): Promise<string> => {
    const client = getLLMClient();

    try {
        const response = await client.chat.completions.create({
            model,
            messages,
            temperature: 0.1,
            response_format: { type: "json_object" }
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("LLM returned an empty response");
        }
        return content;
    } catch (err: unknown) {
        // Re-throw with a type hint so the controller can detect rate-limit errors
        throw err;
    }
};

/**
 * Create embeddings for one or more texts.
 */
export const createEmbeddings = async (
    input: string[],
    model = "text-embedding-3-small"
): Promise<number[][]> => {
    const client = getLLMClient();

    if (input.length === 0) return [];

    const response = await client.embeddings.create({
        model,
        input
    });

    return response.data.map((item) => item.embedding);
};
