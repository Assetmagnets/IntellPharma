import RegisterForm from '../components/auth/RegisterForm';
import { Sparkles } from 'lucide-react';
import '../styles/auth.css';

export default function Register() {
    return (
        <div className="auth-page gradient-mesh">
            <div className="auth-container register-container animate-slideUp">
                <div className="auth-header">
                    <div className="auth-logo">
                        <img src="/logo.png" alt="IntellPharma" className="auth-logo-img" />
                        <span className="logo-text">IntellPharma</span>
                    </div>
                    <h1>Create Account</h1>
                    <p>Start managing your pharmacy today</p>
                </div>

                <div style={{ padding: '0 2rem' }}>
                    <RegisterForm />
                </div>

                <div className="plan-info glass-panel" style={{ margin: '2rem' }}>
                    <h4>
                        <Sparkles size={16} /> Start Free
                    </h4>
                    <p>Your account includes the Basic plan (1 branch free). Upgrade anytime to Pro or Premium for more features.</p>
                </div>
            </div>
        </div>
    );
}

