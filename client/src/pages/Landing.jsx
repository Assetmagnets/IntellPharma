import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Pill,
    Sparkles,
    Rocket,
    ArrowRight,
    Receipt,
    Package,
    Store,
    BarChart3,
    Users,
    IndianRupee
} from 'lucide-react';
import '../styles/landing.css';

export default function Landing() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="landing-page">
            {/* Background */}
            <div className="landing-bg">
                <div className="bg-gradient"></div>
                <div className="bg-pattern"></div>
            </div>

            {/* Navbar */}
            <nav className="landing-nav">
                <div className="nav-brand">
                    <img src="/logo.png" alt="PharmaStock" className="brand-logo" />
                    <span className="brand-text">PharmaStock</span>
                </div>
                <div className="nav-links">
                    {isAuthenticated ? (
                        <Link to="/dashboard" className="btn btn-primary">
                            Go to Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-ghost">
                                Login
                            </Link>
                            <Link to="/register" className="btn btn-primary">
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-badge">
                        <Sparkles size={16} /> AI-Powered Pharmacy Management
                    </div>
                    <h1 className="hero-title">
                        Transform Your
                        <span className="gradient-text"> Pharmacy Business</span>
                    </h1>
                    <p className="hero-description">
                        PharmaStock is the complete multi-branch pharmacy governance and sales system.
                        Manage inventory, billing, GST compliance, and get AI-driven insights - all in one platform.
                    </p>
                    <div className="hero-actions">
                        <Link to="/register" className="btn btn-primary btn-lg hover:text-white">
                            <Rocket size={20} /> Get Started Free
                        </Link>
                        <Link to="/login" className="btn btn-secondary btn-lg btn-ghost">
                            Sign In <ArrowRight size={20} />
                        </Link>
                    </div>
                    <div className="hero-stats">
                        <div className="stat">
                            <span className="stat-value">10+</span>
                            <span className="stat-label">Features</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">99.9%</span>
                            <span className="stat-label">Uptime</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">24/7</span>
                            <span className="stat-label">Support</span>
                        </div>
                    </div>
                </div>

                <div className="hero-visual">
                    <div className="dashboard-preview">
                        <div className="preview-header">
                            <div className="preview-dots">
                                <span></span><span></span><span></span>
                            </div>
                            <span className="preview-title">Dashboard</span>
                        </div>
                        <div className="preview-content">
                            <div className="preview-card">
                                <span className="preview-icon"><IndianRupee size={24} /></span>
                                <div>
                                    <h4>₹45,230</h4>
                                    <p>Today's Sales</p>
                                </div>
                            </div>
                            <div className="preview-card">
                                <span className="preview-icon"><Package size={24} /></span>
                                <div>
                                    <h4>1,234</h4>
                                    <p>Products</p>
                                </div>
                            </div>
                            <div className="preview-card">
                                <span className="preview-icon"><Receipt size={24} /></span>
                                <div>
                                    <h4>89</h4>
                                    <p>Invoices</p>
                                </div>
                            </div>
                            <div className="preview-card ai-card">
                                <span className="preview-icon"><Sparkles size={24} /></span>
                                <div>
                                    <h4>AI Insights</h4>
                                    <p>"Stock Paracetamol - demand rising"</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <h2 className="section-title">Everything You Need</h2>
                <p className="section-subtitle">Powerful tools designed specifically for modern pharmacies</p>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Receipt size={32} />
                        </div>
                        <h3>Smart Billing</h3>
                        <p>Barcode scanning, GST calculation, and instant invoice generation</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Package size={32} />
                        </div>
                        <h3>Inventory Control</h3>
                        <p>Track stock, expiry dates, and get low-stock alerts automatically</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Store size={32} />
                        </div>
                        <h3>Multi-Branch</h3>
                        <p>Manage all your pharmacy locations from a single dashboard</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Sparkles size={32} />
                        </div>
                        <h3>AI Analytics</h3>
                        <p>Get intelligent insights and predictions for better decisions</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <BarChart3 size={32} />
                        </div>
                        <h3>GST Reports</h3>
                        <p>Auto-generate GSTR-1, GSTR-3B and compliance reports</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Users size={32} />
                        </div>
                        <h3>Team Management</h3>
                        <p>Role-based access control for your entire staff</p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-content">
                    <h2>Ready to Get Started?</h2>
                    <p>Join thousands of pharmacies already using PharmaStock</p>
                    <Link to="/register" className="btn btn-primary btn-lg">
                        Start Your Free Trial
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <img src="/logo.png" alt="PharmaStock" className="footer-logo" />
                        <span>PharmaStock</span>
                    </div>
                    <p>© {new Date().getFullYear()} PharmaStock. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
