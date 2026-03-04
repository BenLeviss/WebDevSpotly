import { useState } from 'react';
import type { Post } from '../api/posts';
import { postsApi } from '../api/posts';

interface Props {
    post: Post;
    currentUserId: string;
    onDeleted: (id: string) => void;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function getInitial(name: string) {
    return name?.charAt(0).toUpperCase() || '?';
}

export default function PostCard({ post, currentUserId, onDeleted }: Props) {
    const [deleting, setDeleting] = useState(false);

    const authorId = typeof post.userId === 'object' ? post.userId._id : post.userId;
    const authorName = typeof post.userId === 'object' ? post.userId.username : 'Unknown';
    const isOwner = authorId === currentUserId;

    const handleDelete = async () => {
        if (!window.confirm('Delete this spot?')) return;
        setDeleting(true);
        try {
            await postsApi.deletePost(post._id);
            onDeleted(post._id);
        } catch (err) {
            console.error('Failed to delete post', err);
            setDeleting(false);
        }
    };

    return (
        <article className="post-card">
            <div className="post-card-header">
                <div className="post-author-info">
                    <div className="post-avatar">{getInitial(authorName)}</div>
                    <div>
                        <div className="post-author-name">{authorName}</div>
                        <div className="post-date">{formatDate(post.createdAt)}</div>
                    </div>
                </div>

                {isOwner && (
                    <div className="post-actions">
                        <button
                            className="btn-icon danger"
                            onClick={handleDelete}
                            disabled={deleting}
                            title="Delete spot"
                        >
                            🗑
                        </button>
                    </div>
                )}
            </div>

            <h3 className="post-title">{post.title}</h3>
            {post.content && <p className="post-content">{post.content}</p>}
        </article>
    );
}
