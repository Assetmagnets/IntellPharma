import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

import {
    Home,
    ReceiptText,
    Package,
    BarChart3,
    Store,
    Users,
    Crown,
    Settings,
    Pill,
    Menu,
    X,
    Sun,
    Moon
} from 'lucide-react';

import '../styles/sidebar.css';

export default function Sidebar() {
    const { user, branches, currentBranch, switchBranch, logout, hasRole } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);


    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { path: '/dashboard', icon: Home, label: 'Dashboard', roles: ['OWNER', 'MANAGER', 'PHARMACIST', 'BILLING_STAFF', 'INVENTORY_STAFF'] },
        { path: '/billing', icon: ReceiptText, label: 'Billing', roles: ['OWNER', 'MANAGER', 'PHARMACIST', 'BILLING_STAFF'] },
        { path: '/inventory', icon: Package, label: 'Inventory', roles: ['OWNER', 'MANAGER', 'PHARMACIST', 'INVENTORY_STAFF'] },
        { path: '/reports', icon: BarChart3, label: 'Reports', roles: ['OWNER', 'MANAGER'] },
        { path: '/branches', icon: Store, label: 'Branches', roles: ['OWNER'] },
        { path: '/users', icon: Users, label: 'Users', roles: ['OWNER', 'MANAGER'] },
        { path: '/subscription', icon: Crown, label: 'Subscription', roles: ['OWNER'] },
        { path: '/settings', icon: Settings, label: 'Settings', roles: ['OWNER', 'MANAGER'] },
    ];

    const filteredMenu = menuItems.filter(item =>
        item.roles.some(role => hasRole(role))
    );

    const closeSidebar = () => setIsOpen(false);

    return (
        <>
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

            <aside className={`sidebar glass-sidebar ${isOpen ? 'open' : ''}`}>
                {/* Logo */}
                <div className="sidebar-logo">
                    <img src="/logo.png" alt="IntellPharma" className="sidebar-logo-img" />
                    <span className="logo-text">IntellPharma</span>
                </div>

                {/* Branch Switcher */}
                {branches.length > 0 && (
                    <div className="branch-switcher">
                        <label className="switcher-label">Current Branch</label>
                        <select
                            className="branch-select glass-input"
                            value={currentBranch?.id || ''}
                            onChange={(e) => {
                                const branch = branches.find(b => b.id === e.target.value);
                                if (branch) switchBranch(branch);
                            }}
                        >
                            {hasRole('OWNER') && <option value="all">All Branches</option>}
                            {branches.map(branch => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {filteredMenu.map(item => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `nav-item ${isActive ? 'active' : ''}`
                                }
                                onClick={closeSidebar}
                                style={{ position: 'relative' }}
                            >
                                <Icon className="nav-icon" size={20} />
                                <span className="nav-label">{item.label}</span>
                                {item.badge > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: '#ef4444',
                                        color: 'white',
                                        fontSize: '0.6875rem',
                                        fontWeight: '700',
                                        minWidth: '20px',
                                        height: '20px',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '0 6px',
                                        boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
                                    }}>
                                        {item.badge > 99 ? '99+' : item.badge}
                                    </span>
                                )}
                            </NavLink>
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
            </aside>
        </>
    );
}
