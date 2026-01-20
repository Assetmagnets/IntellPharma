import { Outlet } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import '../styles/landing.css';

export default function PublicLayout() {
    return (
        <div className="landing-page">
            <div className="landing-bg">
                <div className="bg-gradient"></div>
                <div className="bg-pattern"></div>
            </div>

            <PublicNavbar />

            <div style={{ minHeight: 'calc(100vh - 100px)' }}>
                <Outlet />
            </div>

            <PublicFooter />
        </div>
    );
}
