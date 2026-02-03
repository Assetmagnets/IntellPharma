import LoginForm from '../components/auth/LoginForm';
import '../styles/auth.css';

export default function Login() {
    return (
        <div className="auth-page gradient-mesh">
            <div className="auth-container animate-slideUp">
                <div className="auth-header">
                    <div className="auth-logo">
                        <img src="/logo.png" alt="IntellPharma" className="auth-logo-img" />
                        <span className="logo-text">IntellPharma</span>
                    </div>
                    <h1>Welcome Back</h1>
                    <p>Sign in to manage your pharmacy</p>
                </div>

                <div style={{ padding: '0 2rem 2rem' }}>
                    <LoginForm />
                </div>
            </div>
        </div>
    );
}



