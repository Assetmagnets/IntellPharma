import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import SEO from '../components/SEO';
import {
    Pill,
    AlertTriangle,
    Loader2,
    Mail,
    KeyRound,
    Lock,
    CheckCircle2,
    ArrowLeft,
    Eye,
    EyeOff
} from 'lucide-react';
import '../styles/auth.css';


export default function ForgotPassword() {
    const navigate = useNavigate();

    // Step: 1 = email input, 2 = OTP verification, 3 = reset password, 4 = success
    const [step, setStep] = useState(1);

    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendMessage, setResendMessage] = useState('');

    // Step 1: Request OTP
    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await authAPI.requestPasswordReset(email);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await authAPI.verifyResetOTP(email, otp);
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            await authAPI.resetPassword(email, otp, newPassword);
            setStep(4);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResendOTP = async () => {
        setError('');
        setResendMessage('');
        setLoading(true);

        try {
            await authAPI.requestPasswordReset(email);
            setResendMessage('OTP sent successfully!');
            setTimeout(() => setResendMessage(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to resend OTP.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page gradient-mesh">
            <SEO
                title="Forgot Password - Reset Your IntellPharma Account"
                description="Reset your IntellPharma password. Recover access to your pharmacy management account with email OTP verification."
                keywords="intellpharma forgot password, reset pharmacy password, intellpharma password recovery"
                canonicalUrl="/forgot-password"
            />
            <div className="auth-container animate-slideUp">
                <div className="auth-header">
                    <div className="auth-logo">
                        <img src="/logo.png" alt="IntellPharma" className="auth-logo-img" />
                        <span className="logo-text">IntellPharma</span>
                    </div>
                    <h1>
                        {step === 1 && 'Forgot Password'}
                        {step === 2 && 'Verify OTP'}
                        {step === 3 && 'Reset Password'}
                        {step === 4 && 'Success!'}
                    </h1>
                    <p>
                        {step === 1 && 'Enter your registered email address'}
                        {step === 2 && 'Enter the OTP sent to your email'}
                        {step === 3 && 'Create a new password'}
                        {step === 4 && 'Your password has been reset'}
                    </p>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <AlertTriangle size={18} />
                        {error}
                    </div>
                )}

                {resendMessage && (
                    <div className="alert alert-success">
                        <CheckCircle2 size={18} />
                        {resendMessage}
                    </div>
                )}

                {/* Step 1: Email Input */}
                {step === 1 && (
                    <form onSubmit={handleRequestOTP} className="auth-form">
                        <div className="form-group">
                            <label className="form-label">
                                <Mail size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
                                Registered Email Address
                            </label>
                            <input
                                type="email"
                                className="form-input glass-input"
                                placeholder="you@pharmacy.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                            <span className="form-hint">
                                We'll send a 6-digit OTP to this email
                            </span>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg w-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin mr-2" size={18} />
                                    Sending OTP...
                                </>
                            ) : (
                                'Send OTP'
                            )}
                        </button>
                    </form>
                )}

                {/* Step 2: OTP Verification */}
                {step === 2 && (
                    <form onSubmit={handleVerifyOTP} className="auth-form">
                        <div className="form-group">
                            <label className="form-label">
                                <KeyRound size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
                                Enter OTP
                            </label>
                            <input
                                type="text"
                                className="form-input glass-input"
                                placeholder="Enter 6-digit OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                autoFocus
                                maxLength={6}
                                style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.25rem' }}
                            />
                            <span className="form-hint">
                                OTP sent to {email}
                            </span>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg w-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin mr-2" size={18} />
                                    Verifying...
                                </>
                            ) : (
                                'Verify OTP'
                            )}
                        </button>

                        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-md)' }}>
                            <button
                                type="button"
                                className="link"
                                onClick={handleResendOTP}
                                disabled={loading}
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                Didn't receive OTP? Resend
                            </button>
                        </div>
                    </form>
                )}

                {/* Step 3: New Password */}
                {step === 3 && (
                    <form onSubmit={handleResetPassword} className="auth-form">
                        <div className="form-group">
                            <label className="form-label">
                                <Lock size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
                                New Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="form-input glass-input"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    autoFocus
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
                            <span className="form-hint">Minimum 6 characters</span>
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <Lock size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
                                Confirm Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    className="form-input glass-input"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    style={{ paddingRight: '2.5rem' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg w-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin mr-2" size={18} />
                                    Resetting Password...
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </button>
                    </form>
                )}

                {/* Step 4: Success */}
                {step === 4 && (
                    <div className="auth-form" style={{ textAlign: 'center' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '2px solid rgba(16, 185, 129, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto var(--spacing-lg)'
                        }}>
                            <CheckCircle2 size={40} color="#10b981" />
                        </div>
                        <p style={{ color: 'var(--dark-text-secondary)', marginBottom: 'var(--spacing-xl)' }}>
                            Your password has been successfully reset. You can now login with your new password.
                        </p>
                        <button
                            className="btn btn-primary btn-lg w-full"
                            onClick={() => navigate('/login')}
                        >
                            Go to Login
                        </button>
                    </div>
                )}

                {step !== 4 && (
                    <div className="auth-footer">
                        <p>
                            <Link to="/login" className="link">
                                <ArrowLeft size={14} style={{ marginRight: '0.25rem', display: 'inline' }} />
                                Back to Login
                            </Link>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
