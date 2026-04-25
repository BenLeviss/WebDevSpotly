import './ProfilePage.css';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../api/user';
import type { UserProfile } from '../../api/user';
import { getErrorMessage } from '../../utils/errorUtils';

// ── Media URL helpers (module-level, same pattern as HomePage) ────────────────
const envApiUrl = import.meta.env.VITE_API_URL?.trim();
const isDevelopment = import.meta.env.MODE === 'development';
const backendBaseUrl = (isDevelopment
    ? 'http://localhost:3000'
    : (envApiUrl || window.location.origin))
    .replace(/\/$/, '')
    .replace(/\/api$/, '');

const resolveMediaUrl = (value?: string | null): string | null => {
    if (!value) return null;
    const trimmed = value.trim();
    const normalized = (trimmed === '/default-user.png' || trimmed === 'default-user.png')
        ? '/uploads/default-user.png'
        : trimmed;
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) return normalized;
    const relativePath = normalized.startsWith('/') ? normalized : `/${normalized}`;
    return `${backendBaseUrl}${relativePath}`;
};

export default function ProfilePage() {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // ── Edit-mode state ──
    const [editing, setEditing] = useState(false);
    const [editUsername, setEditUsername] = useState('');
    const [editBio, setEditBio] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!user) return;
        userApi.getUserById(user._id)
            .then(({ data }) => setProfile(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user]);

    // ── Handlers ──

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const enterEditMode = () => {
        setEditUsername(profile?.username || '');
        setEditBio(profile?.bio || '');
        setAvatarFile(null);
        setAvatarPreview(null);
        setError('');
        setEditing(true);
    };

    const cancelEdit = () => {
        setEditing(false);
        setAvatarFile(null);
        setAvatarPreview(null);
        setError('');
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleSave = async () => {
        if (!user || !profile) return;

        const trimmedUsername = editUsername.trim();
        if (!trimmedUsername) {
            setError('Username cannot be empty.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('username', trimmedUsername);
            formData.append('bio', editBio);
            if (avatarFile) {
                formData.append('image', avatarFile);
            }

            const { data } = await userApi.updateUser(user._id, formData);

            // Sync local state
            setProfile(data);
            updateUser({ username: data.username, avatarUrl: data.avatarUrl });
            setEditing(false);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to update profile.'));
        } finally {
            setSaving(false);
        }
    };

    // ── Derived values ──

    const avatarUrlRaw = profile?.avatarUrl ?? user?.avatarUrl ?? '/uploads/default-user.png';
    const displayAvatarSrc = editing && avatarPreview
        ? avatarPreview
        : resolveMediaUrl(avatarUrlRaw);

    const initial = profile?.username?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || '?';

    if (loading) {
        return (
            <div className="profile-loading">
                <div className="profile-spinner" />
            </div>
        );
    }

    return (
        <div className="profile-page">

            {/* All content constrained to a readable width */}
            <div className="profile-content">

                {/* Avatar + Name */}
                <div className="profile-hero">
                    <div
                        className={`avatar-wrap${editing ? ' avatar-editable' : ''}`}
                        onClick={editing ? handleAvatarClick : undefined}
                        title={editing ? 'Change profile picture' : undefined}
                    >
                        {displayAvatarSrc
                            ? <img
                                src={displayAvatarSrc}
                                alt="avatar"
                                className="avatar-img"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    const placeholder = (e.target as HTMLImageElement).nextElementSibling as HTMLElement | null;
                                    if (placeholder) placeholder.style.display = 'flex';
                                }}
                              />
                            : null
                        }
                        <div className="avatar-placeholder" style={{ display: displayAvatarSrc ? 'none' : 'flex' }}>{initial}</div>
                        {editing && (
                            <div className="avatar-overlay">
                                <span className="avatar-overlay-icon">📷</span>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png"
                            onChange={handleFileChange}
                            className="avatar-file-input"
                        />
                    </div>

                    {editing ? (
                        <input
                            type="text"
                            className="edit-username-input"
                            value={editUsername}
                            onChange={(e) => setEditUsername(e.target.value)}
                            placeholder="Username"
                            maxLength={30}
                        />
                    ) : (
                        <h2 className="profile-username">{profile?.username}</h2>
                    )}
                </div>

                <div className="profile-divider" />

                {/* About / Bio */}
                <section className="profile-section">
                    <h3 className="profile-section-title">About</h3>
                    {editing ? (
                        <textarea
                            className="edit-bio-textarea"
                            value={editBio}
                            onChange={(e) => setEditBio(e.target.value)}
                            placeholder="Write something about yourself…"
                            maxLength={500}
                            rows={4}
                        />
                    ) : (
                        <p className="profile-bio">{profile?.bio || 'No bio yet.'}</p>
                    )}
                </section>

                <div className="profile-divider" />

                {/* Error message */}
                {error && <p className="profile-error">{error}</p>}

                {/* Action buttons */}
                <div className="profile-actions">
                    {editing ? (
                        <>
                            <button
                                className="btn-save-profile"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? (
                                    <span className="btn-saving-spinner" />
                                ) : (
                                    'Save'
                                )}
                            </button>
                            <button
                                className="btn-cancel-profile"
                                onClick={cancelEdit}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="btn-edit-profile" onClick={enterEditMode}>
                                Edit Profile
                            </button>
                            <button className="btn-logout-profile" onClick={handleLogout}>
                                <span className="logout-icon">⇥</span>
                                Logout
                            </button>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
}
