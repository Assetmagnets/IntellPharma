import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { billingAPI, inventoryAPI, aiAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StatsCard from '../components/StatsCard';
import AIPromptBox from '../components/AIPromptBox';
import {
    Home,
    IndianRupee,
    Receipt,
    Package,
    Clock,
    Sparkles,
    PackagePlus,
    AlertTriangle,
    BarChart3
} from 'lucide-react';
import '../styles/dashboard.css';

export default function Dashboard() {
    const { user, currentBranch, canAccessFinancials } = useAuth();
    const [stats, setStats] = useState({
        todaySales: 0,
        invoiceCount: 0,
        lowStockCount: 0,
        expiringCount: 0,
        criticalCount: 0
    });
    const [recentPrompts, setRecentPrompts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentBranch) {
            loadDashboardData();
        }
    }, [currentBranch]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const [salesRes, lowStockRes, expiringRes, criticalRes, promptsRes] = await Promise.all([
                billingAPI.getSalesSummary(currentBranch.id, {
                    startDate: today.toISOString(),
                    endDate: tomorrow.toISOString()
                }).catch(() => ({ data: { totalSales: 0, invoiceCount: 0 } })),
                inventoryAPI.getLowStock(currentBranch.id).catch(() => ({ data: [] })),
                inventoryAPI.getExpiring(currentBranch.id).catch(() => ({ data: [] })),
                inventoryAPI.getCritical(currentBranch.id).catch(() => ({ data: [] })),
                aiAPI.getHistory({ limit: 5 }).catch(() => ({ data: [] }))
            ]);

            setStats({
                todaySales: salesRes.data.totalSales || 0,
                invoiceCount: salesRes.data.invoiceCount || 0,
                lowStockCount: lowStockRes.data.length || 0,
                expiringCount: expiringRes.data.length || 0,
                criticalCount: criticalRes.data.length || 0
            });

            setRecentPrompts(promptsRes.data || []);
        } catch (error) {
            console.error('Dashboard load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-main">
                <Header title="Dashboard" icon={Home} />

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner spinner-lg"></div>
                        <p>Loading dashboard...</p>
                    </div>
                ) : (
                    <>
                        {/* Critical Alert Banner */}
                        {stats.criticalCount > 0 && (
                            <div className="alert-banner critical">
                                <div className="alert-content">
                                    <AlertTriangle className="alert-icon" size={24} />
                                    <div>
                                        <h3>Critical Stock Alert</h3>
                                        <p>You have {stats.criticalCount} products that are both low stock and expiring soon.</p>
                                    </div>
                                </div>
                                <button className="btn btn-white" onClick={() => window.location.href = '/inventory?filter=critical'}>
                                    View Items
                                </button>
                            </div>
                        )}

                        {/* Stats Grid */}
                        <div className="stats-grid">
                            {canAccessFinancials() && (
                                <StatsCard
                                    icon={IndianRupee}
                                    iconBg="gradient-primary"
                                    label="Today's Sales"
                                    value={formatCurrency(stats.todaySales)}
                                    change="+12%"
                                    changeType="positive"
                                />
                            )}

                            <StatsCard
                                icon={Receipt}
                                iconBg="gradient-accent"
                                label="Invoices Today"
                                value={stats.invoiceCount}
                                change="+5"
                                changeType="positive"
                            />

                            <StatsCard
                                icon={Package}
                                iconBg="bg-warning"
                                label="Low Stock Items"
                                value={stats.lowStockCount}
                                change={stats.lowStockCount > 5 ? 'Needs attention' : 'OK'}
                                changeType={stats.lowStockCount > 5 ? 'negative' : 'positive'}
                            />

                            <StatsCard
                                icon={Clock}
                                iconBg="bg-error"
                                label="Expiring Soon"
                                value={stats.expiringCount}
                                change="Within 60 days"
                                changeType={stats.expiringCount > 0 ? 'negative' : 'positive'}
                            />
                        </div>

                        {/* AI Prompt Section */}
                        <section className="dashboard-section">
                            <div className="section-header">
                                <h2>
                                    <Sparkles className="section-icon" size={24} />
                                    AI Assistant
                                </h2>
                                <p>Ask questions about your pharmacy data</p>
                            </div>
                            <AIPromptBox branchId={currentBranch?.id} />
                        </section>

                        {/* Quick Actions */}
                        <section className="dashboard-section">
                            <h2>Quick Actions</h2>
                            <div className="quick-actions">
                                <button className="action-card glass-card" onClick={() => window.location.href = '/billing'}>
                                    <Receipt className="action-icon" size={32} />
                                    <span className="action-label">New Invoice</span>
                                </button>
                                <button className="action-card glass-card" onClick={() => window.location.href = '/inventory'}>
                                    <PackagePlus className="action-icon" size={32} />
                                    <span className="action-label">Add Product</span>
                                </button>
                                <button className="action-card glass-card" onClick={() => window.location.href = '/inventory?filter=low-stock'}>
                                    <AlertTriangle className="action-icon" size={32} />
                                    <span className="action-label">Low Stock</span>
                                </button>
                                <button className="action-card glass-card" onClick={() => window.location.href = '/reports'}>
                                    <BarChart3 className="action-icon" size={32} />
                                    <span className="action-label">Reports</span>
                                </button>
                            </div>
                        </section>

                        {/* Recent Prompts */}
                        {recentPrompts.length > 0 && (
                            <section className="dashboard-section">
                                <h2>Recent AI Queries</h2>
                                <div className="recent-prompts">
                                    {recentPrompts.map((item, index) => (
                                        <div key={item.id || index} className="prompt-item glass-panel">
                                            <div className="prompt-text">{item.prompt}</div>
                                            <div className="prompt-meta">
                                                {new Date(item.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
