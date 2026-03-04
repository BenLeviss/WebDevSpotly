import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const { login, isLoading } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                {/* Logo & Brand */}
                <div className="auth-logo-row">
                    <img src="/spotly-logo.png" alt="Spotly" className="auth-logo-icon" />
                    <span className="auth-brand-name">SP<span>O</span>TLY</span>
                </div>

                <div className="auth-divider" />

                <p className="auth-welcome">Welcome to Spotly</p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <div className="auth-error">{error}</div>}

                    <input
                        id="login-email"
                        className="auth-input"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                    />

                    <input
                        id="login-password"
                        className="auth-input"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                    />

                    <button
                        id="login-submit"
                        className="auth-btn"
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Logging in…' : 'Log In'}
                    </button>
                </form>

                <div className="auth-link-row">
                    Don't have an account?{' '}
                    <Link to="/register">Sign up</Link>
                </div>
            </div>
        </div>
    );
}
