import api from './axios';

export interface Post {
    _id: string;
    title: string;
    content: string;
    category?: string;
    imageUrl?: string;
    likes: string[];
    commentCount: number;
    userId: {
        _id: string;
        username: string;
        email: string;
        avatarUrl?: string;
    };
    createdAt: string;
    updatedAt: string;
}

export const postsApi = {
    getPosts: () => api.get<Post[]>('/post'),
    getPostById: (id: string) => api.get<Post>(`/post/${id}`),

    // createPost now accepts an optional image File.
    // FormData is the browser's built-in way to bundle text fields + a file
    // together in one HTTP request (multipart/form-data).
    createPost: (title: string, content: string, category: string, image?: File | null) => {
        const form = new FormData();
        form.append('title', title);
        form.append('content', content);
        form.append('category', category);
        // Only attach the image field if the user actually chose a photo
        if (image) form.append('image', image);

        return api.post<Post>('/post', form, {
            // Tell axios NOT to set Content-Type manually —
            // the browser sets it automatically with the correct multipart boundary
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    updatePost: (id: string, data: Partial<Pick<Post, 'title' | 'content'>>) =>
        api.put<Post>(`/post/${id}`, data),
    deletePost: (id: string) => api.delete(`/post/${id}`),
    toggleLike: (id: string) => api.post<Post>(`/post/${id}/like`),
};
