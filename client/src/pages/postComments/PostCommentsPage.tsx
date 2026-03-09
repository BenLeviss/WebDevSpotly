import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PostCommentsPage.css';
import { postsApi } from '../../api/posts';
import type { Post } from '../../api/posts';
import { commentsApi } from '../../api/comments';
import type { Comment } from '../../api/comments';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
}

// ─── PostCommentsPage ────────────────────────────────────────────────────────

export default function PostCommentsPage() {
    const { postId } = useParams<{ postId: string }>();
    const navigate = useNavigate();

    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Fetch post + comments on mount
    useEffect(() => {
        if (!postId) return;
        setLoading(true);

        Promise.all([
            postsApi.getPostById(postId),
            commentsApi.getComments(postId),
        ])
            .then(([postRes, commentsRes]) => {
                setPost(postRes.data);
                setComments(commentsRes.data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [postId]);

    const handleAddComment = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = commentText.trim();
        if (!trimmed || submitting || !postId) return;
        setSubmitting(true);
        try {
            const { data } = await commentsApi.addComment(postId, trimmed);
            setComments(prev => [...prev, data]);
            setCommentText('');
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    }, [commentText, submitting, postId]);

    // ── Guard: no post ID in URL ──
    if (!postId) return null;

    // ── Loading state ──
    if (loading) {
        return (
            <div className="comments-page">
                <div className="comments-loading">
                    <div className="comments-spinner" />
                </div>
            </div>
        );
    }

    const userObj = post
        ? typeof post.userId === 'object' && post.userId !== null
            ? post.userId
            : { _id: '', username: 'Unknown User', email: '', avatarUrl: undefined }
        : null;

    return (
        <div className="comments-page">
            {/* ─── Top bar ─── */}
            <div className="comments-topbar">
                <button className="comments-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="comments-topbar-title">Comments</h1>
            </div>

            {/* ─── Post preview ─── */}
            {post && (
                <div className="comments-post-preview">
                    {post.imageUrl && (
                        <img src={post.imageUrl} alt={post.title} className="comments-post-image" />
                    )}
                    <div className="comments-post-info">
                        <h2 className="comments-post-title">{post.title}</h2>
                        {userObj && (
                            <span className="comments-post-author">by {userObj.username}</span>
                        )}
                    </div>
                </div>
            )}

            {/* ─── Comments list ─── */}
            <div className="comments-section">
                <p className="comments-section-header">
                    {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
                </p>

                {comments.length === 0 ? (
                    <div className="comments-empty">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <p>No comments yet. Be the first!</p>
                    </div>
                ) : (
                    <ul className="comments-list">
                        {comments.map(c => {
                            const avatar = c.userId.avatarUrl ?? null;
                            const initial = c.userId.username?.charAt(0).toUpperCase() || '?';
                            return (
                                <li key={c._id} className="comment-row">
                                    <div className="comment-avatar">
                                        {avatar
                                            ? <img src={avatar} alt={c.userId.username} />
                                            : <span>{initial}</span>
                                        }
                                    </div>
                                    <div className="comment-bubble">
                                        <span className="comment-bubble-author">{c.userId.username}</span>
                                        <span className="comment-bubble-time">{timeAgo(c.createdAt)}</span>
                                        <p className="comment-bubble-text">{c.content}</p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* ─── Add comment form ─── */}
            <div className="comments-form-wrap">
                <form className="comments-form" onSubmit={handleAddComment}>
                    <input
                        className="comments-input"
                        type="text"
                        placeholder="Add a comment…"
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        disabled={submitting}
                    />
                    <button
                        type="submit"
                        className="comments-submit"
                        disabled={!commentText.trim() || submitting}
                    >
                        Post
                    </button>
                </form>
            </div>
        </div>
    );
}
