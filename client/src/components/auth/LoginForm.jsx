import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuthModal } from '../../context/AuthModalContext';

export default function LoginForm({ onSuccess, isModal = false }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    // Try getting auth modal context, but don't fail if not present (for standalone page)
    // Try getting auth modal context, but don't fail if not present (for standalone page)
    let openRegister;
    let openForgotPassword;
    try {
        const modalContext = useAuthModal();
        openRegister = modalContext.openRegister;
        openForgotPassword = modalContext.openForgotPassword;
    } catch (e) {
        // Ignore if not inside provider
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await login(email, password);
            if (onSuccess) {
                onSuccess();
            }
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
        <>
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
                        autoFocus={!isModal}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Password</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            className="form-input glass-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ paddingRight: '2.5rem' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '0.75rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                padding: '0',
                                display: 'flex',
                                alignItems: 'center'
                            }}
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
                    {isModal && openForgotPassword ? (
                        <button
                            type="button"
                            onClick={openForgotPassword}
                            className="link"
                            style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}
                        >
                            Forgot password?
                        </button>
                    ) : (
                        <Link to="/forgot-password" className="link" onClick={onSuccess}>
                            Forgot password?
                        </Link>
                    )}
                </div>

                <button
                    type="submit"
                    className="btn btn-primary btn-lg w-full"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin mr-2" size={18} />
                            Signing in...
                        </>
                    ) : (
                        'Sign In'
                    )}
                </button>
            </form>

            <div className="auth-footer">
                <p>
                    Don't have an account?{' '}
                    {isModal && openRegister ? (
                        <button
                            onClick={openRegister}
                            className="link"
                            style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}
                        >
                            Create one
                        </button>
                    ) : (
                        <Link to="/register" className="link">
                            Create one
                        </Link>
                    )}
                </p>
            </div>
        </>
    );
}
