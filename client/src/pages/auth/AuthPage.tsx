import './AuthPage.css';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

type Mode = 'login' | 'register';

export default function AuthPage() {
    const { login, register, isLoading } = useAuth();
    const navigate = useNavigate();

    const [mode, setMode] = useState<Mode>('login');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const switchMode = (next: Mode) => {
        setMode(next);
        setError('');
        setUsername('');
        setEmail('');
        setPassword('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (mode === 'login') {
                await login(email, password);
            } else {
                await register(username, email, password);
            }
            navigate('/');
        } catch (err: any) {
            setError(
                err.response?.data?.error ||
                (mode === 'login' ? 'Login failed. Please try again.' : 'Registration failed. Please try again.')
            );
        }
    };

    return (
        <div className="auth-page">
            {mode === 'register' && <h1 className="auth-page-title">Sign Up</h1>}

            <div className="auth-card">
                {/* Logo & Brand */}
                <div className="auth-logo-row">
                    <img src="/spotly-logo.png" alt="Spotly" className="auth-logo-icon" />
                    <span className="auth-brand-name">SP<span>O</span>TLY</span>
                </div>

                <div className="auth-divider" />

                <p className="auth-welcome">
                    {mode === 'login' ? 'Welcome to Spotly' : 'Create your account'}
                </p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <div className="auth-error">{error}</div>}

                    {mode === 'register' && (
                        <input
                            id="register-username"
                            className="auth-input"
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            minLength={3}
                            maxLength={30}
                            autoComplete="username"
                        />
                    )}

                    <input
                        id={mode === 'login' ? 'login-email' : 'register-email'}
                        className="auth-input"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                    />

                    <input
                        id={mode === 'login' ? 'login-password' : 'register-password'}
                        className="auth-input"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={mode === 'register' ? 6 : undefined}
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    />

                    <button
                        id={mode === 'login' ? 'login-submit' : 'register-submit'}
                        className="auth-btn"
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading
                            ? mode === 'login' ? 'Logging in…' : 'Creating account…'
                            : mode === 'login' ? 'Log In' : 'Sign Up'}
                    </button>
                </form>

                <div className="auth-link-row">
                    {mode === 'login' ? (
                        <>Don't have an account?{' '}
                            <a onClick={() => switchMode('register')}>Sign up</a></>
                    ) : (
                        <>Already have an account?{' '}
                            <a onClick={() => switchMode('login')}>Log in</a></>
                    )}
                </div>
            </div>
        </div>
    );
}
