import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import '../styles/subscription.css';

export default function PaymentCancel() {
    const navigate = useNavigate();

    return (
        <div className="payment-result-page">
            <div className="payment-result-card glass-panel">
                <div className="payment-cancelled">
                    <div className="cancel-icon">
                        <XCircle size={64} />
                    </div>
                    <h1>Payment Cancelled</h1>
                    <p className="cancel-message">
                        No worries! Your payment was not processed and you haven't been charged.
                    </p>
                    <div className="cancel-reasons">
                        <h3>Why upgrade to a paid plan?</h3>
                        <ul>
                            <li>✨ Manage multiple pharmacy branches</li>
                            <li>🤖 AI-powered inventory suggestions</li>
                            <li>📊 Advanced analytics & reports</li>
                            <li>🔒 Priority customer support</li>
                        </ul>
                    </div>
                    <div className="payment-actions">
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/subscription')}
                        >
                            <RefreshCw size={18} /> Try Again
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => navigate('/dashboard')}
                        >
                            <ArrowLeft size={18} /> Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
