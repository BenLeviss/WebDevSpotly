import api from './axios';

export interface SemanticSearchResult {
    placeId: string;
    placeName: string;
    similarity: number;
}

export interface SemanticSearchResponse {
    results: SemanticSearchResult[];
    message: string;
}

export const aiSearchApi = {
    semanticSearch: (query: string) =>
        api.post<SemanticSearchResponse>('/ai/semantic-search', { query }),
};
