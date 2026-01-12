import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LogOutIcon } from 'lucide-react';
import '../styles/header.css';

export default function Header({ title, icon: Icon, children }) {
    const { user, currentBranch, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="app-header">
            <div className="header-left">
                <h1>
                    {Icon && <Icon className="header-icon" size={24} />}
                    {title}
                </h1>
                <p className="header-subtitle">
                    Welcome back, <strong>{user?.name}</strong>!
                    {currentBranch && (
                        <> Here's what's happening at <strong>{currentBranch?.name}</strong>.</>
                    )}
                </p>
            </div>

            <div className="header-right">
                {children}
                {/* User Info */}
                <div className="header-user">
                    <div className="user-avatar">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                        <span className="user-name">{user?.name}</span>
                        <span className="user-role">{user?.role}</span>
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    className='btn btn-small logout-btn'
                    onClick={handleLogout}
                    title="Logout"
                >
                    <LogOut size={16} />
                    logout
                </button>
            </div>
        </header>
    );
}
