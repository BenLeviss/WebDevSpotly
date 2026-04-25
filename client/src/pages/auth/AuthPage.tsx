import './AuthPage.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/errorUtils';

type Mode = 'login' | 'register';

export default function AuthPage() {
    const { login, loginWithGoogle, register } = useAuth();
    const navigate = useNavigate();
    const hasGoogleAuth = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

    const [mode, setMode] = useState<Mode>('login');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const switchMode = (next: Mode) => {
        setMode(next);
        setError('');
        setUsername('');
        setEmail('');
        setPassword('');
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError('');
        try {
            if (mode === 'login') {
                await login(email, password);
            } else {
                await register(username, email, password);
            }
            navigate('/');
        } catch (err: unknown) {
            setError(
                getErrorMessage(err, mode === 'login'
                    ? 'Login failed. Please try again.'
                    : 'Registration failed. Please try again.')
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        if (!credentialResponse.credential) {
            setError('Google sign-in failed. Please try again.');
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            await loginWithGoogle(credentialResponse.credential);
            navigate('/');
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Google login failed. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">

            <div className="auth-card">
                {/* Logo & Brand */}
                <div className="auth-logo-row">
                    <img src="/spotly.png" alt="Spotly" className="auth-logo-icon" />
                </div>

                <div className="auth-divider" />

                <p className="auth-welcome">
                    {mode === 'login' ? 'Welcome to Spotly' : 'Create your account'}
                </p>

                <div className="auth-form">
                    {error && <div className="auth-error">{error}</div>}

                    {mode === 'register' && (
                        <input
                            id="register-username"
                            className="auth-input"
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
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
                        autoComplete="email"
                    />

                    <input
                        id={mode === 'login' ? 'login-password' : 'register-password'}
                        className="auth-input"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={mode === 'register' ? 6 : undefined}
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    />

                    <button
                        id={mode === 'login' ? 'login-submit' : 'register-submit'}
                        className="auth-btn"
                        type="button"
                        disabled={isLoading}
                        onClick={handleSubmit}
                    >
                        {isLoading
                            ? mode === 'login' ? 'Logging in…' : 'Creating account…'
                            : mode === 'login' ? 'Log In' : 'Sign Up'}
                    </button>

                    {hasGoogleAuth && (
                        <>
                            <div className="auth-social-divider">
                                <span>or</span>
                            </div>

                            <div className="auth-google-wrap">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => setError('Google sign-in failed. Please try again.')}
                                    text={mode === 'login' ? 'signin_with' : 'continue_with'}
                                    shape="pill"
                                    width="320"
                                />
                            </div>
                        </>
                    )}

                    {!hasGoogleAuth && (
                        <>
                            <div className="auth-social-divider">
                                <span>or</span>
                            </div>

                            <div className="auth-google-wrap">
                                <button
                                    type="button"
                                    className="auth-google-fallback"
                                    title="Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in"
                                    disabled
                                >
                                    Continue with Google (setup required)
                                </button>
                            </div>
                        </>
                    )}
                </div>

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
