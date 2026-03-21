import type { AxiosError } from 'axios';

/** Shape of our backend error response body. */
interface ApiErrorBody {
    error?: string;
}

/**
 * Extracts a human-readable error message from an unknown `catch` value.
 * Works with Axios errors that carry our standard `{ error: string }` body,
 * plain Error objects, and anything else.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
    // Axios error with a backend JSON body: { error: "…" }
    const axiosErr = err as AxiosError<ApiErrorBody>;
    if (axiosErr?.response?.data?.error) {
        return axiosErr.response.data.error;
    }
    // Generic JS Error
    if (err instanceof Error) {
        return err.message;
    }
    return fallback;
}
