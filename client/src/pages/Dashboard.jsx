import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { billingAPI, inventoryAPI, aiAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StatsCard from '../components/StatsCard';
import AIPromptBox from '../components/AIPromptBox';
import AIAssistant from '../components/AIAssistant';
import {
    Home,
    IndianRupee,
    Package,
    Clock,
    Sparkles,
    PackagePlus,
    AlertTriangle,
    BarChart3,
    ReceiptIndianRupeeIcon
} from 'lucide-react';
import '../styles/dashboard.css';

export default function Dashboard() {
    const { user, currentBranch, canAccessFinancials, branches } = useAuth();
    const [stats, setStats] = useState({
        todaySales: 0,
        invoiceCount: 0,
        lowStockCount: 0,
        expiringCount: 0,
        criticalCount: 0,
        // Yesterday's data for comparison
        yesterdaySales: 0,
        yesterdayInvoices: 0
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

            // Today's date range
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Yesterday's date range
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const [salesRes, yesterdaySalesRes, lowStockRes, expiringRes, criticalRes, promptsRes] = await Promise.all([
                // Today's sales (Start: Today 00:00, End: Today 23:59 via backend logic)
                billingAPI.getSalesSummary(currentBranch.id, {
                    startDate: today.toISOString(),
                    endDate: today.toISOString()
                }).catch(() => ({ data: { totalSales: 0, invoiceCount: 0 } })),
                // Yesterday's sales (Start: Yesterday 00:00, End: Yesterday 23:59 via backend logic)
                billingAPI.getSalesSummary(currentBranch.id, {
                    startDate: yesterday.toISOString(),
                    endDate: yesterday.toISOString()
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
                criticalCount: criticalRes.data.length || 0,
                yesterdaySales: yesterdaySalesRes.data.totalSales || 0,
                yesterdayInvoices: yesterdaySalesRes.data.invoiceCount || 0
            });

            setRecentPrompts(promptsRes.data || []);
        } catch (error) {
            console.error('Dashboard load error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate percentage change
    const calculateChange = (current, previous) => {
        if (previous === 0) {
            return current > 0 ? { value: '+100% from yesterday', type: 'positive' } : { value: 'No change', type: 'neutral' };
        }
        const change = ((current - previous) / previous) * 100;
        const rounded = Math.round(change);
        if (rounded > 0) {
            return { value: `+${rounded}% from yesterday`, type: 'positive' };
        } else if (rounded < 0) {
            return { value: `${rounded}% from yesterday`, type: 'negative' };
        }
        return { value: 'No change', type: 'neutral' };
    };

    // Calculate difference for invoice count
    const calculateDiff = (current, previous) => {
        const diff = current - previous;
        if (diff > 0) {
            return { value: `+${diff} from yesterday`, type: 'positive' };
        } else if (diff < 0) {
            return { value: `${diff} from yesterday`, type: 'negative' };
        }
        return { value: 'Same as yesterday', type: 'neutral' };
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
                                    change={calculateChange(stats.todaySales, stats.yesterdaySales).value}
                                    changeType={calculateChange(stats.todaySales, stats.yesterdaySales).type}
                                />
                            )}

                            <StatsCard
                                icon={ReceiptIndianRupeeIcon}
                                iconBg="gradient-accent"
                                label="Invoices Today"
                                value={stats.invoiceCount}
                                change={calculateDiff(stats.invoiceCount, stats.yesterdayInvoices).value}
                                changeType={calculateDiff(stats.invoiceCount, stats.yesterdayInvoices).type}
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
                                    <ReceiptIndianRupeeIcon className="action-icon" size={32} color='green' />
                                    <span className="action-label">New Invoice</span>
                                </button>
                                <button className="action-card glass-card" onClick={() => window.location.href = '/inventory'}>
                                    <PackagePlus className="action-icon" size={32} />
                                    <span className="action-label">Add Product</span>
                                </button>
                                <button className="action-card glass-card" onClick={() => window.location.href = '/inventory?filter=low-stock'}>
                                    <AlertTriangle className="action-icon" size={32} color='red' />
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
            {/* AI Assistant - Only visible on Dashboard */}
            <AIAssistant isLocked={!branches?.some(b => b.subscription?.aiEnabled)} />
        </div>
    );
}
