import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyPlacesPage.css';
import { postsApi } from '../../api/posts';
import type { Post } from '../../api/posts';
import { useAuth } from '../../context/AuthContext';

// ─── PlaceGridItem ────────────────────────────────────────────────────────────

interface PlaceGridItemProps {
    post: Post;
    onEdit: (post: Post) => void;
    onDelete: (post: Post) => void;
}

function PlaceGridItem({ post, onEdit, onDelete }: PlaceGridItemProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const likeCount = (post.likes ?? []).length;
    const commentCount = post.commentCount ?? 0;

    // Close menu on outside click
    useEffect(() => {
        if (!menuOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [menuOpen]);

    return (
        <div className="place-grid-item">
            {/* Place image */}
            <img
                src={post.imageUrl}
                alt={post.title}
                className="place-grid-image"
            />

            {/* Hover overlay with stats */}
            <div className="place-grid-overlay">
                <h3 className="overlay-title">{post.title}</h3>
                <div className="overlay-stats">
                    <span className="overlay-stat">
                        <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                        {likeCount}
                    </span>
                    <span className="overlay-stat">
                        <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        {commentCount}
                    </span>
                </div>
            </div>

            {/* ⋮ Menu button */}
            <div className="place-grid-menu-wrap" ref={menuRef}>
                <button
                    className="place-grid-menu-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(prev => !prev);
                    }}
                    aria-label="Post options"
                >
                    ⋮
                </button>

                {menuOpen && (
                    <div className="place-grid-dropdown">
                        <button
                            className="dropdown-item"
                            onClick={() => {
                                setMenuOpen(false);
                                onEdit(post);
                            }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Edit
                        </button>
                        <button
                            className="dropdown-item dropdown-item-danger"
                            onClick={() => {
                                setMenuOpen(false);
                                onDelete(post);
                            }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Delete Confirmation Modal ───────────────────────────────────────────────

interface DeleteModalProps {
    post: Post;
    deleting: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

function DeleteModal({ post, deleting, onCancel, onConfirm }: DeleteModalProps) {
    return (
        <div className="delete-modal-backdrop" onClick={onCancel}>
            <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
                <div className="delete-modal-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                </div>
                <h2 className="delete-modal-title">Delete Place?</h2>
                <p className="delete-modal-text">
                    Are you sure you want to delete <strong>"{post.title}"</strong>? This action cannot be undone.
                </p>
                <div className="delete-modal-actions">
                    <button
                        className="modal-btn modal-btn-cancel"
                        onClick={onCancel}
                        disabled={deleting}
                    >
                        Cancel
                    </button>
                    <button
                        className="modal-btn modal-btn-delete"
                        onClick={onConfirm}
                        disabled={deleting}
                    >
                        {deleting ? 'Deleting…' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── MyPlacesPage ────────────────────────────────────────────────────────────

export default function MyPlacesPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Delete confirmation state
    const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        setError(null);
        postsApi.getMyPosts(user._id)
            .then(({ data }) => setPosts(data))
            .catch(() => setError('Could not load your places.'))
            .finally(() => setLoading(false));
    }, [user]);

    const handleEditRequest = (post: Post) => {
        navigate(`/places/${post._id}/edit`);
    };

    const handleDeleteRequest = (post: Post) => {
        setDeleteTarget(post);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await postsApi.deletePost(deleteTarget._id);
            setPosts(prev => prev.filter(p => p._id !== deleteTarget._id));
            setDeleteTarget(null);
        } catch {
            setError('Failed to delete place.');
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteTarget(null);
    };

    // Only show posts that have images (gallery view)
    const postsWithImages = posts.filter(p => p.imageUrl);

    return (
        <div className="my-places-page">
            {/* Page header */}
            <header className="my-places-header">
                <div className="my-places-header-brand">
                    <svg className="my-places-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                        <circle cx="12" cy="9" r="2.5" />
                    </svg>
                    <h1 className="my-places-title">My Places</h1>
                </div>
                {!loading && !error && (
                    <span className="my-places-count">
                        {postsWithImages.length} {postsWithImages.length === 1 ? 'place' : 'places'} shared
                    </span>
                )}
                <div className="my-places-header-divider" />
            </header>

            {/* Loading */}
            {loading && (
                <div className="my-places-loading">
                    <div className="my-places-spinner" />
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="my-places-error">{error}</div>
            )}

            {/* Empty state */}
            {!loading && !error && postsWithImages.length === 0 && (
                <div className="my-places-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                        <circle cx="12" cy="9" r="2.5" />
                    </svg>
                    <p>No places shared yet.</p>
                    <span>Start sharing your favorite spots!</span>
                </div>
            )}

            {/* Gallery grid */}
            {!loading && !error && postsWithImages.length > 0 && (
                <div className="places-grid">
                    {postsWithImages.map(post => (
                        <PlaceGridItem
                            key={post._id}
                            post={post}
                            onEdit={handleEditRequest}
                            onDelete={handleDeleteRequest}
                        />
                    ))}
                </div>
            )}

            {/* Delete confirmation modal */}
            {deleteTarget && (
                <DeleteModal
                    post={deleteTarget}
                    deleting={deleting}
                    onCancel={handleDeleteCancel}
                    onConfirm={handleDeleteConfirm}
                />
            )}
        </div>
    );
}
