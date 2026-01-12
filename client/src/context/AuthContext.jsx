import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [branches, setBranches] = useState([]);
    const [currentBranch, setCurrentBranch] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

    useEffect(() => {
        if (token) {
            fetchProfile();
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchProfile = async () => {
        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data);
                setBranches(data.branches || []);
                if (data.branches?.length > 0 && !currentBranch) {
                    setCurrentBranch(data.branches[0]);
                }
            } else {
                logout();
            }
        } catch (error) {
            console.error('Fetch profile error:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setBranches(data.branches || []);
        if (data.branches?.length > 0) {
            setCurrentBranch(data.branches[0]);
        }

        return data;
    };

    const register = async (userData) => {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }

        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setBranches([data.branch]);
        setCurrentBranch(data.branch);

        return data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setBranches([]);
        setCurrentBranch(null);
    };

    const switchBranch = (branch) => {
        setCurrentBranch(branch);
        localStorage.setItem('currentBranch', branch.id);
    };

    const hasRole = (...roles) => {
        return user && roles.includes(user.role);
    };

    const canAccessFinancials = () => {
        return hasRole('OWNER', 'MANAGER');
    };

    const value = {
        user,
        token,
        branches,
        currentBranch,
        loading,
        login,
        register,
        logout,
        switchBranch,
        hasRole,
        canAccessFinancials,
        API_URL
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
