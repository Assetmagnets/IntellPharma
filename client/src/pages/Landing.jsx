import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
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
    ReceiptText,
    Check,
    UserPlus,
    PackagePlus,
    Zap
} from 'lucide-react';
import '../styles/landing.css';


import ScrollAnimationItem from '../components/ScrollAnimationItem';

export default function Landing() {
    const navigate = useNavigate();

    const handleGetStarted = () => {
        navigate('/auth?mode=register');
    };

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
                        <button onClick={handleGetStarted} className="btn btn-primary btn-lg">
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

            {/* Trust Signals Section */}
            <section className="trust-section">
                <div className="trust-badge">
                    <Sparkles size={16} />
                    Trusted by 50+ Pharmacies Across India
                </div>
                <div className="trust-logos">
                    <span style={{ color: '#94a3b8', fontWeight: '600', fontSize: '0.9rem' }}>🔒 SSL Secured</span>
                    <span style={{ color: '#94a3b8', fontWeight: '600', fontSize: '0.9rem' }}>📊 GST Compliant</span>
                    <span style={{ color: '#94a3b8', fontWeight: '600', fontSize: '0.9rem' }}>☁️ Cloud Hosted</span>
                    <span style={{ color: '#94a3b8', fontWeight: '600', fontSize: '0.9rem' }}>🛡️ Data Protected</span>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features-section">
                <h2 className="section-title" style={{ background: 'transparent', userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none' }}>Digital Solutions for Modern Retail</h2>
                <p className="section-subtitle">Upgrade your medical shop with our cloud-based tools. From smart billing to AI analytics, we have everything a modern pharmacy needs.</p>
                <div className="features-grid">
                    {[
                        {
                            icon: <ReceiptText size={32} />,
                            title: "Smart Billing",
                            description: "Barcode scanning, GST calculation, and instant invoice generation"
                        },
                        {
                            icon: <Package size={32} />,
                            title: "Inventory Control",
                            description: "Track stock, expiry dates, and get low-stock alerts automatically"
                        },
                        {
                            icon: <Store size={32} />,
                            title: "Multi-Branch",
                            description: "Manage all your pharmacy locations from a single dashboard"
                        },
                        {
                            icon: <Sparkles size={32} />,
                            title: "AI Analytics",
                            description: "Get intelligent insights and predictions for better decisions"
                        },
                        {
                            icon: <BarChart3 size={32} />,
                            title: "GST Reports",
                            description: "Auto-generate GSTR-1, GSTR-3B and compliance reports"
                        },
                        {
                            icon: <Users size={32} />,
                            title: "Team Management",
                            description: "Role-based access control for your entire staff"
                        }
                    ].map((feature, index) => (
                        <ScrollAnimationItem key={index} delay={index * 100} className="h-full">
                            <div className="feature-card h-full">
                                <div className="feature-icon">
                                    {feature.icon}
                                </div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </div>
                        </ScrollAnimationItem>
                    ))}
                </div>
            </section>

            {/* SEO Content Section - "Why Choose Us" */}
            {/* SEO Content Section - "Why Choose Us" */}
            <section className="features-section" style={{ background: 'transparent', paddingBottom: '4rem' }}>
                <h2 className="section-title" style={{ background: 'transparent', userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none' }}>Why Choose IntellPharma?</h2>
                <p className="section-subtitle">The preferred choice for thousands of medical stores across India.</p>

                <div className="features-grid" style={{ marginTop: '3rem' }}>
                    {[
                        {
                            title: "GST Compliant Billing",
                            content: <>Generate 100% accurate GST invoices. Our <strong>medical store billing software</strong> allows you to file GSTR-1 and GSTR-3B reports effortlessly.</>
                        },
                        {
                            title: "Expiry Date Tracking",
                            content: <>Stop losing money on expired medicines. Our <strong>inventory management system</strong> alerts you about near-expiry drugs so you can return or sell them on time.</>
                        },
                        {
                            title: "Cloud-Based & Secure",
                            content: <>Access your shop data from anywhere. IntellPharma is the best <strong>cloud-based pharmacy software in India</strong>, offering bank-grade security and daily backups.</>
                        },
                        {
                            title: "Affordable for Small Shops",
                            content: <>Designed for everyone. Whether you strictly need <strong>billing software for a small medical shop</strong> or a multi-chain ERP, we have plans that fit your budget.</>
                        }
                    ].map((item, index) => (
                        <ScrollAnimationItem key={index} delay={index * 100} className="h-full">
                            <div style={{ padding: '2rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', height: '100%' }}>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#ffffff', fontWeight: '700' }}>{item.title}</h3>
                                <p style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
                                    {item.content}
                                </p>
                            </div>
                        </ScrollAnimationItem>
                    ))}
                </div>
            </section>

            {/* How It Works Section */}
            <section className="how-it-works-section">
                <h2 className="section-title" style={{ background: 'transparent', userSelect: 'none' }}>How It Works</h2>
                <p className="section-subtitle">Get started in 3 simple steps</p>
                <div className="steps-container">
                    <div className="step-card">
                        <div className="step-number">1</div>
                        <h3>Sign Up Free</h3>
                        <p>Create your account in under 60 seconds. No credit card required.</p>
                    </div>
                    <div className="step-card">
                        <div className="step-number">2</div>
                        <h3>Add Your Products</h3>
                        <p>Import your inventory via Excel or add products manually with ease.</p>
                    </div>
                    <div className="step-card">
                        <div className="step-number">3</div>
                        <h3>Start Billing</h3>
                        <p>Generate GST-compliant invoices and manage your pharmacy instantly.</p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-content">

                    <h2>Ready to Transform Your Pharmacy?</h2>
                    <p>Join 50+ pharmacies already growing with IntellPharma</p>
                    <button onClick={handleGetStarted} className="btn btn-primary btn-lg">
                        <Rocket size={20} />
                        Start Your Free Trial
                    </button>
                    <div className="cta-features">
                        <div className="cta-feature">
                            <Check size={16} />
                            <span>No credit card required</span>
                        </div>
                        <div className="cta-feature">
                            <Check size={16} />
                            <span>Full access to all features</span>
                        </div>
                        <div className="cta-feature">
                            <Check size={16} />
                            <span>Cancel anytime</span>
                        </div>
                    </div>
                </div>
            </section>

            <PublicFooter />
        </div>
    );
}
