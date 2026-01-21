import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import {
    Check,
    Zap,
    Crown,
    Building2,
    ArrowRight,
    ShieldCheck,
    HelpCircle,
    Star,
    BarChart3,
    CheckCircle2,
    Users
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

export default function Pricing() {
    return (
        <div className="pricing-page" style={{ overflowX: 'hidden' }}>
            <SEO
                title="Pricing Plans"
                description="Flexible pricing plans for pharmacies of all sizes. Start for free with our Basic plan or upgrade for advanced AI features."
                canonicalUrl="/pricing"
            />

            {/* 1. Hero Section (Matching About.jsx style but CENTERED) */}
            <section style={{
                padding: '2rem 6% 4rem',
                textAlign: 'center',
                minHeight: '60vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
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
                    <Star size={14} fill="currentColor" /> Simple, Transparent Pricing
                </div>
                <h1 style={{
                    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                    fontWeight: '800',
                    lineHeight: '1.1',
                    marginBottom: '1.5rem',
                    color: '#f8fafc'
                }}>
                    Choose the plan that fits <br />
                    <span className="gradient-text">your pharmacy's growth</span>
                </h1>
                <p style={{
                    fontSize: '1.25rem',
                    color: '#94a3b8',
                    maxWidth: '600px',
                    margin: '0 auto 3rem',
                    lineHeight: '1.6'
                }}>
                    No hidden fees. No credit card required for trial. Cancel anytime.
                </p>
            </section>

            {/* 2. Pricing Grid (4 Columns) */}
            <section style={{ padding: '2rem 6% 6rem', maxWidth: '1440px', margin: '0 auto' }}>
                <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginTop: '2rem', alignItems: 'stretch' }}>

                    {/* Basic Plan */}
                    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', borderTop: '4px solid var(--success)', padding: '2rem', borderRadius: '16px', minHeight: '480px' }}>
                        <div style={{ color: 'var(--success)', marginBottom: '1rem' }}>
                            <Zap size={40} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--dark-text)' }}>Basic</h3>
                        <p style={{ color: 'var(--dark-text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>Essential features to getting started</p>

                        <div style={{ marginBottom: '2rem' }}>
                            <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--dark-text)' }}>Free</span>
                        </div>

                        <ul style={{ flex: 1, marginBottom: '2rem', listStyle: 'none', padding: 0 }}>
                            <li style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', color: 'var(--dark-text-secondary)' }}><Check size={18} color="var(--success)" /> Single branch</li>
                            <li style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', color: 'var(--dark-text-secondary)' }}><Check size={18} color="var(--success)" /> Basic billing</li>
                            <li style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', color: 'var(--dark-text-secondary)' }}><Check size={18} color="var(--success)" /> Inventory management</li>
                        </ul>

                        <Link to="/register?plan=BASIC" className="btn btn-success" style={{
                            justifyContent: 'center',
                            padding: '1rem',
                            marginTop: 'auto',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: '600',
                            textDecoration: 'none',
                            display: 'flex',
                            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                        }}>
                            Get Started
                        </Link>
                    </div>

                    {/* Pro Plan */}
                    <div className="glass-panel featured" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        zIndex: 10,
                        border: '2px solid #0066e6',
                        background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
                        padding: '2rem',
                        paddingTop: '2.5rem',
                        position: 'relative',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        overflow: 'visible',
                        borderRadius: '16px',
                        minHeight: '480px'
                    }}>
                        <div style={{
                            position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)',
                            background: 'linear-gradient(90deg, #0066e6, #00e6ac)', color: 'white', padding: '0.5rem 1.5rem',
                            borderRadius: '100px', fontSize: '0.85rem', fontWeight: '700', letterSpacing: '0.5px',
                            boxShadow: '0 4px 15px rgba(0, 102, 230, 0.4)',
                            zIndex: 20,
                            whiteSpace: 'nowrap'
                        }}>MOST POPULAR</div>

                        <div style={{ color: '#4da6ff', marginBottom: '1rem' }}>
                            <Crown size={44} />
                        </div>
                        <h3 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: '#f8fafc', fontWeight: '700' }}>Pro</h3>
                        <p style={{ color: '#94a3b8', marginBottom: '2rem', fontSize: '1rem' }}>For growing businesses</p>

                        <div style={{ marginBottom: '2rem' }}>
                            <span style={{ fontSize: '3.5rem', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.03em' }}>₹999</span>
                            <span style={{ fontSize: '1.1rem', color: '#94a3b8' }}>/month</span>
                        </div>

                        <ul style={{ flex: 1, marginBottom: '2rem', listStyle: 'none', padding: 0 }}>
                            <li style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', color: '#e2e8f0', fontSize: '1.05rem', fontWeight: '500' }}><Check size={20} color="#00e6ac" /> Up to 3 branches</li>
                            <li style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', color: '#e2e8f0', fontSize: '1.05rem', fontWeight: '500' }}><Check size={20} color="#00e6ac" /> AI insights</li>
                            <li style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', color: '#e2e8f0', fontSize: '1.05rem', fontWeight: '500' }}><Check size={20} color="#00e6ac" /> Advanced analytics</li>
                            <li style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', color: '#e2e8f0', fontSize: '1.05rem', fontWeight: '500' }}><Check size={20} color="#00e6ac" /> GST reports</li>
                        </ul>

                        <Link to="/register?plan=PRO" className="btn btn-primary" style={{
                            justifyContent: 'center', padding: '1rem', marginTop: 'auto', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #0066e6 0%, #0047ab 100%)',
                            color: 'white', textDecoration: 'none', display: 'flex', fontWeight: '600',
                            boxShadow: '0 8px 20px rgba(0, 102, 230, 0.3)'
                        }}>
                            Start Free Trial
                        </Link>
                    </div>

                    {/* Premium Plan */}
                    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '2rem', borderTop: '4px solid #F59E0B', borderRadius: '16px', minHeight: '480px' }}>
                        <div style={{ color: '#F59E0B', marginBottom: '1rem' }}>
                            <Crown size={40} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--dark-text)' }}>Premium</h3>
                        <p style={{ color: 'var(--dark-text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>For large scale operations</p>

                        <div style={{ marginBottom: '2rem' }}>
                            <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--dark-text)' }}>₹1,999</span>
                            <span style={{ fontSize: '1rem', color: 'var(--dark-text-secondary)' }}>/month</span>
                        </div>

                        <ul style={{ flex: 1, marginBottom: '2rem', listStyle: 'none', padding: 0 }}>
                            <li style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', color: 'var(--dark-text-secondary)' }}><Check size={18} color="#F59E0B" /> Up to 10 branches</li>
                            <li style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', color: 'var(--dark-text-secondary)' }}><Check size={18} color="#F59E0B" /> Full AI suite</li>
                            <li style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', color: 'var(--dark-text-secondary)' }}><Check size={18} color="#F59E0B" /> Custom reports</li>
                            <li style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', color: 'var(--dark-text-secondary)' }}><Check size={18} color="#F59E0B" /> Priority support</li>
                            <li style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', color: 'var(--dark-text-secondary)' }}><Check size={18} color="#F59E0B" /> API access</li>
                        </ul>

                        <Link to="/register?plan=PREMIUM" className="btn btn-primary" style={{
                            justifyContent: 'center', padding: '1rem', marginTop: 'auto', borderRadius: '8px',
                            background: 'linear-gradient(135deg, #F59E0B 0%, #d97706 100%)', color: 'white', textDecoration: 'none', display: 'flex', fontWeight: '600'
                        }}>
                            Upgrade to Premium
                        </Link>
                    </div>

                    {/* Enterprise Plan */}
                    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '2rem', borderRadius: '16px', minHeight: '480px' }}>
                        <div style={{ color: 'var(--dark-text)', marginBottom: '1rem' }}>
                            <Building2 size={40} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--dark-text)' }}>Enterprise</h3>
                        <p style={{ color: 'var(--dark-text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>For custom requirements</p>

                        <div style={{ marginBottom: '2rem' }}>
                            <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--dark-text)' }}>Custom</span>
                        </div>

                        <ul style={{ flex: 1, marginBottom: '2rem', listStyle: 'none', padding: 0 }}>
                            <li style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', color: 'var(--dark-text-secondary)' }}><Check size={18} color="var(--primary-500)" /> Unlimited branches</li>
                            <li style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', color: 'var(--dark-text-secondary)' }}><Check size={18} color="var(--primary-500)" /> Dedicated support</li>
                            <li style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', color: 'var(--dark-text-secondary)' }}><Check size={18} color="var(--primary-500)" /> Custom integrations</li>
                            <li style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', color: 'var(--dark-text-secondary)' }}><Check size={18} color="var(--primary-500)" /> SLA guarantee</li>
                        </ul>

                        <Link to="/contact" className="btn" style={{
                            justifyContent: 'center', padding: '1rem', marginTop: 'auto', borderRadius: '8px',
                            background: 'rgba(255,255,255,0.05)', color: 'var(--dark-text)', border: '1px solid var(--dark-border)', textDecoration: 'none', display: 'flex', fontWeight: '600'
                        }}>
                            Contact Sales
                        </Link>
                    </div>
                </div>
            </section>

            {/* 3. Key Feature Section - Maximize ROI */}
            <section style={{
                padding: '6rem 6%',
                maxWidth: '1440px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '5rem',
                alignItems: 'center',
                background: 'linear-gradient(135deg, rgba(0,102,230,0.05) 0%, transparent 50%)',
                borderRadius: '32px'
            }}>
                <div>
                    <div style={{
                        width: '70px',
                        height: '70px',
                        background: 'linear-gradient(135deg, #0066e6 0%, #00e6ac 100%)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        marginBottom: '1.5rem',
                        boxShadow: '0 10px 30px rgba(0, 102, 230, 0.3)'
                    }}>
                        <BarChart3 size={36} />
                    </div>
                    <h2 style={{ fontSize: '2.75rem', fontWeight: '800', marginBottom: '1rem', color: '#f8fafc', letterSpacing: '-0.02em' }}>
                        Maximize Your ROI
                    </h2>
                    <p style={{ fontSize: '1.2rem', color: '#94a3b8', lineHeight: '1.7', marginBottom: '2rem' }}>
                        Don't just spend on software; invest in growth. Our AI-driven insights help you identify high-margin products and reduce expiry wastage.
                    </p>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {[
                            'Reduce expiry loss by 80%',
                            'Increase inventory turnover',
                            'Automated re-ordering suggestions',
                            'Best-performing product analytics'
                        ].map((item, i) => (
                            <li key={i} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                marginBottom: '1.25rem',
                                color: '#e2e8f0',
                                fontSize: '1.15rem',
                                fontWeight: '500'
                            }}>
                                <div style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    background: 'rgba(0, 230, 172, 0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <CheckCircle2 size={18} color="#00e6ac" />
                                </div>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
                <div style={{
                    background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
                    borderRadius: '24px',
                    aspectRatio: '4/3',
                    border: '1px solid rgba(255,255,255,0.1)',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}>
                    {/* Decorative background elements */}
                    <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(0,102,230,0.3), transparent 70%)', filter: 'blur(40px)' }}></div>
                    <div style={{ position: 'absolute', bottom: '-30px', left: '-30px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(0,230,172,0.2), transparent 70%)', filter: 'blur(40px)' }}></div>

                    {/* Content */}
                    <div style={{ position: 'absolute', inset: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                        <div style={{
                            fontSize: '5rem',
                            fontWeight: '800',
                            background: 'linear-gradient(135deg, #0066e6 0%, #00e6ac 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            marginBottom: '0.5rem'
                        }}>30%</div>
                        <div style={{ color: '#94a3b8', fontSize: '1.25rem', fontWeight: '500' }}>Increase in Profits</div>
                        <div style={{
                            marginTop: '2rem',
                            padding: '0.75rem 1.5rem',
                            background: 'rgba(0, 230, 172, 0.1)',
                            border: '1px solid rgba(0, 230, 172, 0.3)',
                            borderRadius: '100px',
                            color: '#00e6ac',
                            fontSize: '0.9rem',
                            fontWeight: '600'
                        }}>
                            ↑ Average across 5,000+ pharmacies
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. FAQ Section */}
            <section style={{
                padding: '6rem 6%',
                maxWidth: '1440px',
                margin: '0 auto'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'rgba(0, 102, 230, 0.1)',
                        color: '#4da6ff',
                        borderRadius: '100px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        marginBottom: '1.5rem'
                    }}>
                        <HelpCircle size={16} /> FAQ
                    </div>
                    <h2 style={{
                        fontSize: '2.75rem',
                        fontWeight: '800',
                        marginBottom: '1rem',
                        color: '#f8fafc',
                        letterSpacing: '-0.02em'
                    }}>Frequently Asked Questions</h2>
                    <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>Everything you need to know about our plans and billing</p>
                </div>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <FAQItem
                        question="Can I upgrades plan later?"
                        answer="Yes, you can upgrade your plan at any time. The billing will be adjusted on a pro-rata basis, meaning you only pay for the difference in price for the remaining days of your billing cycle."
                    />
                    <FAQItem
                        question="Is there a setup fee?"
                        answer="No, there are absolutely no setup fees or hidden charges. You just pay the subscription fee for the plan you choose."
                    />
                    <FAQItem
                        question="Do you offer enterprise discounts?"
                        answer="Yes, for pharmacy chains with more than 10 branches, we offer customized enterprise pricing. Please contact our sales team for a quote."
                    />
                    <FAQItem
                        question="Is my data safe?"
                        answer="Absolutely. We use bank-grade 256-bit encryption to secure all your data. We also perform automatic daily backups to ensure you never lose your business information."
                    />
                </div>
            </section>

            {/* 5. CTA Section */}
            <section style={{ padding: '8rem 6%', textAlign: 'center' }}>
                <div style={{
                    maxWidth: '1000px',
                    margin: '0 auto',
                    background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))',
                    borderRadius: '32px',
                    padding: '4rem 2rem',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1), transparent)', pointerEvents: 'none' }}></div>
                    <h2 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1.5rem', color: 'white' }}>
                        Start Your Free Trial Today
                    </h2>
                    <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.9)', marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
                        Join 5,000+ pharmacies growing with IntellPharma. No credit card required.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/register" style={{
                            padding: '1rem 2.5rem',
                            background: 'white',
                            color: 'var(--primary-600)',
                            borderRadius: '100px',
                            fontWeight: '700',
                            fontSize: '1.125rem',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            Get Started Now <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
