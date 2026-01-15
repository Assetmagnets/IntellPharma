import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
    const { user, loading, token } = useAuth();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner-wrapper">
                    <div className="spinner-ring"></div>
                    <img src="/logo.png" alt="Loading..." className="loading-logo-static" />
                </div>
            </div>
        );
    }

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    if (roles && roles.length > 0 && !roles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
