import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import { stripeAPI } from '../services/api';
import {
    Check,
    Zap,
    Crown,
    Building2,
    ArrowRight,
    HelpCircle,
    Star,
    BarChart3,
    CheckCircle2,
    ShieldCheck,
    Globe,
    Sparkles,
    Smartphone,
    Rocket
} from 'lucide-react';
import { useState } from 'react';
import '../styles/landing.css';
import '../styles/pricing.css';

// FAQ Component
const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div style={{
            marginBottom: '1rem',
            background: isOpen ? 'rgba(0, 102, 230, 0.05)' : 'rgba(255,255,255,0.02)',
            borderRadius: '16px',
            border: isOpen ? '1px solid rgba(0, 102, 230, 0.2)' : '1px solid rgba(255,255,255,0.05)',
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
                    fontSize: '1.1rem',
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
                    transition: 'all 0.3s ease'
                }}>
                    {isOpen ? '−' : '+'}
                </div>
            </button>
            {isOpen && (
                <div style={{ padding: '0 2rem 1.5rem 2rem', color: '#94a3b8', lineHeight: '1.7' }}>
                    {answer}
                </div>
            )}
        </div>
    );
};

export default function Pricing() {
    const { user, currentBranch } = useAuth();
    const navigate = useNavigate();
    const [isYearly, setIsYearly] = useState(true);
    const subscription = currentBranch?.subscription;

    const handleSubscribe = async (priceId) => {
        if (!user) {
            navigate('/auth?mode=register');
            return;
        }

        try {
            const res = await stripeAPI.createCheckoutSession(priceId, currentBranch?.id);
            if (res.data?.url) {
                window.location.href = res.data.url;
            }
        } catch (error) {
            console.error("Subscription error:", error);
            alert("Failed to start checkout. Please try again.");
        }
    };

    const plans = [
        {
            name: 'Free For 1 Month',
            id: 'FREE',
            price: 0,
            desc: 'Essential tools for single medical stores.',
            icon: <Building2 size={28} />,
            features: [
                '1 Branch access',
                'Unlimited billing',
                'Basic inventory tracking',
                'GST & Non-GST Invoices',
                'Self-service help docs'
            ],
            buttonText: 'Start for Free',
            primary: false,
            isFree: true
        },
        {
            name: 'Standard',
            id: 'STANDARD',
            price: isYearly ? 2999 : 299,
            period: isYearly ? '/year' : '/month',
            desc: 'Small pharmacies ready to automate operations.',
            icon: <Zap size={28} />,
            features: [
                'Everything in Free',
                'Low stock alerts',
                'Expiry drug tracking',
                'Daily backup',
                'Standard reports',
                'Email support'
            ],
            buttonText: 'Get Standard',
            primary: false,
            savings: isYearly ? 'Save 15%' : null
        },
        {
            name: 'Pro Intelligence',
            id: isYearly ? 'PRO_ANNUAL' : 'PRO',
            price: isYearly ? 4999 : 499,
            period: isYearly ? '/year' : '/month',
            desc: 'Multi-branch pharmacies looking for AI insights.',
            icon: <Crown size={32} />,
            features: [
                'Up to 3 branches included',
                'AI Smart Racking system',
                'Interactive AI Assistant',
                'Advanced analytics dashboard',
                'WhatsApp integration',
                'Priority 24/7 support'
            ],
            buttonText: 'Go Pro Now',
            primary: true,
            featured: true,
            savings: isYearly ? 'Save ₹989' : null
        }
    ];

    return (
        <div className="pricing-page">
            <SEO
                title="Pricing Plans & Features"
                description="Flexible pricing plans for pharmacies of all sizes. Compare Free, Standard, and Pro plans for your medical business."
                canonicalUrl="/pricing"
            />

            {/* 1. Hero Section */}
            <section className="pricing-hero">
                <div className="pricing-badge">
                    <Sparkles size={14} fill="currentColor" /> Simple, Transparent Pricing
                </div>
                <h1>
                    Ready to scale your <br />
                    <span className="gradient-text">Pharmacy with AI?</span>
                </h1>
                <p>
                    Choose the perfect plan for your business needs.
                    From standalone stores to pharmacy chains, we've got you covered.
                </p>

                {/* Monthly/Yearly Toggle */}
                <div className="pricing-toggle-wrap">
                    <span className={`toggle-label ${!isYearly ? 'active' : ''}`}>Monthly</span>
                    <div
                        className={`pricing-toggle ${isYearly ? 'yearly' : ''}`}
                        onClick={() => setIsYearly(!isYearly)}
                    >
                        <div className="toggle-thumb"></div>
                    </div>
                    <span className={`toggle-label ${isYearly ? 'active' : ''}`}>Yearly</span>
                    <div className="save-badge">Save ~20%</div>
                </div>
            </section>

            {/* 2. Pricing Grid */}
            <section className="pricing-cards-container">
                <div className="pricing-grid">
                    {plans.map((plan, idx) => (
                        <div
                            key={idx}
                            className={`price-card ${plan.featured ? 'featured' : ''}`}
                        >
                            {plan.featured && <div className="popular-badge">MOST POPULAR</div>}

                            <div className="card-icon">
                                {plan.icon}
                            </div>

                            <h3>{plan.name}</h3>
                            <p className="desc">{plan.desc}</p>

                            <div className="price-wrap">
                                <span className="price-currency">₹</span>
                                <span className="price-amount">{plan.price.toLocaleString()}</span>
                                {!plan.isFree && <span className="price-period">{plan.period}</span>}
                            </div>

                            {plan.savings && <div style={{ marginBottom: '1.5rem' }}><span className="save-badge">{plan.savings}</span></div>}

                            <ul className="features-list">
                                {plan.features.map((feature, fIdx) => (
                                    <li key={fIdx} className="feature-item">
                                        <CheckCircle2 size={18} color={plan.featured ? "#00e6ac" : "var(--primary-400)"} />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            {/* Plan Selection Logic */}
                            {plan.isFree ? (
                                <button onClick={() => navigate('/auth?mode=register')} className="pricing-btn">
                                    {plan.buttonText} <ArrowRight size={18} />
                                </button>
                            ) : (
                                subscription?.plan === (plan.id.includes('PRO') ? 'PRO' : plan.id) && !subscription?.trialExpired ? (
                                    <button className="pricing-btn current-plan-badge" disabled>
                                        Current Plan {subscription.isTrial ? '(Trial)' : ''}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleSubscribe(plan.id)}
                                        className={`pricing-btn ${plan.primary ? 'primary' : ''} ${plan.id === 'STANDARD' ? 'success' : ''}`}
                                    >
                                        {subscription?.trialExpired ? 'Renew Plan' : plan.buttonText}
                                    </button>
                                )
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* 3. Feature Showcase Section */}
            <section style={{ padding: '4rem 6%', maxWidth: '1440px', margin: '0 auto' }}>
                <div className="feature-showcase" style={{ padding: '5rem 4%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
                    <div>
                        <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(0,102,230,0.1)', color: 'var(--primary-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
                            <Rocket size={32} />
                        </div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1.5rem' }}>All-in-one platform <br />for Modern Pharmacy</h2>
                        <p style={{ color: '#94a3b8', fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '2rem' }}>
                            We don't just provide a billing tool. We provide a complete operating system for your medical business.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            {[
                                { icon: <Smartphone size={18} />, text: 'Mobile App Link' },
                                { icon: <Globe size={18} />, text: 'Cloud Access' },
                                { icon: <BarChart3 size={18} />, text: 'Real-time Stats' },
                                { icon: <ShieldCheck size={18} />, text: 'Data Privacy' }
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e2e8f0', fontWeight: '600' }}>
                                    {item.icon} {item.text}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <div style={{ background: 'linear-gradient(135deg, rgba(0,102,230,0.1), rgba(0,230,172,0.1))', borderRadius: '32px', padding: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                                <div style={{ fontSize: '4rem', fontWeight: '800', color: 'white', marginBottom: '1rem' }}>99.9%</div>
                                <div style={{ color: '#00e6ac', fontSize: '1.1rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Uptime Reliability</div>
                                <p style={{ color: '#94a3b8', marginTop: '1.5rem' }}>Your business never stops, neither do we.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. Comparison Table */}
            <section className="comparison-section">
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800' }}>Full Plan Comparison</h2>
                    <p style={{ color: '#94a3b8', marginTop: '1rem' }}>Detailed breakdown of features across all plans</p>
                </div>

                <div className="comparison-table-wrap">
                    <table className="comparison-table">
                        <thead>
                            <tr>
                                <th>Features</th>
                                <th>Free</th>
                                <th>Standard</th>
                                <th>Pro</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Branch Access</td>
                                <td>1 Branch</td>
                                <td>1 Branch</td>
                                <td>Up to 3 Branches</td>
                            </tr>
                            <tr>
                                <td>Billing & POS</td>
                                <td><CheckCircle2 size={18} className="check-icon" /></td>
                                <td><CheckCircle2 size={18} className="check-icon" /></td>
                                <td><CheckCircle2 size={18} className="check-icon" /></td>
                            </tr>
                            <tr>
                                <td>Inventory Control</td>
                                <td>Basic</td>
                                <td>Full</td>
                                <td>Advanced AI</td>
                            </tr>
                            <tr>
                                <td>Expiry Alerts</td>
                                <td>—</td>
                                <td><CheckCircle2 size={18} className="check-icon" /></td>
                                <td><CheckCircle2 size={18} className="check-icon" /></td>
                            </tr>
                            <tr>
                                <td>AI Assistant</td>
                                <td>—</td>
                                <td>—</td>
                                <td><CheckCircle2 size={18} className="check-icon" /></td>
                            </tr>
                            <tr>
                                <td>WhatsApp Reports</td>
                                <td>—</td>
                                <td>—</td>
                                <td><CheckCircle2 size={18} className="check-icon" /></td>
                            </tr>
                            <tr>
                                <td>Support</td>
                                <td>Community</td>
                                <td>Email</td>
                                <td>Priority 24/7</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 5. FAQ Section */}
            <section style={{ padding: '6rem 6%', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '800' }}>Frequently Asked Questions</h2>
                    </div>
                    <FAQItem
                        question="Is there a free plan?"
                        answer="Yes, our Free Forever plan allows single pharmacies to manage basic billing and inventory at no cost. It's perfect for new stores."
                    />
                    <FAQItem
                        question="Can I upgrade or downgrade anytime?"
                        answer="Absolutely. You can change your plan settings directly from your dashboard. If you upgrade, the new features are unlocked instantly."
                    />
                    <FAQItem
                        question="Do you offer a trial for Pro?"
                        answer="Yes, every new account gets 14 days of Pro features for free to explore the full potential of AI Smart Racking and Insights."
                    />
                    <FAQItem
                        question="Is my data secure?"
                        answer="We use AES-256 bank-grade encryption and daily cloud backups on AWS infrastructure to ensure your business data is 100% safe."
                    />
                </div>
            </section>

            {/* 6. Footer CTA */}
            <section style={{ padding: '8rem 6%', textAlign: 'center' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', background: 'linear-gradient(135deg, #0066e6, #0047ab)', borderRadius: '40px', padding: '5rem 2rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 70% 20%, rgba(255,255,255,0.15), transparent)', pointerEvents: 'none' }}></div>
                    <h2 style={{ fontSize: '3.5rem', fontWeight: '900', color: 'white', marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>Ready to Scale?</h2>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.3rem', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
                        Join 500+ smart pharmacies across India. Start for free, upgrade when you grow.
                    </p>
                    <button onClick={() => navigate('/auth?mode=register')} className="pricing-btn" style={{ maxWidth: '300px', margin: '0 auto', background: 'white', color: '#0066e6', border: 'none', fontSize: '1.2rem' }}>
                        Get Started Now <ArrowRight size={22} />
                    </button>
                </div>
            </section>
        </div>
    );
}
