import api from './axios';

export interface ParsedSearchFilters {
    category?: string | null;
    keywordsInclude: string[];
    keywordsExclude: string[];
    tags: string[];
    sort?: 'newest' | 'oldest' | 'mostLiked' | 'relevance' | null;
}

export interface ParsedSearchQuery {
    normalizedQuery: string;
    filters: ParsedSearchFilters;
    confidence: number;
    warnings: string[];
}

export const aiSearchApi = {
    parseQuery: (query: string) =>
        api.post<ParsedSearchQuery>('/ai/parse-query', { query }),
};
