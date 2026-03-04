import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <a href="/" className="navbar-brand">
                <img src="/spotly-logo.png" alt="Spotly" className="navbar-logo" />
                <span className="navbar-name">SP<span>O</span>TLY</span>
            </a>

            <div className="navbar-right">
                {user && (
                    <span className="navbar-user">
                        Hi, <strong>{user.username}</strong>
                    </span>
                )}
                <button
                    id="logout-btn"
                    className="btn-logout"
                    onClick={handleLogout}
                >
                    Log Out
                </button>
            </div>
        </nav>
    );
}
