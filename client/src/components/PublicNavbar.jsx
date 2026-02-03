import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import '../styles/landing.css';

export default function PublicNavbar() {
    const { isAuthenticated } = useAuth();
    const { openLogin, openRegister } = useAuthModal();
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    return (
        <nav className="landing-nav">
            <div className="nav-brand">
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
                    <img src="/logo.png" alt="IntellPharma" className="brand-logo" />
                    <span className="brand-text">IntellPharma</span>
                </Link>
            </div>



            <div
                className={`nav-links ${isOpen ? 'open' : ''}`}
                style={{
                    justifyContent: 'center',
                    flex: 1,
                    gap: '3rem'
                }}
            >
                <Link
                    to="/about"
                    className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}
                    onClick={() => setIsOpen(false)}
                >
                    About
                </Link>
                <Link
                    to="/pricing"
                    className={`nav-link ${location.pathname === '/pricing' ? 'active' : ''}`}
                    onClick={() => setIsOpen(false)}
                >
                    Pricing
                </Link>
                <Link
                    to="/blog"
                    className={`nav-link ${location.pathname.startsWith('/blog') ? 'active' : ''}`}
                    onClick={() => setIsOpen(false)}
                >
                    Blog
                </Link>

                {/* Mobile Menu Actions */}
                <div className="mobile-nav-actions">
                    {isAuthenticated ? (
                        <Link
                            to="/dashboard"
                            className="nav-link"
                            onClick={() => setIsOpen(false)}
                        >
                            Dashboard
                        </Link>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    openLogin();
                                    setIsOpen(false);
                                }}
                                className="nav-link"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
                            >
                                Login
                            </button>
                            <button
                                onClick={() => {
                                    openRegister();
                                    setIsOpen(false);
                                }}
                                className="nav-link"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
                            >
                                Get Started
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="nav-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {isAuthenticated ? (
                    <Link to="/dashboard" className="btn btn-primary">
                        Go to Dashboard
                    </Link>
                ) : (
                    <>
                        <button onClick={openLogin} className="btn btn-ghost">
                            Login
                        </button>
                        <button onClick={openRegister} className="btn btn-primary">
                            Get Started
                        </button>
                    </>
                )}
            </div>

            {/* Mobile Menu Button */}
            <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <X /> : <Menu />}
            </button>
        </nav>
    );
}
