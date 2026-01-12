import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscriptionAPI } from '../services/api';
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
    Wallet
} from 'lucide-react';
import '../styles/subscription.css';

export default function Subscription() {
    const { user, branches } = useAuth();
    const [plans, setPlans] = useState([]);
    const [currentSub, setCurrentSub] = useState(null);
    const [extraBranchPrice, setExtraBranchPrice] = useState(500);
    const [loading, setLoading] = useState(true);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadSubscriptionData();
    }, []);

    const loadSubscriptionData = async () => {
        setLoading(true);
        try {
            const [plansRes, currentRes] = await Promise.all([
                subscriptionAPI.getPlans(),
                subscriptionAPI.getCurrent()
            ]);

            setPlans(plansRes.data.plans || []);
            setExtraBranchPrice(plansRes.data.extraBranchPrice || 500);
            setCurrentSub(currentRes.data);
        } catch (error) {
            console.error('Load subscription error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async () => {
        if (!selectedPlan) return;

        setProcessing(true);
        try {
            await subscriptionAPI.upgrade({ plan: selectedPlan.id });
            setShowUpgradeModal(false);
            loadSubscriptionData();
            alert('Subscription upgraded successfully!');
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to upgrade');
        } finally {
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
        return currentSub?.plan === planId;
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
                                    {currentSub.autoRenew && (
                                        <span className="auto-renew-badge">Auto-Renew ON</span>
                                    )}
                                </div>

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
                                    <button className="btn btn-secondary" onClick={handleAddBranches}>
                                        + Add Extra Branches (₹{extraBranchPrice}/mo each)
                                    </button>
                                    {currentSub.autoRenew && (
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
                                        <button className="btn btn-secondary w-full" disabled>
                                            Current Plan
                                        </button>
                                    ) : plan.id === 'ENTERPRISE' ? (
                                        <button className="btn btn-secondary w-full" onClick={() => alert('Contact sales@medistock.com for Enterprise pricing')}>
                                            Contact Sales
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn-primary w-full"
                                            onClick={() => {
                                                setSelectedPlan(plan);
                                                setShowUpgradeModal(true);
                                            }}
                                        >
                                            {plan.price > (currentSub?.planDetails?.price || 0) ? 'Upgrade' : 'Switch'} to {plan.name}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Payment Methods Section */}
                        <div className="payment-section glass-panel">
                            <h3>
                                <Wallet size={20} />
                                Payment Methods
                            </h3>
                            <p className="section-desc">Secure payments powered by Razorpay/Stripe</p>

                            <div className="payment-icons">
                                <span className="payment-icon"><CreditCard size={16} /> Cards</span>
                                <span className="payment-icon"><Smartphone size={16} /> UPI</span>
                                <span className="payment-icon"><Landmark size={16} /> Net Banking</span>
                                <span className="payment-icon"><Wallet size={16} /> Wallets</span>
                            </div>

                            <div className="billing-info">
                                <p>
                                    <strong>Billing Cycle:</strong> Monthly, auto-renewed on the same date
                                </p>
                                <p>
                                    <strong>Upgrades:</strong> Prorated credit applied from current plan
                                </p>
                                <p>
                                    <strong>Downgrades:</strong> Takes effect from next billing cycle
                                </p>
                            </div>
                        </div>
                    </>
                )}

                {/* Upgrade Modal */}
                {showUpgradeModal && selectedPlan && (
                    <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
                        <div className="modal upgrade-modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Upgrade to {selectedPlan.name}</h2>
                                <button className="modal-close" onClick={() => setShowUpgradeModal(false)}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="upgrade-summary">
                                <div className="upgrade-from">
                                    <span className="upgrade-label">Current Plan</span>
                                    <span className="upgrade-value">{currentSub?.planDetails?.name || 'Basic'}</span>
                                </div>
                                <span className="upgrade-arrow">
                                    <ArrowRight size={24} />
                                </span>
                                <div className="upgrade-to">
                                    <span className="upgrade-label">New Plan</span>
                                    <span className="upgrade-value">{selectedPlan.name}</span>
                                </div>
                            </div>

                            <div className="upgrade-price">
                                <span>Monthly Price:</span>
                                <span className="price">{formatCurrency(selectedPlan.price)}</span>
                            </div>

                            <div className="upgrade-features">
                                <h4>You'll Get:</h4>
                                <ul>
                                    {getPlanFeatures(selectedPlan).map((feature, idx) => (
                                        <li key={idx}>
                                            <Check size={16} className="inline-block mr-1" /> {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="modal-actions">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowUpgradeModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleUpgrade}
                                    disabled={processing}
                                >
                                    {processing ? 'Processing...' : 'Confirm Upgrade'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
