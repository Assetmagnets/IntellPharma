import { useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import { useAuthModal as useAuthModalContext } from '../../context/AuthModalContext';

export default function AuthModal() {
    const { modalType, closeModal } = useAuthModalContext();

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') closeModal();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [closeModal]);

    if (!modalType) return null;

    return (
        <div
            className="modal-overlay"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                opacity: 1,
                transition: 'all 0.3s ease'
            }}
            onClick={closeModal}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: modalType === 'login' ? '450px' : '520px',
                    position: 'relative',
                    borderRadius: '24px',
                }}
                onClick={e => e.stopPropagation()}
                className="animate-scaleIn auth-container"
            >
                {/* Close Button */}
                <button
                    onClick={closeModal}
                    className="modal-close-btn"
                    style={{
                        position: 'absolute',
                        right: '1.5rem',
                        top: '1.5rem',
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 10,
                        transition: 'all 0.3s ease'
                    }}
                >
                    <X size={24} />
                </button>

                <div
                    className={modalType === 'register' ? "modal-scroll-content" : "no-scrollbar"}
                    style={{ margin: 0, height: 'auto', maxHeight: '85vh', overflowY: 'auto', width: '100%', padding: '2.5rem 0' }}
                >
                    {(modalType === 'login' || modalType === 'register') && (
                        <div className="auth-header">
                            <div className="auth-logo">
                                <img src="/logo.png" alt="IntellPharma" className="auth-logo-img" />
                                <span className="logo-text">IntellPharma</span>
                            </div>
                            <h1>{modalType === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
                            <p>{modalType === 'login' ? 'Sign in to manage your pharmacy' : 'Start managing your pharmacy today'}</p>
                        </div>
                    )}

                    <div style={{ padding: modalType === 'forgot-password' ? '0' : '0 2.5rem 2.5rem' }}>
                        {modalType === 'login' ? (
                            <LoginForm onSuccess={closeModal} isModal={true} />
                        ) : modalType === 'register' ? (
                            <RegisterForm onSuccess={closeModal} isModal={true} />
                        ) : (
                            <ForgotPasswordForm />
                        )}
                    </div>

                    {modalType === 'register' && (
                        <div className="plan-info glass-panel" style={{ margin: '0 2rem 2rem' }}>
                            <h4>
                                <Sparkles size={16} /> Start Free
                            </h4>
                            <p>Your account includes the Basic plan (1 branch free). Upgrade anytime.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
