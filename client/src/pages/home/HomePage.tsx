import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './HomePage.css';
import { postsApi } from '../../api/posts';
import type { Post } from '../../api/posts';
import { useAuth } from '../../context/AuthContext';
import { aiSearchApi } from '../../api/aiSearch';
import type { ParsedSearchQuery } from '../../api/aiSearch';
import { getErrorMessage } from '../../utils/errorUtils';

const envApiUrl = import.meta.env.VITE_API_URL?.trim();
const isLocalHost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
const isEnvLocalhost = !!envApiUrl && /localhost|127\.0\.0\.1/.test(envApiUrl);
const backendBaseUrl = ((!isLocalHost && isEnvLocalhost) ? window.location.origin : (envApiUrl || (isLocalHost ? 'http://localhost:3000' : window.location.origin)))
    .replace(/\/$/, '')
    .replace(/\/api$/, '');

const resolveMediaUrl = (value?: string | null) => {
    if (!value) return null;
    const normalized = value === '/default-user.png' ? '/uploads/default-user.png' : value;
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) return normalized;
    return `${backendBaseUrl}${normalized}`;
};

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

function buildSearchText(post: Post): string {
    const userObj = typeof post.userId === 'object' && post.userId !== null
        ? post.userId
        : { username: '' };

    return [
        post.title,
        post.content,
        post.category,
        userObj.username,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
}

function applyAiFilters(posts: Post[], parsed: ParsedSearchQuery): Post[] {
    const { filters } = parsed;
    const include = (filters.keywordsInclude ?? []).map(k => k.toLowerCase()).filter(Boolean);
    const exclude = (filters.keywordsExclude ?? []).map(k => k.toLowerCase()).filter(Boolean);
    const tags = (filters.tags ?? []).map(t => t.toLowerCase()).filter(Boolean);
    const category = filters.category?.toLowerCase() || null;

    const filtered = posts.filter((post) => {
        const text = buildSearchText(post);
        const postCategory = (post.category || '').toLowerCase();

        if (category && postCategory !== category) return false;

        if (include.length > 0 && !include.every((kw) => text.includes(kw))) return false;

        if (exclude.some((kw) => text.includes(kw))) return false;

        if (tags.length > 0 && !tags.every((tag) => text.includes(tag))) return false;

        return true;
    });

    const sorted = [...filtered];
    switch (filters.sort) {
        case 'newest':
            sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
            break;
        case 'oldest':
            sorted.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
            break;
        case 'mostLiked':
            sorted.sort((a, b) => (b.likes?.length ?? 0) - (a.likes?.length ?? 0));
            break;
        case 'relevance': {
            const relevanceTerms = [...include, ...tags];
            sorted.sort((a, b) => {
                const aText = buildSearchText(a);
                const bText = buildSearchText(b);
                const aScore = relevanceTerms.reduce((sum, term) => sum + (aText.includes(term) ? 1 : 0), 0);
                const bScore = relevanceTerms.reduce((sum, term) => sum + (bText.includes(term) ? 1 : 0), 0);
                if (bScore !== aScore) return bScore - aScore;
                return +new Date(b.createdAt) - +new Date(a.createdAt);
            });
            break;
        }
        default:
            break;
    }

    return sorted;
}


// ─── PlaceCard ────────────────────────────────────────────────────────────────

interface PlaceCardProps {
    post: Post;
    currentUserId: string;
    onLikeToggle: (postId: string) => void;
}

function PlaceCard({ post, currentUserId, onLikeToggle }: PlaceCardProps) {
    const navigate = useNavigate();
    // Prevent double-fire from double-click or React StrictMode
    const likingRef = useRef(false);

    // Guard: old/legacy posts may have userId as a plain string (not populated)
    const userObj = typeof post.userId === 'object' && post.userId !== null
        ? post.userId
        : { _id: '', username: 'Unknown User', email: '', avatarUrl: undefined };

    const liked = Array.isArray(post.likes) && post.likes.includes(currentUserId);
    const likeCount = (post.likes ?? []).length;

    const avatarUrl = resolveMediaUrl(userObj.avatarUrl);
    const imageUrl = resolveMediaUrl(post.imageUrl);
    const initial = userObj.username?.charAt(0).toUpperCase() || '?';

    return (
        <article className="place-card">
            {/* Card header — poster info */}
            <div className="card-header">
                <div className="card-avatar">
                    {avatarUrl
                        ? <img src={avatarUrl} alt={userObj.username} />
                        : <span>{initial}</span>
                    }
                </div>
                <div className="card-meta">
                    <span className="card-username">{userObj.username}</span>
                    <span className="card-time">{timeAgo(post.createdAt)}</span>
                </div>
            </div>

            {/* Place image */}
            {imageUrl && (
                <div className="card-image-wrap">
                    <img
                        src={imageUrl}
                        alt={post.title}
                        className="card-image"
                    />
                </div>
            )}

            {/* Action row */}
            <div className="card-actions">
                <button
                    className={`action-btn like-btn${liked ? ' liked' : ''}`}
                    onClick={() => {
                        if (likingRef.current) return;
                        likingRef.current = true;
                        onLikeToggle(post._id);
                        // Reset guard after a short delay
                        setTimeout(() => { likingRef.current = false; }, 250);
                    }}
                    aria-label={liked ? 'Unlike' : 'Like'}
                >
                    <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <span>{likeCount}</span>
                </button>

                <button
                    className="action-btn comment-btn"
                    onClick={() => navigate(`/post/${post._id}/comments`)}
                    aria-label="View comments"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span>{post.commentCount ?? 0}</span>
                </button>
            </div>

            {/* Place details */}
            <div className="card-body">
                {post.category && (
                    <div className="card-category">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                            <circle cx="12" cy="9" r="2.5" />
                        </svg>
                        <span>{post.category}</span>
                    </div>
                )}
                <h2 className="card-title">{post.title}</h2>
                {post.content && (
                    <p className="card-content">{post.content}</p>
                )}
            </div>
        </article>
    );
}

// ─── HomePage ─────────────────────────────────────────────────────────────────

export default function HomePage() {
    const { user } = useAuth();
    const location = useLocation();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [aiQuery, setAiQuery] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiApplied, setAiApplied] = useState(false);
    const [aiResult, setAiResult] = useState<ParsedSearchQuery | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);

    const PAGE_SIZE = 5;

    // Sentinel ref for infinite scroll
    const sentinelRef = useRef<HTMLDivElement>(null);

    const fetchFirstPage = useCallback(async () => {
        setLoading(true);
        setError(null);
        setAiError(null);
        try {
            const { data } = await postsApi.getPosts(0, PAGE_SIZE);
            setPosts(data);
            setHasMore(data.length >= PAGE_SIZE);
        } catch {
            setError('Could not load posts.');
        } finally {
            setLoading(false);
        }
    }, [PAGE_SIZE]);

    // Reset & fetch first page whenever we land on this page
    useEffect(() => {
        setPosts([]);
        setHasMore(true);
        setAiApplied(false);
        setAiResult(null);
        setAiError(null);
        fetchFirstPage();
    }, [location.key, fetchFirstPage]);

    // Load more posts (appends to existing list)
    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore || aiApplied) return;
        setLoadingMore(true);
        try {
            const { data } = await postsApi.getPosts(posts.length, PAGE_SIZE);
            setPosts(prev => [...prev, ...data]);
            if (data.length < PAGE_SIZE) setHasMore(false);
        } catch {
            // silently fail on load-more
        } finally {
            setLoadingMore(false);
        }
    }, [posts.length, loadingMore, hasMore, aiApplied]);

    // IntersectionObserver — triggers loadMore when sentinel becomes visible
    useEffect(() => {
        if (loading || !hasMore || aiApplied) return;
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) loadMore(); },
            { rootMargin: '200px' }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [loading, hasMore, aiApplied, loadMore]);

    const runAiSearch = useCallback(async () => {
        const query = aiQuery.trim();
        if (!query) {
            setAiError('Please enter a search query.');
            return;
        }

        setAiLoading(true);
        setAiError(null);
        setError(null);

        try {
            const [{ data: parsed }, { data: allPosts }] = await Promise.all([
                aiSearchApi.parseQuery(query),
                postsApi.getPosts(0, 100),
            ]);

            const filtered = applyAiFilters(allPosts, parsed);
            setAiResult(parsed);
            setPosts(filtered);
            setAiApplied(true);
            setHasMore(false);
        } catch (err: unknown) {
            setAiError(getErrorMessage(err, 'AI search failed. Please try again.'));
        } finally {
            setAiLoading(false);
        }
    }, [aiQuery]);

    const clearAiSearch = useCallback(async () => {
        setAiQuery('');
        setAiApplied(false);
        setAiResult(null);
        setAiError(null);
        await fetchFirstPage();
    }, [fetchFirstPage]);

    // Optimistic like toggle
    const handleLikeToggle = useCallback(async (postId: string) => {
        if (!user) return;

        // Optimistic update
        setPosts(prev => prev.map(p => {
            if (p._id !== postId) return p;
            const currentLikes = p.likes ?? [];
            const liked = currentLikes.includes(user._id);
            return {
                ...p,
                likes: liked
                    ? currentLikes.filter(id => id !== user._id)
                    : [...currentLikes, user._id],
            };
        }));

        try {
            await postsApi.toggleLike(postId);
        } catch {
            // Revert on error
            setPosts(prev => prev.map(p => {
                if (p._id !== postId) return p;
                const currentLikes = p.likes ?? [];
                const wasLiked = !currentLikes.includes(user._id);
                return {
                    ...p,
                    likes: wasLiked
                        ? currentLikes.filter(id => id !== user._id)
                        : [...currentLikes, user._id],
                };
            }));
        }
    }, [user]);

    return (
        <div className="home-page">
            <div className="home-ai-search-wrap">
                <div className="home-ai-search-row">
                    <input
                        type="text"
                        className="home-ai-input"
                        placeholder="Try: quiet cafe with wifi, no loud music"
                        value={aiQuery}
                        onChange={(e) => setAiQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !aiLoading) {
                                e.preventDefault();
                                runAiSearch();
                            }
                        }}
                    />
                    <button
                        type="button"
                        className="home-ai-btn"
                        onClick={runAiSearch}
                        disabled={aiLoading}
                    >
                        {aiLoading ? 'Searching…' : 'AI Search'}
                    </button>
                    {aiApplied && (
                        <button
                            type="button"
                            className="home-ai-clear-btn"
                            onClick={clearAiSearch}
                            disabled={aiLoading}
                        >
                            Clear
                        </button>
                    )}
                </div>

                {aiResult && (
                    <p className="home-ai-meta">
                        <strong>AI:</strong> {aiResult.normalizedQuery} · confidence {Math.round(aiResult.confidence * 100)}%
                    </p>
                )}

                {aiError && <div className="home-error">{aiError}</div>}
            </div>

            {loading && (
                <div className="home-loading">
                    <div className="home-spinner" />
                </div>
            )}

            {error && (
                <div className="home-error">{error}</div>
            )}

            {!loading && !error && posts.length === 0 && (
                <div className="home-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                        <circle cx="12" cy="9" r="2.5" />
                    </svg>
                    <p>No places shared yet.</p>
                    <span>Be the first to add one!</span>
                </div>
            )}

            <div className="feed">
                {posts.map(post => (
                    <PlaceCard
                        key={post._id}
                        post={post}
                        currentUserId={user?._id ?? ''}
                        onLikeToggle={handleLikeToggle}
                    />
                ))}
            </div>

            {/* Sentinel for infinite scroll — triggers next page load */}
            {!loading && hasMore && !aiApplied && (
                <div ref={sentinelRef} className="home-loading" style={{ padding: '20px 0' }}>
                    {loadingMore && <div className="home-spinner" />}
                </div>
            )}
        </div>
    );
}
