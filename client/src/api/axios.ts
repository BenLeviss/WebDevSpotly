import axios from 'axios';
import { triggerAuthExpired } from '../context/AuthContext';

const apiBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: `${apiBaseURL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor — handle 401/403 by refreshing token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        // Skip refresh logic for auth endpoints — a 401/403 on login/register/refresh
        // should just be treated as a plain error, not a token refresh trigger.
        const isAuthEndpoint = originalRequest?.url?.includes('/auth/');

        // The server returns 401 when no token is sent, and 403 when the token is
        // expired/invalid. Both cases should trigger a token refresh attempt.
        if ((status === 401 || status === 403) && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) throw new Error('No refresh token');

                const response = await axios.post('/api/auth/refresh', null, {
                    headers: { Authorization: `Bearer ${refreshToken}` }
                });

                const { accessToken, refreshToken: newRefreshToken } = response.data;
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', newRefreshToken);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch {
                // Both tokens are expired/invalid — clear React auth state.
                // This sets user to null, which makes ProtectedRoute redirect to /login.
                triggerAuthExpired();
                // Return a pending promise so the error doesn't reach the component
                // (the page will unmount via ProtectedRoute redirect anyway).
                return new Promise(() => { });
            }
        }

        return Promise.reject(error);
    }
);

export default api;
