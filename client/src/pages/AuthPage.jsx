import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import {
    AlertTriangle,
    Loader2,
    Eye,
    EyeOff,
    Sparkles,
    Shield,
    Zap,
    BarChart3,
    ArrowLeft
} from 'lucide-react';
import '../styles/auth.css';

export default function AuthPage() {
    const [searchParams] = useSearchParams();
    const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
    const [activeTab, setActiveTab] = useState(initialMode);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    return (
        <div className="auth-page-wrapper">
            <SEO
                title={activeTab === 'login' ? 'Login - IntellPharma' : 'Register - IntellPharma'}
                description="Access IntellPharma - India's #1 Smart Pharmacy Management System. Login or create an account to manage your pharmacy."
                keywords="intellpharma login, pharmacy software login, intellpharma register, pharmacy management signup"
                canonicalUrl="/auth"
            />

            {/* Background Effects */}
            <div className="auth-bg-effects">
                <div className="auth-bg-gradient"></div>
                <div className="auth-bg-pattern"></div>
                <div className="auth-bg-glow auth-bg-glow-1"></div>
                <div className="auth-bg-glow auth-bg-glow-2"></div>
            </div>

            <div className="auth-split-container">
                {/* Left Panel - Branding */}
                <div className="auth-branding-panel">
                    <Link to="/" className="auth-back-link">
                        <ArrowLeft size={18} />
                        Back to Home
                    </Link>

                    <div className="auth-branding-content">
                        <div className="auth-brand-logo">
                            <img src="/logo.png" alt="IntellPharma" className="auth-brand-img" />
                            <span className="auth-brand-text">IntellPharma</span>
                        </div>

                        <h1 className="auth-brand-title">
                            Smart Pharmacy
                            <span className="auth-brand-gradient">Management</span>
                        </h1>

                        <p className="auth-brand-subtitle">
                            India's #1 cloud-based pharmacy software with AI-powered inventory, GST billing, and real-time analytics.
                        </p>

                        <div className="auth-features-list">
                            <div className="auth-feature-item">
                                <div className="auth-feature-icon">
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <h4>Bank-Grade Security</h4>
                                    <p>256-bit encryption & daily backups</p>
                                </div>
                            </div>
                            <div className="auth-feature-item">
                                <div className="auth-feature-icon">
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <h4>Lightning Fast</h4>
                                    <p>Process bills in under 5 seconds</p>
                                </div>
                            </div>
                            <div className="auth-feature-item">
                                <div className="auth-feature-icon">
                                    <BarChart3 size={20} />
                                </div>
                                <div>
                                    <h4>AI Analytics</h4>
                                    <p>Smart insights for better decisions</p>
                                </div>
                            </div>
                        </div>

                        <div className="auth-trust-badges">
                            <span>🔒 SSL Secured</span>
                            <span>📊 GST Compliant</span>
                            <span>☁️ 99.9% Uptime</span>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Forms */}
                <div className="auth-form-panel">
                    <div className="auth-form-container">
                        {/* Tabs */}
                        <div className="auth-tabs">
                            <button
                                className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
                                onClick={() => setActiveTab('login')}
                            >
                                Sign In
                            </button>
                            <button
                                className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
                                onClick={() => setActiveTab('register')}
                            >
                                Create Account
                            </button>
                            <div
                                className="auth-tab-indicator"
                                style={{ transform: activeTab === 'register' ? 'translateX(100%)' : 'translateX(0)' }}
                            />
                        </div>

                        {/* Form Content */}
                        <div className="auth-form-content">
                            {activeTab === 'login' ? (
                                <LoginFormContent onSwitchToRegister={() => setActiveTab('register')} />
                            ) : (
                                <RegisterFormContent onSwitchToLogin={() => setActiveTab('login')} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Login Form Component
function LoginFormContent({ onSwitchToRegister }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await login(email, password);
            if (response.user.role === 'SUPERADMIN') {
                navigate('/super-admin/dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-form-inner animate-fadeIn">
            <div className="auth-form-header">
                <h2>Welcome Back</h2>
                <p>Sign in to manage your pharmacy</p>
            </div>

            {error && (
                <div className="alert alert-error">
                    <AlertTriangle size={18} />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                        type="email"
                        className="form-input glass-input"
                        placeholder="you@pharmacy.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoFocus
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Password</label>
                    <div className="input-with-icon">
                        <input
                            type={showPassword ? "text" : "password"}
                            className="form-input glass-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className="input-icon-btn"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div className="form-options">
                    <label className="checkbox-label">
                        <input type="checkbox" />
                        <span>Remember me</span>
                    </label>
                    <Link to="/forgot-password" className="link">
                        Forgot password?
                    </Link>
                </div>

                <button
                    type="submit"
                    className="btn btn-primary btn-lg w-full auth-submit-btn"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            Signing in...
                        </>
                    ) : (
                        'Sign In'
                    )}
                </button>
            </form>

            <div className="auth-form-footer">
                <p>
                    Don't have an account?{' '}
                    <button onClick={onSwitchToRegister} className="link-btn">
                        Create one
                    </button>
                </p>
            </div>
        </div>
    );
}

// Register Form Component
function RegisterFormContent({ onSwitchToLogin }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        branchName: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            await register({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                branchName: formData.branchName
            });
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-form-inner animate-fadeIn">
            <div className="auth-form-header">
                <h2>Create Account</h2>
                <p>Start managing your pharmacy today</p>
            </div>

            {error && (
                <div className="alert alert-error">
                    <AlertTriangle size={18} />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            className="form-input glass-input"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            className="form-input glass-input"
                            placeholder="+91 98765 43210"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                        type="email"
                        name="email"
                        className="form-input glass-input"
                        placeholder="you@pharmacy.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Pharmacy Name</label>
                    <input
                        type="text"
                        name="branchName"
                        className="form-input glass-input"
                        placeholder="My Pharmacy"
                        value={formData.branchName}
                        onChange={handleChange}
                        required
                    />
                    <span className="form-hint">This will be your first branch name</span>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div className="input-with-icon">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                className="form-input glass-input"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                className="input-icon-btn"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <div className="input-with-icon">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                className="form-input glass-input"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                            <button
                                type="button"
                                className="input-icon-btn"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label className="checkbox-label">
                        <input type="checkbox" required />
                        <span>
                            I agree to the{' '}
                            <Link to="/terms" className="link">Terms of Service</Link>
                            {' '}and{' '}
                            <Link to="/privacy" className="link">Privacy Policy</Link>
                        </span>
                    </label>
                </div>

                <button
                    type="submit"
                    className="btn btn-primary btn-lg w-full auth-submit-btn"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            Creating Account...
                        </>
                    ) : (
                        'Create Account'
                    )}
                </button>
            </form>

            <div className="auth-plan-badge">
                <Sparkles size={16} />
                <span>Your account includes the Basic plan (1 branch free). Upgrade anytime.</span>
            </div>

            <div className="auth-form-footer">
                <p>
                    Already have an account?{' '}
                    <button onClick={onSwitchToLogin} className="link-btn">
                        Sign in
                    </button>
                </p>
            </div>
        </div>
    );
}
