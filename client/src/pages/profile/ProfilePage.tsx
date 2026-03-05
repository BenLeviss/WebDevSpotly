import './ProfilePage.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../api/user';
import type { UserProfile } from '../../api/user';

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        userApi.getUserById(user._id)
            .then(({ data }) => setProfile(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const avatarSrc = profile?.avatarUrl
        ? `http://localhost:3000${profile.avatarUrl}`
        : null;

    const initial = profile?.username?.charAt(0).toUpperCase() || '?';

    if (loading) {
        return (
            <div className="profile-loading">
                <div className="profile-spinner" />
            </div>
        );
    }

    return (
        <div className="profile-page">

            {/* Header */}
            <header className="profile-header">
                <h1 className="profile-header-title">Profile</h1>
            </header>

            {/* All content constrained to a readable width */}
            <div className="profile-content">

                {/* Avatar + Name */}
                <div className="profile-hero">
                    <div className="avatar-wrap">
                        {avatarSrc
                            ? <img src={avatarSrc} alt="avatar" className="avatar-img" />
                            : <div className="avatar-placeholder">{initial}</div>
                        }
                    </div>
                    <h2 className="profile-username">{profile?.username}</h2>

                </div>

                <div className="profile-divider" />

                {/* About / Bio */}
                <section className="profile-section">
                    <h3 className="profile-section-title">About</h3>
                    <p className="profile-bio">{profile?.bio || 'No bio yet.'}</p>
                </section>

                <div className="profile-divider" />

                {/* Action buttons */}
                <div className="profile-actions">
                    <button className="btn-edit-profile">
                        Edit Profile
                    </button>
                    <button className="btn-logout-profile" onClick={handleLogout}>
                        <span className="logout-icon">⇥</span>
                        Logout
                    </button>
                </div>

            </div>
        </div>
    );
}
