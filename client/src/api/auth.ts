import api from './axios';

export interface AuthResponse {
    message: string;
    accessToken: string;
    refreshToken: string;
    user: {
        _id: string;
        username: string;
        email: string;
        avatarUrl?: string;
    };
}

export const authApi = {
    login: (email: string, password: string) =>
        api.post<AuthResponse>('/auth/login', { email, password }),

    googleLogin: (idToken: string) =>
        api.post<AuthResponse>('/auth/google', { idToken }),

    register: (username: string, email: string, password: string, avatarFile?: File | null) => {
        if (!avatarFile) {
            return api.post<AuthResponse>('/auth/register', { username, email, password });
        }

        const formData = new FormData();
        formData.append('username', username);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('image', avatarFile);

        return api.post<AuthResponse>('/auth/register', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    logout: (refreshToken: string) =>
        api.post('/auth/logout', {}, {
            headers: { Authorization: `Bearer ${refreshToken}` }
        }),

    refresh: (refreshToken: string) =>
        api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', {}, {
            headers: { Authorization: `Bearer ${refreshToken}` }
        }),
};
