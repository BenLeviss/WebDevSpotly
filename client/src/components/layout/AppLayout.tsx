import './AppLayout.css';
import { NavLink } from 'react-router-dom';

// This component renders the page content + the bottom nav bar.
// `children` is whatever page is currently active (Home, Add, etc.)
export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="app-shell">

            {/* The current page fills this area */}
            <main className="app-main">{children}</main>

            {/* Bottom nav — always visible */}
            <nav className="bottom-nav">
                <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
                        <path d="M9 21V12h6v9" />
                    </svg>
                    <span>Home</span>
                </NavLink>

                <NavLink to="/add" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <span className="add-btn">＋</span>
                    <span>Add</span>
                </NavLink>

                <NavLink to="/places" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                        <circle cx="12" cy="9" r="2.5" />
                    </svg>
                    <span>My Places</span>
                </NavLink>

                <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                    <span>Profile</span>
                </NavLink>
            </nav>

        </div>
    );
}
