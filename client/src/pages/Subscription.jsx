import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscriptionAPI, stripeAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import {
    Crown,
    CheckCircle,
    Zap,
    Building2,
    Check,
    ArrowRight,
    X,
    Loader2,
    CreditCard,
    Smartphone,
    Landmark,
    Wallet,
    ExternalLink,
    Settings
} from 'lucide-react';
import '../styles/subscription.css';

export default function Subscription() {
    const { user, branches } = useAuth();
    const [plans, setPlans] = useState([]);
    const [currentSub, setCurrentSub] = useState(null);
    const [stripeStatus, setStripeStatus] = useState(null);
    const [extraBranchPrice, setExtraBranchPrice] = useState(500);
    const [loading, setLoading] = useState(true);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [processing, setProcessing] = useState(null); // Track which plan is processing
    const [searchParams] = useSearchParams();

    // Plan tier order for comparison
    const PLAN_TIERS = { BASIC: 0, PRO: 1, PREMIUM: 2, ENTERPRISE: 3 };

    useEffect(() => {
        loadSubscriptionData();
    }, []);

    // Reload data when returning from payment success
    useEffect(() => {
        if (searchParams.get('refresh') === 'true') {
            loadSubscriptionData();
            // Remove the refresh param from URL
            window.history.replaceState({}, '', '/subscription');
        }
    }, [searchParams]);

    const loadSubscriptionData = async () => {
        setLoading(true);
        try {
            // First get plans
            const plansRes = await subscriptionAPI.getPlans();
            setPlans(plansRes.data.plans || []);
            setExtraBranchPrice(plansRes.data.extraBranchPrice || 500);

            // Call Stripe status FIRST - this syncs the database
            let stripeRes = { data: null };
            try {
                stripeRes = await stripeAPI.getSubscriptionStatus();
                setStripeStatus(stripeRes.data);
            } catch (err) {
                console.log('Stripe status check failed:', err);
            }

            // THEN get current subscription (now it has synced data)
            const currentRes = await subscriptionAPI.getCurrent();
            setCurrentSub(currentRes.data);

        } catch (error) {
            console.error('Load subscription error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStripeCheckout = async (plan) => {
        if (plan.price === 0) {
            alert('Basic plan is free. No payment required!');
            return;
        }

        if (plan.id === 'ENTERPRISE') {
            alert('Please contact sales@medistock.com for Enterprise pricing.');
            return;
        }

        setProcessing(plan.id);
        try {
            const response = await stripeAPI.createCheckoutSession(plan.id);

            // Redirect to Stripe Checkout
            if (response.data.url) {
                window.location.href = response.data.url;
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert(error.response?.data?.error || 'Failed to start checkout. Please try again.');
            setProcessing(null);
        }
    };

    const handleManageBilling = async () => {
        setProcessing(true);
        try {
            const response = await stripeAPI.createPortalSession();
            if (response.data.url) {
                window.location.href = response.data.url;
            }
        } catch (error) {
            console.error('Portal error:', error);
            alert(error.response?.data?.error || 'Failed to open billing portal.');
            setProcessing(false);
        }
    };

    const handleAddBranches = async () => {
        const count = prompt('How many extra branches do you want to add?', '1');
        if (!count || isNaN(count)) return;

        try {
            await subscriptionAPI.addBranches(parseInt(count));
            loadSubscriptionData();
            alert(`Added ${count} extra branch(es)!`);
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to add branches');
        }
    };

    const handleCancelRenewal = async () => {
        if (!confirm('Are you sure you want to cancel auto-renewal?')) return;

        try {
            await subscriptionAPI.cancelRenewal();
            loadSubscriptionData();
            alert('Auto-renewal cancelled');
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to cancel renewal');
        }
    };

    const formatCurrency = (amount) => {
        if (amount === null) return 'Custom';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getPlanFeatures = (plan) => {
        return plan.features || [];
    };

    const isCurrentPlan = (planId) => {
        return currentSub?.plan === planId || stripeStatus?.plan === planId;
    };

    const getCurrentPlanTier = () => {
        const currentPlan = stripeStatus?.plan || currentSub?.plan || 'BASIC';
        return PLAN_TIERS[currentPlan] || 0;
    };

    const isLowerOrEqualPlan = (planId) => {
        return PLAN_TIERS[planId] <= getCurrentPlanTier();
    };

    const hasActiveStripeSubscription = () => {
        return stripeStatus?.hasSubscription && stripeStatus?.status === 'active';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-main">
                <Header title="Subscription" icon={Crown} />

                {loading ? (
                    <div className="loading-container">
                        <Loader2 className="spinner spinner-lg animate-spin" size={32} />
                    </div>
                ) : (
                    <>
                        {/* Current Plan Summary */}
                        {currentSub && (
                            <div className="current-plan-card glass-panel">
                                <div className="plan-header">
                                    <div className="plan-badge">
                                        <div className="plan-icon">
                                            {currentSub.plan === 'BASIC' && <Zap size={20} />}
                                            {currentSub.plan === 'PRO' && <Crown size={20} />}
                                            {currentSub.plan === 'PREMIUM' && <Crown size={20} />}
                                            {currentSub.plan === 'ENTERPRISE' && <Building2 size={20} />}
                                        </div>
                                        <span className="plan-name">{currentSub.planDetails?.name || currentSub.plan}</span>
                                    </div>
                                    <div className="plan-status-badges">
                                        {hasActiveStripeSubscription() && (
                                            <span className="stripe-active-badge">
                                                <CheckCircle size={14} /> Stripe Active
                                            </span>
                                        )}
                                        {currentSub.autoRenew && (
                                            <span className="auto-renew-badge">Auto-Renew ON</span>
                                        )}
                                    </div>
                                </div>

                                {/* Stripe Subscription Details */}
                                {hasActiveStripeSubscription() && (
                                    <div className="stripe-info">
                                        <div className="stripe-detail">
                                            <span className="label">Next billing date:</span>
                                            <span className="value">{formatDate(stripeStatus.currentPeriodEnd)}</span>
                                        </div>
                                        {stripeStatus.cancelAtPeriodEnd && (
                                            <div className="stripe-warning">
                                                ⚠️ Subscription will cancel at period end
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="plan-usage">
                                    <div className="usage-item">
                                        <span className="usage-label">Branches Used</span>
                                        <span className="usage-value">
                                            {currentSub.usage?.branchCount || branches.length} / {currentSub.usage?.maxBranches || currentSub.maxBranches}
                                        </span>
                                        <div className="usage-bar">
                                            <div
                                                className="usage-fill"
                                                style={{
                                                    width: `${((currentSub.usage?.branchCount || branches.length) / (currentSub.usage?.maxBranches || currentSub.maxBranches)) * 100}%`
                                                }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="usage-features">
                                        <div className={`feature-status ${currentSub.aiEnabled ? 'enabled' : 'disabled'}`}>
                                            {currentSub.aiEnabled ? <CheckCircle size={14} /> : <X size={14} />} AI Features
                                        </div>
                                        <div className={`feature-status ${currentSub.analyticsEnabled ? 'enabled' : 'disabled'}`}>
                                            {currentSub.analyticsEnabled ? <CheckCircle size={14} /> : <X size={14} />} Advanced Analytics
                                        </div>
                                    </div>
                                </div>

                                <div className="plan-actions">
                                    {hasActiveStripeSubscription() && (
                                        <button
                                            className="btn btn-secondary"
                                            onClick={handleManageBilling}
                                            disabled={processing}
                                        >
                                            <Settings size={16} /> Manage Billing
                                        </button>
                                    )}
                                    <button className="btn btn-secondary" onClick={handleAddBranches}>
                                        + Add Extra Branches (₹{extraBranchPrice}/mo each)
                                    </button>
                                    {currentSub.autoRenew && !hasActiveStripeSubscription() && (
                                        <button className="btn btn-ghost" onClick={handleCancelRenewal}>
                                            Cancel Auto-Renewal
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Pricing Plans */}
                        <h2 className="section-title">Available Plans</h2>
                        <div className="plans-grid">
                            {plans.map(plan => (
                                <div
                                    key={plan.id}
                                    className={`plan-card glass-panel ${isCurrentPlan(plan.id) ? 'current' : ''} ${plan.id === 'PRO' ? 'featured' : ''}`}
                                >
                                    {plan.id === 'PRO' && <div className="popular-badge">Most Popular</div>}

                                    <div className="plan-icon-large">
                                        {plan.id === 'BASIC' && <Zap size={32} />}
                                        {plan.id === 'PRO' && <Crown size={32} />}
                                        {plan.id === 'PREMIUM' && <Crown size={32} />}
                                        {plan.id === 'ENTERPRISE' && <Building2 size={32} />}
                                    </div>

                                    <h3 className="plan-title">{plan.name}</h3>

                                    <div className="plan-price">
                                        {plan.price === 0 ? (
                                            <span className="price-free">Free</span>
                                        ) : plan.price === null ? (
                                            <span className="price-custom">Custom</span>
                                        ) : (
                                            <>
                                                <span className="price-amount">{formatCurrency(plan.price)}</span>
                                                <span className="price-period">/month</span>
                                            </>
                                        )}
                                    </div>

                                    <ul className="plan-features">
                                        {getPlanFeatures(plan).map((feature, idx) => (
                                            <li key={idx}>
                                                <span className="feature-check"><Check size={16} /></span>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    {isCurrentPlan(plan.id) ? (
                                        <button className="btn btn-success w-full" disabled>
                                            <CheckCircle size={16} /> Current Plan
                                        </button>
                                    ) : plan.id === 'ENTERPRISE' ? (
                                        <button className="btn btn-secondary w-full" onClick={() => alert('Contact sales@medistock.com for Enterprise pricing')}>
                                            Contact Sales
                                        </button>
                                    ) : isLowerOrEqualPlan(plan.id) ? (
                                        <button className="btn btn-secondary w-full" disabled>
                                            {plan.price === 0 ? 'Free Plan' : 'Included in Current Plan'}
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn-primary w-full"
                                            onClick={() => handleStripeCheckout(plan)}
                                            disabled={processing !== null}
                                        >
                                            {processing === plan.id ? (
                                                <>
                                                    <Loader2 className="animate-spin" size={16} /> Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <CreditCard size={16} /> Upgrade to {plan.name}
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Payment Methods Section */}
                        <div className="payment-section glass-panel">
                            <h3>
                                <Wallet size={20} />
                                Secure Payment with Stripe
                            </h3>
                            <p className="section-desc">Your payment is securely processed by Stripe. We never store your card details.</p>

                            <div className="payment-icons">
                                <span className="payment-icon"><CreditCard size={16} /> Visa</span>
                                <span className="payment-icon"><CreditCard size={16} /> Mastercard</span>
                                <span className="payment-icon"><CreditCard size={16} /> Amex</span>
                                <span className="payment-icon"><Landmark size={16} /> Net Banking</span>
                            </div>

                            <div className="billing-info">
                                <p>
                                    <strong>Billing Cycle:</strong> Monthly, auto-renewed on the same date
                                </p>
                                <p>
                                    <strong>Upgrades:</strong> Take effect immediately with prorated billing
                                </p>
                                <p>
                                    <strong>Cancellation:</strong> Cancel anytime from the billing portal
                                </p>
                            </div>

                            <div className="stripe-badge">
                                <span>Powered by</span>
                                <strong>Stripe</strong>
                                <ExternalLink size={14} />
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
