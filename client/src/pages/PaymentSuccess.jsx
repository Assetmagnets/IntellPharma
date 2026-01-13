import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { stripeAPI } from '../services/api';
import { CheckCircle, Loader2, Crown, ArrowRight } from 'lucide-react';
import '../styles/subscription.css';

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [planName, setPlanName] = useState('PRO');
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        syncSubscription(sessionId);
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
        try {
            // First, try to verify the session if we have one
            if (sessionId) {
                try {
                    const response = await stripeAPI.verifySession(sessionId);
                    if (response.data.success) {
                        setPlanName(response.data.plan);
                    }
                } catch (err) {
                    console.log('Session verify failed, will sync from Stripe status');
                }
            }

            // Always sync from Stripe status to ensure DB is up to date
            try {
                const statusRes = await stripeAPI.getSubscriptionStatus();
                if (statusRes.data?.plan) {
                    setPlanName(statusRes.data.plan);
                }
            } catch (err) {
                console.log('Status check failed');
            }

        } catch (err) {
            console.error('Sync error:', err);
        } finally {
            setLoading(false);
        }
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
                        <p className="success-message">
                            Your <strong>{planName} Plan</strong> is now active!
                        </p>
                        <div className="plan-badge-large">
                            <Crown size={24} />
                            <span>{planName} Plan Active</span>
                        </div>
                        <ul className="benefits-list">
                            <li><CheckCircle size={16} /> Up to 3 branches (PRO)</li>
                            <li><CheckCircle size={16} /> AI features enabled</li>
                            <li><CheckCircle size={16} /> Advanced analytics</li>
                            <li><CheckCircle size={16} /> Priority support</li>
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
