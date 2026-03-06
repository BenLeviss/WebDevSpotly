import api from './axios';

export interface Comment {
    _id: string;
    postId: string;
    userId: {
        _id: string;
        username: string;
        avatarUrl?: string;
    };
    content: string;
    createdAt: string;
}

export const commentsApi = {
    getComments: (postId: string) =>
        api.get<Comment[]>(`/post/${postId}/comment`),
    addComment: (postId: string, content: string) =>
        api.post<Comment>(`/post/${postId}/comment`, { content }),
};
