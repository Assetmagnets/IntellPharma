import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import StatsCard from '../../components/StatsCard';
import Header from '../../components/Header';
import {
    Users,
    Store,
    CreditCard,
    LayoutDashboard,
    Activity,
    Shield,
    BarChart3
} from 'lucide-react';
import '../../styles/dashboard.css';

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const response = await superAdminAPI.getStats();
            setStats(response.data);
        } catch (error) {
            console.error('Failed to load stats', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner spinner-lg"></div>
                <p>Loading platform data...</p>
            </div>
        );
    }

    return (
        <>
            <Header title="Platform Overview" icon={LayoutDashboard} />

            {/* Stats Grid */}
            <div className="stats-grid">
                <StatsCard
                    icon={Store}
                    iconBg="gradient-primary"
                    label="Total Pharmacies"
                    value={stats?.totalPharmacies || 0}
                    change={stats?.newPharmacies > 0 ? `+${stats.newPharmacies} new this month` : 'No new pharmacies'}
                    changeType={stats?.newPharmacies > 0 ? 'positive' : 'neutral'}
                />
                <StatsCard
                    icon={Users}
                    iconBg="gradient-accent"
                    label="Total Users"
                    value={stats?.totalUsers || 0}
                    change={stats?.newUsers > 0 ? `+${stats.newUsers} new this month` : 'No new users'}
                    changeType={stats?.newUsers > 0 ? 'positive' : 'neutral'}
                />
                <StatsCard
                    icon={Shield}
                    iconBg="bg-warning"
                    label="Active Subscriptions"
                    value={stats?.activeSubscriptions || 0}
                    change={stats?.newSubscriptions > 0 ? `+${stats.newSubscriptions} new this month` : 'No new subs'}
                    changeType={stats?.newSubscriptions > 0 ? 'positive' : 'neutral'}
                />
                <StatsCard
                    icon={CreditCard}
                    iconBg="bg-error"
                    label="Invoices Generated"
                    value={stats?.totalInvoices || 0}
                    change={stats?.newInvoices > 0 ? `+${stats.newInvoices} this month` : 'No new invoices'}
                    changeType={stats?.newInvoices > 0 ? 'positive' : 'neutral'}
                />
            </div>

            {/* Quick Actions */}
            <section className="dashboard-section">
                <h2>Quick Actions</h2>
                <div className="quick-actions">
                    <button className="action-card glass-card" onClick={() => window.location.href = '/super-admin/pharmacies'}>
                        <Store className="action-icon" size={32} />
                        <span className="action-label">View Pharmacies</span>
                    </button>
                    <button className="action-card glass-card" onClick={() => window.location.href = '/super-admin/activity'}>
                        <Activity className="action-icon" size={32} />
                        <span className="action-label">Activity Logs</span>
                    </button>
                    <button className="action-card glass-card" onClick={() => alert('Feature coming soon!')}>
                        <BarChart3 className="action-icon" size={32} />
                        <span className="action-label">View Reports</span>
                    </button>
                    <button className="action-card glass-card" onClick={() => alert('Feature coming soon!')}>
                        <Users className="action-icon" size={32} />
                        <span className="action-label">Manage Users</span>
                    </button>
                </div>
            </section>
        </>
    );
}
