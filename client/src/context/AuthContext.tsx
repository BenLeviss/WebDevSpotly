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
    login: (email: string, password: string) => Promise<void>;
    loginWithGoogle: (idToken: string) => Promise<void>;
    register: (username: string, email: string, password: string, avatarFile?: File | null) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ── Module-level callback so the axios interceptor can clear auth state ──
// The interceptor runs outside React's component tree, so we use a callback
// that AuthProvider registers on mount and cleans up on unmount.
let onAuthExpired: (() => void) | null = null;

export const setOnAuthExpired = (cb: (() => void) | null) => {
    onAuthExpired = cb;
};

/** Call this from the axios interceptor when tokens are irrecoverably expired. */
export const triggerAuthExpired = () => {
    if (onAuthExpired) onAuthExpired();
};

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

    // Register clearAuth so the axios interceptor can trigger it
    useEffect(() => {
        setOnAuthExpired(clearAuth);
        return () => setOnAuthExpired(null);
    }, []);

    const login = async (email: string, password: string) => {
        const { data } = await authApi.login(email, password);
        saveAuth(data.user, data.accessToken, data.refreshToken);
    };

    const loginWithGoogle = async (idToken: string) => {
        const { data } = await authApi.googleLogin(idToken);
        saveAuth(data.user, data.accessToken, data.refreshToken);
    };

    const register = async (username: string, email: string, password: string, avatarFile?: File | null) => {
        const { data } = await authApi.register(username, email, password, avatarFile);
        saveAuth(data.user, data.accessToken, data.refreshToken);
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

    const updateUser = (updates: Partial<User>) => {
        setUser(prev => {
            if (!prev) return prev;
            const updated = { ...prev, ...updates };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
        });
    };

    return (
        <AuthContext.Provider value={{ user, accessToken, refreshToken, login, loginWithGoogle, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
