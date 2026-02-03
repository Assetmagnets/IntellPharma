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
    Settings,
    AlertCircle
} from 'lucide-react';
import '../styles/subscription.css';

export default function Subscription() {
    const { user, branches } = useAuth();
    const [plans, setPlans] = useState([]);
    const [currentSub, setCurrentSub] = useState(null);
    const [stripeStatus, setStripeStatus] = useState(null);
    const [extraBranchPrice, setExtraBranchPrice] = useState(499);
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
            setExtraBranchPrice(plansRes.data.extraBranchPrice || 499);

            // Call Stripe status FIRST - this syncs the database
            let stripeRes = { data: null };
            try {
                stripeRes = await stripeAPI.getSubscriptionStatus();
                setStripeStatus(stripeRes.data);
            } catch (err) {
                console.log('Stripe status check failed:', err);
            }

            // THEN get current subscription (now it has synced data)
            try {
                const currentRes = await subscriptionAPI.getCurrent();
                setCurrentSub(currentRes.data);
            } catch (subErr) {
                // If no subscription found (404), set a default BASIC subscription state
                // so the UI still shows the current plan card with Add Extra Branch option
                console.log('No subscription found, using default BASIC:', subErr);
                setCurrentSub({
                    plan: 'BASIC',
                    planDetails: { name: 'Basic', price: 0 },
                    maxBranches: 1,
                    extraBranches: 0,
                    aiEnabled: false,
                    analyticsEnabled: false,
                    autoRenew: false,
                    usage: { branchCount: 1, maxBranches: 1, remaining: 0 }
                });
            }

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
            alert('Please contact sales@intellpharma.com for Enterprise pricing.');
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
        const count = prompt('How many extra branches do you want to add? (₹499/mo each)', '1');
        if (!count || isNaN(count) || count < 1) return;

        setProcessing('EXTRA_BRANCH'); // Show loading state
        try {
            const response = await stripeAPI.addExtraBranches(parseInt(count));

            if (response.data.url) {
                // Case B: Redirect to Checkout
                window.location.href = response.data.url;
            } else if (response.data.success) {
                // Case A: Immediate update (Existing Sub)
                alert(response.data.message);
                loadSubscriptionData();
            }
        } catch (error) {
            console.error('Add branches error:', error);
            alert(error.response?.data?.error || 'Failed to process extra branches payment.');
        } finally {
            setProcessing(null);
        }
    };

    const handleCancelRenewal = async () => {
        if (!confirm('Are you sure you want to cancel auto-renewal? You will not be charged again after the current period ends.')) return;

        try {
            const response = await subscriptionAPI.cancelRenewal();
            loadSubscriptionData();
            alert(response.data?.message || 'Auto-renewal cancelled');
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to cancel renewal');
        }
    };

    const handleReactivateRenewal = async () => {
        if (!confirm('Reactivate auto-renewal? Your subscription will continue automatically and you will be charged on the next billing date.')) return;

        try {
            const response = await subscriptionAPI.reactivateRenewal();
            loadSubscriptionData();
            alert(response.data?.message || 'Auto-renewal reactivated!');
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to reactivate renewal');
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
        // Check both stripeStatus and if currentSub has a stripeSubscriptionId (for extra branches)
        // Also check if user has extraBranches > 0 since that means they paid via Stripe
        return (stripeStatus?.hasSubscription && stripeStatus?.status === 'active') ||
            (currentSub?.stripeSubscriptionId) ||
            (currentSub?.extraBranches > 0);
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

                                {/* Billing Information */}
                                {hasActiveStripeSubscription() && (
                                    <div className="billing-info-section">
                                        <h4 className="billing-title"><CreditCard size={16} /> Billing Information</h4>
                                        <div className="billing-grid">
                                            <div className="billing-item">
                                                <span className="billing-label">Status</span>
                                                <span className={`billing-value status-${currentSub.autoRenew ? 'active' : 'cancelled'}`}>
                                                    {currentSub.autoRenew ? '✓ Active' : '⚠ Set to Cancel'}
                                                </span>
                                            </div>
                                            <div className="billing-item">
                                                <span className="billing-label">Next Billing Date</span>
                                                <span className="billing-value">
                                                    {formatDate(stripeStatus?.currentPeriodEnd || currentSub.stripeCurrentPeriodEnd)}
                                                </span>
                                            </div>
                                            {currentSub.extraBranches > 0 && (
                                                <div className="billing-item">
                                                    <span className="billing-label">Extra Branches</span>
                                                    <span className="billing-value">
                                                        {currentSub.extraBranches} × ₹{extraBranchPrice}/mo
                                                    </span>
                                                </div>
                                            )}
                                            {(currentSub.planDetails?.price > 0 || currentSub.extraBranches > 0) && (
                                                <div className="billing-item billing-total">
                                                    <span className="billing-label">Monthly Total</span>
                                                    <span className="billing-value billing-amount">
                                                        ₹{(currentSub.planDetails?.price || 0) + (currentSub.extraBranches * extraBranchPrice)}/mo
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {!currentSub.autoRenew && (
                                            <div className="billing-warning">
                                                <AlertCircle size={16} />
                                                Your subscription will end on {formatDate(stripeStatus?.currentPeriodEnd || currentSub.stripeCurrentPeriodEnd)}.
                                                Click "Reactivate Auto-Renewal" to continue your subscription.
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
                                    <button
                                        className="btn btn-secondary"
                                        onClick={handleAddBranches}
                                        disabled={processing !== null}
                                    >
                                        {processing === 'EXTRA_BRANCH' ? (
                                            <>
                                                <Loader2 className="animate-spin" size={16} /> Processing...
                                            </>
                                        ) : (
                                            `+ Add Extra Branches (₹${extraBranchPrice}/mo each)`
                                        )}
                                    </button>
                                    {hasActiveStripeSubscription() && (
                                        currentSub.autoRenew ? (
                                            <button className="btn btn-ghost" onClick={handleCancelRenewal}>
                                                Cancel Auto-Renewal
                                            </button>
                                        ) : (
                                            <button className="btn btn-primary" onClick={handleReactivateRenewal}>
                                                Reactivate Auto-Renewal
                                            </button>
                                        )
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
                                        <button className="btn btn-secondary w-full" onClick={() => alert('Contact +91 9777295707 or sales@intellpharma.com for Enterprise pricing')}>
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
