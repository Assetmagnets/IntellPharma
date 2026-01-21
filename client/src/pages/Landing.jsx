import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import {
    Sparkles,
    Rocket,
    ArrowRight,
    Package,
    Store,
    BarChart3,
    Users,
    IndianRupee,
    ReceiptIndianRupeeIcon,
    ReceiptText
} from 'lucide-react';
import '../styles/landing.css';

export default function Landing() {
    return (
        <div className="landing-page">
            <SEO />
            <div className="landing-bg">
                <div className="bg-gradient"></div>
                <div className="bg-pattern"></div>
            </div>

            <PublicNavbar />

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-badge">
                        <Sparkles size={16} /> #1 Pharmacy Software In India
                    </div>
                    <h1 className="hero-title">
                        Smart Inventory &
                        <span className="gradient-text"> Billing Software</span>
                    </h1>
                    <p className="hero-description">
                        IntellPharma helps you manage your pharmacy inventory, generate GST bills, and track expiry dates—all in one place. Designed for speed, security, and simplicity.
                    </p>
                    <div className="hero-actions">
                        <Link to="/register" className="btn btn-primary btn-lg">
                            Start Free Trial
                        </Link>
                        <Link to="/pricing" className="btn btn-secondary btn-lg">
                            See Pricing
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
                                <span className="preview-icon"><ReceiptIndianRupeeIcon size={24} /></span>
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
            <section id="features" className="features-section">
                <h2 className="section-title">Everything You Need</h2>
                <p className="section-subtitle">Powerful tools designed specifically for modern pharmacies, utilizing data-driven healthcare logistics.</p>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <ReceiptText size={32} />
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
                    <p>Join thousands of pharmacies already using IntellPharma</p>
                    <Link to="/register" className="btn btn-primary btn-lg">
                        Start Your Free Trial
                    </Link>
                </div>
            </section>

            <PublicFooter />
        </div>
    );
}
