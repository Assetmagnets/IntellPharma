import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { useAuthModal } from '../context/AuthModalContext';
import {
    CheckCircle2,
    ArrowRight,
    ShieldCheck,
    Zap,
    BarChart3,
    ChevronDown,
    ChevronUp,
    Star,
    Activity,
    HeartPulse,
    Stethoscope,
    Pill,
    Cross,
    Truck
} from 'lucide-react';
import { useState } from 'react';
import '../styles/landing.css';

// FAQ Component - Enhanced
const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div style={{
            marginBottom: '1rem',
            background: isOpen ? 'rgba(0, 102, 230, 0.05)' : 'rgba(255,255,255,0.02)',
            borderRadius: '16px',
            border: isOpen ? '1px solid rgba(0, 102, 230, 0.2)' : '1px solid rgba(255,255,255,0.05)',
            overflow: 'hidden',
            transition: 'all 0.3s ease'
        }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.5rem 2rem',
                    background: 'none',
                    border: 'none',
                    color: '#f8fafc',
                    fontSize: '1.15rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left'
                }}
            >
                {question}
                <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isOpen ? 'linear-gradient(135deg, #0066e6, #00e6ac)' : 'rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isOpen ? 'white' : '#94a3b8',
                    fontSize: '1.25rem',
                    fontWeight: '400',
                    transition: 'all 0.3s ease',
                    flexShrink: 0
                }}>
                    {isOpen ? '−' : '+'}
                </div>
            </button>
            {isOpen && (
                <div style={{
                    padding: '0 2rem 1.5rem 2rem',
                    color: '#94a3b8',
                    lineHeight: '1.7',
                    fontSize: '1.05rem'
                }}>
                    {answer}
                </div>
            )}
        </div>
    );
};

export default function About() {
    const { openRegister } = useAuthModal();

    return (
        <div className="about-page" style={{ overflowX: 'hidden' }}>
            <SEO
                title="About Us - AI Powered Pharmacy Solution"
                description="Learn how IntellPharma is revolutionizing pharmacy management with AI-driven inventory control, billing, and analytics. Trusted by 5000+ pharmacies."
                keywords="about intellpharma, pharmacy software company, medical shop billing software, smart pharmacy solutions"
                canonicalUrl="/about"
            />

            {/* 1. Hero Section */}
            <section style={{
                padding: '3rem 6% 4rem',
                maxWidth: '1440px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '4rem',
                alignItems: 'start'
            }}>
                <div style={{ maxWidth: '600px' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'rgba(0, 102, 230, 0.1)',
                        color: 'var(--primary-500)',
                        borderRadius: '100px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        marginBottom: '1.5rem'
                    }}>
                        <Star size={14} fill="currentColor" /> #1 Pharmacy Software in India
                    </div>
                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                        fontWeight: '800',
                        lineHeight: '1.1',
                        marginBottom: '1.5rem',
                        color: '#f8fafc'
                    }}>
                        Smart Inventory & <br />
                        <span className="gradient-text">Billing Software</span>
                    </h1>
                    <p style={{
                        fontSize: '1.25rem',
                        color: '#94a3b8',
                        marginBottom: '2.5rem',
                        lineHeight: '1.6'
                    }}>
                        IntellPharma helps you manage your pharmacy inventory, generate GST bills, and track expiry dates—all in one place.
                        Designed for speed, security, and simplicity.
                    </p>
                    <div className="hero-actions">
                        <button onClick={openRegister} className="btn btn-primary btn-lg">
                            Start Free Trial
                        </button>
                        <Link to="/pricing" className="btn btn-secondary btn-lg">
                            See Pricing
                        </Link>
                    </div>
                    <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                        <CheckCircle2 size={16} color="var(--success-500)" /> No credit card required
                        {/* <span style={{ margin: '0 0.5rem' }}>•</span> */}
                        <CheckCircle2 size={16} color="var(--success-500)" /> 1-Branch free access
                    </div>
                </div>

                {/* Hero Image */}
                <div style={{
                    position: 'relative',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                    padding: '8px',
                    aspectRatio: '16/10',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    background: 'rgba(255,255,255,0.05)'
                }}>
                    <img
                        src="/images/dashboard-preview.png"
                        alt="IntellPharma Dashboard"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }}
                    />
                </div>
            </section>

            {/* TRUST STRIP REMOVED FROM HERE */}

            {/* 3. Feature Sections (Alternating) */}

            {/* Feature 1: Inventory */}
            <section style={{ padding: '6rem 6%', maxWidth: '1440px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '5rem', alignItems: 'center' }}>
                <div>
                    <div style={{ width: '60px', height: '60px', background: 'rgba(0,102,230,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-500)', marginBottom: '1.5rem' }}>
                        <BarChart3 size={32} />
                    </div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem', color: '#f8fafc' }}>
                        Smart Inventory Management
                    </h2>
                    <p style={{ fontSize: '1.125rem', color: '#94a3b8', lineHeight: '1.7', marginBottom: '2rem' }}>
                        Stop losing money on expired medicines. IntellPharma tracks every batch and expiry date automatically.
                    </p>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {[
                            'Real-time stock tracking',
                            'Automatic low-stock alerts',
                            'Expiry warning before 60 days',
                            'Batch-wise inventory control'
                        ].map((item, i) => (
                            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', color: '#e2e8f0', fontSize: '1.125rem' }}>
                                <CheckCircle2 size={20} color="var(--primary-500)" /> {item}
                            </li>
                        ))}
                    </ul>
                </div>
                <div style={{ position: 'relative', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)' }}>
                    <img
                        src="/images/inventory-preview.png"
                        alt="Inventory Management"
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                </div>
            </section>

            {/* Feature 2: Billing (Text Right) - REVERTED TO ORIGINAL PREVIEW */}
            <section style={{ padding: '6rem 6%', maxWidth: '1440px', margin: '0 auto', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '5rem', alignItems: 'center', direction: 'rtl' }}>
                    <div style={{ direction: 'ltr' }}>
                        <div style={{ width: '60px', height: '60px', background: 'rgba(236,72,153,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899', marginBottom: '1.5rem' }}>
                            <Zap size={32} />
                        </div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem', color: '#f8fafc' }}>
                            Lightning Fast Billing
                        </h2>
                        <p style={{ fontSize: '1.125rem', color: '#94a3b8', lineHeight: '1.7', marginBottom: '2rem' }}>
                            Create GST invoices in less than 10 seconds. Scan barcodes, add customers, and print bills instantly.
                        </p>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {[
                                'Scan Barcode & Bill',
                                'GST & Non-GST Invoices',
                                'WhatsApp Bill Sharing',
                                'Thermal & A4 Printer Support'
                            ].map((item, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', color: '#e2e8f0', fontSize: '1.125rem' }}>
                                    <CheckCircle2 size={20} color="#ec4899" /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div style={{ position: 'relative', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)', direction: 'ltr' }}>
                        <img
                            src="/images/billing-preview.png"
                            alt="Visual Billing System"
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                        />
                    </div>
                </div>
            </section>

            {/* Feature 3: Security */}
            <section style={{ padding: '6rem 6%', maxWidth: '1440px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '5rem', alignItems: 'center' }}>
                <div>
                    <div style={{ width: '60px', height: '60px', background: 'rgba(34,197,94,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e', marginBottom: '1.5rem' }}>
                        <ShieldCheck size={32} />
                    </div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem', color: '#f8fafc' }}>
                        Data Security You Can Trust
                    </h2>
                    <p style={{ fontSize: '1.125rem', color: '#94a3b8', lineHeight: '1.7', marginBottom: '2rem' }}>
                        Your business data is 100% safe with us. We use bank-grade encryption and automatic cloud backups.
                    </p>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {[
                            'End-to-End Encryption',
                            'Automatic Cloud Backup',
                            'Role-based User Access',
                            'Prevent Theft & Pilferage'
                        ].map((item, i) => (
                            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', color: '#e2e8f0', fontSize: '1.125rem' }}>
                                <CheckCircle2 size={20} color="#22c55e" /> {item}
                            </li>
                        ))}
                    </ul>
                </div>
                <div style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.6))',
                    borderRadius: '24px',
                    aspectRatio: '4/3',
                    border: '1px solid rgba(255,255,255,0.05)',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(20px)'
                }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(34,197,94,0.15), transparent 70%)', filter: 'blur(50px)' }}></div>
                    <div style={{ position: 'absolute', inset: '0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            marginBottom: '2rem',
                            boxShadow: '0 0 40px rgba(34, 197, 94, 0.2)'
                        }}>
                            <ShieldCheck size={48} color="#22c55e" strokeWidth={1.5} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: '3.5rem',
                                fontWeight: '800',
                                color: '#f8fafc',
                                lineHeight: '1',
                                marginBottom: '0.5rem',
                                textShadow: '0 10px 30px rgba(0,0,0,0.5)'
                            }}>
                                256-bit
                            </div>
                            <div style={{
                                color: '#86efac',
                                fontSize: '1rem',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.3em',
                                background: 'rgba(34, 197, 94, 0.1)',
                                padding: '0.5rem 1.5rem',
                                borderRadius: '100px',
                                border: '1px solid rgba(34, 197, 94, 0.2)'
                            }}>
                                Encryption
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. FAQ Section */}
            <section style={{ padding: '6rem 6%', maxWidth: '1000px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '800', textAlign: 'center', marginBottom: '1rem', color: '#f8fafc' }}>
                    Frequently Asked Questions
                </h2>
                <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '4rem', fontSize: '1.125rem' }}>
                    Have questions? We're here to help.
                </p>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <FAQItem
                        question="Is IntellPharma suitable for retail pharmacy?"
                        answer="Yes, IntellPharma is specifically designed for retail pharmacies, medical stores, and wholesale distributors. It handles Schedule H/H1 drugs, expiry dates, and batch numbers perfectly."
                    />
                    <FAQItem
                        question="Can I use it on multiple computers?"
                        answer="Absolutely. IntellPharma is cloud-based, so you can access your data from any computer, tablet, or phone. You can manage multiple branches from a single admin account."
                    />
                    <FAQItem
                        question="Is my data safe?"
                        answer="Yes, we take security seriously. Your data is encrypted and backed up automatically on secure cloud servers. Only you have access to your business data."
                    />
                    <FAQItem
                        question="Do you provide support?"
                        answer="Yes, we offer premium support via chat, email, and phone. Our support team is available 24/7 to help you with any issues."
                    />
                </div>
            </section>

            {/* MOVED TRUST STRIP (Carousel) */}
            <div style={{
                background: 'rgba(0,0,0,0.2)',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                overflow: 'hidden'
            }}>
                <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '3rem 6%', textAlign: 'center' }}>
                    <p style={{ color: '#94a3b8', marginBottom: '0', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Trusted by 50+ Modern Pharmacies across India
                    </p>

                    <div className="logo-slider">
                        <div className="logo-slide-track">
                            {/* Slide Track 1 */}
                            {[
                                { name: 'Apollo Pharmacy', icon: <HeartPulse size={24} /> },
                                { name: 'MedPlus', icon: <Cross size={24} /> },
                                { name: 'Wellness', icon: <Activity size={24} /> },
                                { name: 'Pharmeasy', icon: <Pill size={24} /> },
                                { name: '1mg', icon: <Stethoscope size={24} /> },
                                { name: 'NetMeds', icon: <Truck size={24} /> },
                                { name: 'FrankRoss', icon: <HeartPulse size={24} /> },
                                { name: 'Apollo Pharmacy', icon: <HeartPulse size={24} /> },
                                { name: 'MedPlus', icon: <Cross size={24} /> },
                                { name: 'Wellness', icon: <Activity size={24} /> },
                                { name: 'Pharmeasy', icon: <Pill size={24} /> },
                                { name: '1mg', icon: <Stethoscope size={24} /> },
                                { name: 'NetMeds', icon: <Truck size={24} /> },
                                { name: 'FrankRoss', icon: <HeartPulse size={24} /> }
                            ].map((logo, i) => (
                                <div key={i} className="logo-item">
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'inherit'
                                    }}>
                                        {logo.icon}
                                    </div>
                                    <span>{logo.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. Footer CTA */}
            <section style={{
                padding: '6rem 6%',
                background: 'linear-gradient(135deg, rgba(0,102,230,0.1), rgba(0,230,172,0.05))',
                textAlign: 'center',
                borderTop: '1px solid rgba(255,255,255,0.1)'
            }}>
                <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '800', marginBottom: '1.5rem', color: '#f8fafc' }}>
                    Ready to grow your pharmacy?
                </h2>
                <p style={{ fontSize: '1.25rem', color: '#94a3b8', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
                    Join thousands of smart pharmacists who trust IntellPharma for their business.
                </p>
                <button onClick={openRegister} className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.25rem', borderRadius: '100px', cursor: 'pointer', border: 'none' }}>
                    Get Started for Free <ArrowRight size={20} style={{ marginLeft: '0.5rem', display: 'inline-block' }} />
                </button>
            </section>

        </div>
    );
}
