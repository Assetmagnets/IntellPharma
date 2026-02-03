import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { useAuthModal } from '../context/AuthModalContext';
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
    const { openRegister } = useAuthModal();

    return (
        <div className="landing-page">
            <SEO
                title="Best Smart Pharmacy Management System in India | IntellPharma"
                description="IntellPharma is the #1 smart pharmacy management system in India. AI-driven inventory, GST billing, and expiry tracking for modern medical shops."
                keywords="Smart Pharmacy Management System, Medical Store Software India, IntellPharma, Pharmacy Billing Software, Inventory Governance, Best Pharmacy Software"
                canonicalUrl="/"
            />
            <div className="landing-bg">
                <div className="bg-gradient"></div>
                <div className="bg-pattern"></div>
            </div>

            <PublicNavbar />

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-badge">
                        <Sparkles size={16} /> #1 Smart Pharmacy Software In India
                    </div>
                    <h1 className="hero-title">
                        India's Best Cloud-Based
                        <span className="gradient-text"> Pharmacy Management System</span>
                    </h1>
                    <p className="hero-description">
                        IntellPharma is the leading <strong>Smart Pharmacy Management System</strong> & Medical Store Software. Automate inventory, GST billing, and expiry tracking with our AI-powered digital solution.
                    </p>
                    <div className="hero-actions">
                        <button onClick={openRegister} className="btn btn-primary btn-lg">
                            Start Free Trial
                        </button>
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
                <h2 className="section-title">Digital Solutions for Modern Retail</h2>
                <p className="section-subtitle">Upgrade your medical shop with our cloud-based tools. From smart billing to AI analytics, we have everything a modern pharmacy needs.</p>
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

            {/* SEO Content Section - "Why Choose Us" */}
            <section className="features-section" style={{ background: 'var(--surface-color)', paddingBottom: '4rem' }}>
                <h2 className="section-title">Why Choose IntellPharma?</h2>
                <p className="section-subtitle">The preferred choice for thousands of medical stores across India.</p>

                <div className="features-grid" style={{ marginTop: '3rem' }}>
                    <div style={{ padding: '2rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>GST Compliant Billing</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Generate 100% accurate GST invoices. Our <strong>medical store billing software</strong> allows you to file GSTR-1 and GSTR-3B reports effortlessly.
                        </p>
                    </div>
                    <div style={{ padding: '2rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Expiry Date Tracking</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Stop losing money on expired medicines. Our <strong>inventory management system</strong> alerts you about near-expiry drugs so you can return or sell them on time.
                        </p>
                    </div>
                    <div style={{ padding: '2rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Cloud-Based & Secure</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Access your shop data from anywhere. IntellPharma is the best <strong>cloud-based pharmacy software in India</strong>, offering bank-grade security and daily backups.
                        </p>
                    </div>
                    <div style={{ padding: '2rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Affordable for Small Shops</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Designed for everyone. Whether you strictly need <strong>billing software for a small medical shop</strong> or a multi-chain ERP, we have plans that fit your budget.
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-content">
                    <h2>Ready to Get Started?</h2>
                    <p>Join thousands of pharmacies already using IntellPharma</p>
                    <button onClick={openRegister} className="btn btn-primary btn-lg">
                        Start Your Free Trial
                    </button>
                </div>
            </section>

            <PublicFooter />
        </div>
    );
}
