import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
    const { register, isLoading } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await register(username, email, password);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        }
    };

    return (
        <div className="auth-page">
            <h1 className="auth-page-title">Sign Up</h1>

            <div className="auth-card">
                {/* Logo & Brand */}
                <div className="auth-logo-row">
                    <img src="/spotly-logo.png" alt="Spotly" className="auth-logo-icon" />
                    <span className="auth-brand-name">SP<span>O</span>TLY</span>
                </div>

                <div className="auth-divider" />

                <p className="auth-welcome">Create your account</p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <div className="auth-error">{error}</div>}

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

                    <input
                        id="register-email"
                        className="auth-input"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                    />

                    <input
                        id="register-password"
                        className="auth-input"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete="new-password"
                    />

                    <button
                        id="register-submit"
                        className="auth-btn"
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating account…' : 'Sign Up'}
                    </button>
                </form>

                <div className="auth-link-row">
                    Already have an account?{' '}
                    <Link to="/login">Log in</Link>
                </div>
            </div>
        </div>
    );
}
