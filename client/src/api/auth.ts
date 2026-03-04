import api from './axios';

export interface AuthResponse {
    message: string;
    accessToken: string;
    refreshToken: string;
    user: {
        _id: string;
        username: string;
        email: string;
    };
}

export const authApi = {
    login: (email: string, password: string) =>
        api.post<AuthResponse>('/auth/login', { email, password }),

    register: (username: string, email: string, password: string) =>
        api.post<AuthResponse>('/auth/register', { username, email, password }),

    logout: (refreshToken: string) =>
        api.post('/auth/logout', null, {
            headers: { Authorization: `Bearer ${refreshToken}` }
        }),

    refresh: (refreshToken: string) =>
        api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', null, {
            headers: { Authorization: `Bearer ${refreshToken}` }
        }),
};
