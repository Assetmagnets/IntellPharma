import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
    const { user, loading, token } = useAuth();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-content">
                    <img src="/medistock-logo-full.png" alt="Medistock" className="loading-logo" />
                    <div className="spinner spinner-lg text-primary"></div>
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
