import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [branches, setBranches] = useState([]);
    const [currentBranch, setCurrentBranch] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api/v1' : '/api/v1');

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
                const userBranches = data.branches || [];
                setBranches(userBranches);

                // Try to restore last used branch
                const savedBranchId = localStorage.getItem('currentBranch');
                const savedBranch = userBranches.find(b => b.id === savedBranchId);

                if (savedBranch) {
                    setCurrentBranch(savedBranch);
                } else if (userBranches.length > 0 && !currentBranch) {
                    setCurrentBranch(userBranches[0]);
                    // Save default to storage so it persists
                    localStorage.setItem('currentBranch', userBranches[0].id);
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
        const userBranches = data.branches || [];
        setBranches(userBranches);

        // Try to restore (safe if switching users on same machine due to .find check)
        const savedBranchId = localStorage.getItem('currentBranch');
        const savedBranch = userBranches.find(b => b.id === savedBranchId);

        if (savedBranch) {
            setCurrentBranch(savedBranch);
        } else if (userBranches.length > 0) {
            setCurrentBranch(userBranches[0]);
            localStorage.setItem('currentBranch', userBranches[0].id);
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

    const logout = async () => {
        // Call backend to log the logout action before clearing token
        try {
            if (token) {
                await fetch(`${API_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error('Logout API error:', error);
            // Continue with local logout even if API fails
        }

        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setBranches([]);
        setCurrentBranch(null);

        // Redirect to Landing Page
        window.location.href = '/';
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
        isAuthenticated: !!token,
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
