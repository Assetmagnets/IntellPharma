import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { stripeAPI } from '../services/api';
import { CheckCircle, Loader2, Crown, ArrowRight, Building2 } from 'lucide-react';
import '../styles/subscription.css';

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [planName, setPlanName] = useState(null);
    const [purchaseType, setPurchaseType] = useState('PLAN'); // 'PLAN' or 'EXTRA_BRANCH'
    const [extraBranchCount, setExtraBranchCount] = useState(0);
    const [countdown, setCountdown] = useState(5);
    const syncCalledRef = useRef(false); // Prevent double execution in React 18 StrictMode

    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        // Prevent duplicate calls (React 18 StrictMode calls useEffect twice)
        if (sessionId && !syncCalledRef.current) {
            syncCalledRef.current = true;
            syncSubscription(sessionId);
        } else if (!sessionId) {
            setLoading(false);
        }
    }, [searchParams]);

    // Auto-redirect countdown
    useEffect(() => {
        if (!loading && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (!loading && countdown === 0) {
            navigate('/subscription?refresh=true');
        }
    }, [loading, countdown, navigate]);

    const syncSubscription = async (sessionId) => {
        let isExtraBranch = false;

        // FIRST: Check URL parameters for immediate detection (most reliable)
        const urlType = searchParams.get('type');
        const urlCount = searchParams.get('count');

        console.log('🔍 PaymentSuccess: URL params - type:', urlType, 'count:', urlCount);

        if (urlType === 'extra_branch') {
            console.log('✅ PaymentSuccess: Detected extra_branch from URL params!');
            isExtraBranch = true;
            setPurchaseType('EXTRA_BRANCH');
            setExtraBranchCount(parseInt(urlCount) || 1);
        }

        console.log('🔍 PaymentSuccess: Starting sync with sessionId:', sessionId);

        try {
            // Verify the session to update the database (even if we already know the type)
            if (sessionId) {
                try {
                    console.log('🔍 PaymentSuccess: Calling verifySession...');
                    const response = await stripeAPI.verifySession(sessionId);
                    console.log('🔍 PaymentSuccess: verifySession response:', response.data);

                    if (response.data.success) {
                        // Only update state if we haven't already detected from URL
                        if (!isExtraBranch) {
                            console.log('🔍 PaymentSuccess: Checking API response type:', response.data.type);
                            if (response.data.type === 'EXTRA_BRANCH_ONLY') {
                                console.log('✅ PaymentSuccess: Detected EXTRA_BRANCH_ONLY from API!');
                                isExtraBranch = true;
                                setPurchaseType('EXTRA_BRANCH');
                                setExtraBranchCount(response.data.count || 1);
                            } else if (response.data.plan) {
                                console.log('✅ PaymentSuccess: Detected PLAN:', response.data.plan);
                                setPurchaseType('PLAN');
                                setPlanName(response.data.plan);
                            }
                        }
                    }
                } catch (err) {
                    console.error('❌ PaymentSuccess: Session verify FAILED:', err);
                }
            }

            // Only sync from Stripe status if this wasn't an extra branch purchase
            if (!isExtraBranch && !planName) {
                console.log('🔍 PaymentSuccess: Falling back to getSubscriptionStatus...');
                try {
                    const statusRes = await stripeAPI.getSubscriptionStatus();
                    console.log('🔍 PaymentSuccess: subscriptionStatus response:', statusRes.data);
                    if (statusRes.data?.plan) {
                        setPlanName(statusRes.data.plan);
                    }
                } catch (err) {
                    console.log('Status check failed');
                }
            }

        } catch (err) {
            console.error('Sync error:', err);
        } finally {
            console.log('🔍 PaymentSuccess: Final state - isExtraBranch:', isExtraBranch);
            setLoading(false);
        }
    };

    // Get benefits based on purchase type and plan
    const getBenefits = () => {
        if (purchaseType === 'EXTRA_BRANCH') {
            return [
                `+${extraBranchCount} extra branch${extraBranchCount > 1 ? 'es' : ''} added`,
                'Manage more locations',
                'Expanded inventory capacity',
                'Monthly billing at ₹499/branch'
            ];
        }
        // Plan-based benefits
        if (planName === 'PREMIUM') {
            return [
                'Up to 10 branches',
                'Advanced AI features',
                'Premium analytics & reports',
                'Priority 24/7 support'
            ];
        }
        // Default to PRO features
        return [
            'Up to 3 branches',
            'AI features enabled',
            'Advanced analytics',
            'Priority support'
        ];
    };

    return (
        <div className="payment-result-page">
            <div className="payment-result-card glass-panel">
                {loading ? (
                    <div className="payment-loading">
                        <Loader2 className="spinner animate-spin" size={48} />
                        <h2>Activating your subscription...</h2>
                        <p>Please wait while we confirm your payment.</p>
                    </div>
                ) : (
                    <div className="payment-success">
                        <div className="success-icon">
                            <CheckCircle size={64} />
                        </div>
                        <h1>Payment Successful! 🎉</h1>

                        {purchaseType === 'EXTRA_BRANCH' ? (
                            <>
                                <p className="success-message">
                                    <strong>{extraBranchCount} Extra Branch{extraBranchCount > 1 ? 'es' : ''}</strong> added to your account!
                                </p>
                                <div className="plan-badge-large extra-branch-badge">
                                    <Building2 size={24} />
                                    <span>+{extraBranchCount} Branch{extraBranchCount > 1 ? 'es' : ''} Added</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="success-message">
                                    Your <strong>{planName || 'PRO'} Plan</strong> is now active!
                                </p>
                                <div className="plan-badge-large">
                                    <Crown size={24} />
                                    <span>{planName || 'PRO'} Plan Active</span>
                                </div>
                            </>
                        )}

                        <ul className="benefits-list">
                            {getBenefits().map((benefit, index) => (
                                <li key={index}><CheckCircle size={16} /> {benefit}</li>
                            ))}
                        </ul>
                        <p className="redirect-message">
                            Redirecting to subscription page in <strong>{countdown}</strong> seconds...
                        </p>
                        <div className="payment-actions">
                            <button
                                className="btn btn-primary"
                                onClick={() => navigate('/subscription?refresh=true')}
                            >
                                View Subscription <ArrowRight size={18} />
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => navigate('/dashboard')}
                            >   
                                Go to Dashboard
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
