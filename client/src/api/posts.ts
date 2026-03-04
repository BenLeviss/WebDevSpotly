import api from './axios';

export interface Post {
    _id: string;
    title: string;
    content: string;
    userId: {
        _id: string;
        username: string;
        email: string;
    };
    createdAt: string;
    updatedAt: string;
}

export const postsApi = {
    getPosts: () => api.get<Post[]>('/post'),
    getPostById: (id: string) => api.get<Post>(`/post/${id}`),
    createPost: (title: string, content: string) =>
        api.post<Post>('/post', { title, content }),
    updatePost: (id: string, data: Partial<Pick<Post, 'title' | 'content'>>) =>
        api.put<Post>(`/post/${id}`, data),
    deletePost: (id: string) => api.delete(`/post/${id}`),
};
