import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    LayoutDashboard,
    Store,
    LogOut,
    ShieldCheck,
    Menu,
    X,
    Sun,
    Moon,
    Activity,
    FileText
} from 'lucide-react';
import { useState } from 'react';
import '../styles/sidebar.css';

export default function SuperAdminLayout() {
    const { logout, user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/super-admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
        { path: '/super-admin/pharmacies', icon: Store, label: 'Pharmacies' },
        { path: '/super-admin/activity', icon: Activity, label: 'Activity Logs' },
        { path: '/super-admin/blog', icon: FileText, label: 'Blog' },
    ];

    const closeSidebar = () => setIsOpen(false);

    return (
        <div className="dashboard-layout">
            {/* Mobile Menu Button */}
            <button
                className={`mobile-menu-btn ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay for mobile */}
            {isOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

            {/* Sidebar */}
            <aside className={`sidebar glass-sidebar super-admin-sidebar ${isOpen ? 'open' : ''}`}>
                {/* Logo */}
                <div className="sidebar-logo">
                    <img src="/logo.png" alt="IntellPharma" className="sidebar-logo-img" />
                    <span className="logo-text">IntellPharma</span>
                </div>

                {/* Super Admin Badge */}
                <div className="branch-switcher">
                    <div className="admin-badge">
                        <ShieldCheck size={18} />
                        <div>
                            <p className="switcher-label" style={{ marginBottom: '2px' }}>Super Admin</p>
                            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--dark-text)' }}>{user?.name}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`nav-item ${isActive ? 'active' : ''}`}
                                onClick={closeSidebar}
                            >
                                <Icon className="nav-icon" size={20} />
                                <span className="nav-label">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Theme Toggle */}
                <div className="theme-toggle">
                    <div
                        className="theme-toggle-btn"
                        onClick={toggleTheme}
                        style={{ cursor: 'pointer' }}
                    >
                        {theme === 'dark' ? (
                            <Moon className="theme-icon" size={20} />
                        ) : (
                            <Sun className="theme-icon" size={20} />
                        )}
                        <span className="theme-label">
                            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                        </span>
                        <label className="toggle-switch" onClick={(e) => e.stopPropagation()}>
                            <input
                                type="checkbox"
                                checked={theme === 'dark'}
                                onChange={toggleTheme}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                {/* Logout */}
                <div style={{ padding: '1rem', borderTop: '1px solid var(--dark-border)' }}>
                    <button
                        onClick={handleLogout}
                        className="nav-item"
                        style={{ width: '100%', color: 'var(--error)', justifyContent: 'flex-start' }}
                    >
                        <LogOut size={20} />
                        <span className="nav-label">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="dashboard-main">
                <Outlet />
            </main>
        </div>
    );
}
