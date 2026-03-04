import React, { useState } from 'react';
import type { Post } from '../api/posts';
import { postsApi } from '../api/posts';

interface Props {
    onClose: () => void;
    onCreated: (post: Post) => void;
}

export default function CreatePostModal({ onClose, onCreated }: Props) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        setLoading(true);
        setError('');
        try {
            const { data } = await postsApi.createPost(title.trim(), content.trim());
            onCreated(data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create spot.');
            setLoading(false);
        }
    };

    // Close on backdrop click
    const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleBackdrop}>
            <div className="modal-card">
                <div className="modal-header">
                    <h2 className="modal-title">📍 Share a Spot</h2>
                    <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
                </div>

                <form className="modal-form" onSubmit={handleSubmit}>
                    {error && <div className="auth-error">{error}</div>}

                    <input
                        id="post-title-input"
                        className="modal-input"
                        type="text"
                        placeholder="Spot name (e.g. Hidden Rooftop Café)"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        autoFocus
                    />

                    <textarea
                        id="post-content-input"
                        className="modal-input"
                        placeholder="Tell us about this spot... (optional)"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={4}
                    />

                    <div className="modal-btn-row">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            id="post-submit-btn"
                            type="submit"
                            className="btn-submit"
                            disabled={loading || !title.trim()}
                        >
                            {loading ? 'Sharing…' : 'Share Spot'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
