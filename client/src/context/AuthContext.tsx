import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';

interface User {
    _id: string;
    username: string;
    email: string;
    avatarUrl?: string;
}

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });
    const [accessToken, setAccessToken] = useState<string | null>(
        () => localStorage.getItem('accessToken')
    );
    const [refreshToken, setRefreshToken] = useState<string | null>(
        () => localStorage.getItem('refreshToken')
    );
    const [isLoading, setIsLoading] = useState(false);

    const saveAuth = (user: User, access: string, refresh: string) => {
        setUser(user);
        setAccessToken(access);
        setRefreshToken(refresh);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('accessToken', access);
        localStorage.setItem('refreshToken', refresh);
    };

    const clearAuth = () => {
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    };

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const { data } = await authApi.login(email, password);
            saveAuth(data.user, data.accessToken, data.refreshToken);
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (username: string, email: string, password: string) => {
        setIsLoading(true);
        try {
            const { data } = await authApi.register(username, email, password);
            saveAuth(data.user, data.accessToken, data.refreshToken);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            if (refreshToken) {
                await authApi.logout(refreshToken);
            }
        } catch {
            // Proceed with local logout regardless
        } finally {
            clearAuth();
        }
    };

    return (
        <AuthContext.Provider value={{ user, accessToken, refreshToken, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
