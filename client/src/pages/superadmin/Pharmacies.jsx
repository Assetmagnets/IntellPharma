import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import Header from '../../components/Header';
import {
    Search,
    Store,
    Download,
    Building2,
    Calendar,
    Mail,
    Users,
    FileText,
    RefreshCw,
    Crown,
    Zap,
    Shield
} from 'lucide-react';
import '../../styles/dashboard.css';

export default function Pharmacies() {
    const [pharmacies, setPharmacies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, active, suspended

    useEffect(() => {
        loadPharmacies();
    }, []);

    const loadPharmacies = async () => {
        try {
            setLoading(true);
            const response = await superAdminAPI.getPharmacies();
            setPharmacies(response.data);
        } catch (error) {
            console.error('Failed to load pharmacies', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (branchId, currentStatus) => {
        const action = currentStatus ? 'suspend' : 'activate';
        if (!window.confirm(`Are you sure you want to ${action} this pharmacy?`)) return;

        try {
            await superAdminAPI.updatePharmacyStatus(branchId, !currentStatus);
            loadPharmacies(); // Refresh list
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const filteredPharmacies = pharmacies.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.owner?.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all'
            ? true
            : filterStatus === 'active' ? p.isActive
                : !p.isActive;
        return matchesSearch && matchesStatus;
    });

    const getPlanIcon = (plan) => {
        switch (plan) {
            case 'PREMIUM': return <Crown size={14} />;
            case 'PRO': return <Zap size={14} />;
            default: return <Shield size={14} />;
        }
    };

    const getPlanGradient = (plan) => {
        switch (plan) {
            case 'PREMIUM': return 'linear-gradient(135deg, #a855f7, #7c3aed)';
            case 'PRO': return 'linear-gradient(135deg, var(--primary-500), var(--primary-700))';
            default: return 'linear-gradient(135deg, #64748b, #475569)';
        }
    };

    if (loading) {
        return (
            <>
                <Header title="Pharmacies" icon={Store} />
                <div className="loading-container">
                    <div className="spinner spinner-lg"></div>
                    <p>Loading pharmacies...</p>
                </div>
            </>
        );
    }

    const exportToCSV = () => {
        const headers = ['Pharmacy Name', 'Owner', 'Email', 'Subscription', 'Users', 'Invoices', 'Status', 'Joined'];
        const rows = filteredPharmacies.map(pharmacy => [
            pharmacy.name,
            pharmacy.owner?.name || 'N/A',
            pharmacy.owner?.email || 'N/A',
            pharmacy.subscription?.plan || 'BASIC',
            pharmacy._count?.users || 0,
            pharmacy._count?.invoices || 0,
            pharmacy.isActive ? 'Active' : 'Suspended',
            new Date(pharmacy.createdAt).toLocaleDateString()
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `pharmacies_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <Header title="Pharmacies" icon={Store}>
                <button
                    className="btn btn-secondary"
                    onClick={loadPharmacies}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
                <button
                    className="btn btn-secondary"
                    onClick={exportToCSV}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Download size={16} />
                    Export
                </button>
            </Header>

            {/* Stats Summary */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div className="stat-icon gradient-primary">
                        <Store size={24} />
                    </div>
                    <div className="stat-value">{pharmacies.length}</div>
                    <div className="stat-label">Total Pharmacies</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                        <Users size={24} />
                    </div>
                    <div className="stat-value">{pharmacies.filter(p => p.isActive).length}</div>
                    <div className="stat-label">Active Branches</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                        <Shield size={24} />
                    </div>
                    <div className="stat-value">{pharmacies.filter(p => !p.isActive).length}</div>
                    <div className="stat-label">Suspended</div>
                </div>
            </div>

            {/* Search and Filters */}
            <section className="dashboard-section">
                <div className="prompt-item glass-panel" style={{
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap'
                }}>
                    <div style={{
                        position: 'relative',
                        flex: '1',
                        minWidth: '250px',
                        maxWidth: '400px'
                    }}>
                        <Search
                            size={18}
                            style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--dark-text-secondary)'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Search by name, email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.625rem 1rem 0.625rem 2.75rem',
                                background: 'var(--dark-surface-2)',
                                border: '1px solid var(--dark-border)',
                                borderRadius: '10px',
                                color: 'var(--dark-text)',
                                fontSize: '0.875rem',
                                outline: 'none',
                                transition: 'all 0.2s ease'
                            }}
                        />
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        background: 'var(--dark-surface-2)',
                        padding: '4px',
                        borderRadius: '10px'
                    }}>
                        {['all', 'active', 'suspended'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    fontSize: '0.8125rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    background: filterStatus === status
                                        ? status === 'active' ? 'var(--success)'
                                            : status === 'suspended' ? 'var(--error)'
                                                : 'var(--primary-500)'
                                        : 'transparent',
                                    color: filterStatus === status
                                        ? 'white'
                                        : 'var(--dark-text-secondary)'
                                }}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pharmacy Cards */}
            <section className="dashboard-section">
                <div className="section-header">
                    <h2>
                        <Building2 size={20} style={{ marginRight: '0.5rem' }} />
                        Registered Pharmacies
                    </h2>
                    <p>{filteredPharmacies.length} pharmacies found</p>
                </div>

                {filteredPharmacies.length === 0 ? (
                    <div className="prompt-item glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
                        <Store size={56} style={{ color: 'var(--dark-text-secondary)', marginBottom: '1rem', opacity: 0.5 }} />
                        <p style={{ color: 'var(--dark-text-secondary)', fontSize: '1rem' }}>No pharmacies found</p>
                        <p style={{ color: 'var(--dark-text-secondary)', fontSize: '0.875rem', opacity: 0.7 }}>Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <div className="recent-prompts">
                        {filteredPharmacies.map((pharmacy) => (
                            <div key={pharmacy.id} className="prompt-item glass-panel" style={{
                                padding: '1.25rem',
                                display: 'grid',
                                gridTemplateColumns: '1fr auto auto auto auto',
                                alignItems: 'center',
                                gap: '1.5rem'
                            }}>
                                {/* Pharmacy Info */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '14px',
                                        background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        flexShrink: 0,
                                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)'
                                    }}>
                                        <Store size={22} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <strong style={{
                                            display: 'block',
                                            color: 'var(--dark-text)',
                                            fontSize: '1rem',
                                            marginBottom: '4px'
                                        }}>
                                            {pharmacy.name}
                                        </strong>
                                        <div style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--dark-text-secondary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            flexWrap: 'wrap'
                                        }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Mail size={12} />
                                                {pharmacy.owner?.email}
                                            </span>
                                            <span style={{
                                                background: 'var(--dark-surface-2)',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.6875rem'
                                            }}>
                                                ID: {pharmacy.id.slice(0, 8)}...
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Subscription Badge */}
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 12px',
                                        borderRadius: '20px',
                                        background: getPlanGradient(pharmacy.subscription?.plan),
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        letterSpacing: '0.5px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                    }}>
                                        {getPlanIcon(pharmacy.subscription?.plan)}
                                        {pharmacy.subscription?.plan || 'BASIC'}
                                    </span>
                                    {pharmacy.subscription?.endDate && (
                                        <span style={{
                                            fontSize: '0.6875rem',
                                            color: 'var(--dark-text-secondary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            <Calendar size={10} />
                                            {new Date(pharmacy.subscription.endDate).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>

                                {/* Usage Stats */}
                                <div style={{
                                    display: 'flex',
                                    gap: '1.5rem'
                                }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px',
                                            color: 'var(--dark-text)',
                                            fontWeight: '700',
                                            fontSize: '1.125rem'
                                        }}>
                                            <Users size={16} style={{ color: 'var(--primary-500)' }} />
                                            {pharmacy._count?.users || 0}
                                        </div>
                                        <span style={{ fontSize: '0.6875rem', color: 'var(--dark-text-secondary)' }}>Users</span>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px',
                                            color: 'var(--dark-text)',
                                            fontWeight: '700',
                                            fontSize: '1.125rem'
                                        }}>
                                            <FileText size={16} style={{ color: 'var(--accent-500)' }} />
                                            {pharmacy._count?.invoices || 0}
                                        </div>
                                        <span style={{ fontSize: '0.6875rem', color: 'var(--dark-text-secondary)' }}>Invoices</span>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div>
                                    {pharmacy.isActive ? (
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 14px',
                                            borderRadius: '20px',
                                            background: 'rgba(34, 197, 94, 0.15)',
                                            color: 'var(--success)',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            border: '1px solid rgba(34, 197, 94, 0.3)'
                                        }}>
                                            <span style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                background: 'var(--success)',
                                                animation: 'pulse 2s infinite'
                                            }}></span>
                                            Active
                                        </span>
                                    ) : (
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 14px',
                                            borderRadius: '20px',
                                            background: 'rgba(239, 68, 68, 0.15)',
                                            color: 'var(--error)',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            border: '1px solid rgba(239, 68, 68, 0.3)'
                                        }}>
                                            <span style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                background: 'var(--error)'
                                            }}></span>
                                            Suspended
                                        </span>
                                    )}
                                </div>

                                {/* Action Button */}
                                <button
                                    onClick={() => handleToggleStatus(pharmacy.id, pharmacy.isActive)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        fontSize: '0.8125rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        background: pharmacy.isActive
                                            ? 'rgba(239, 68, 68, 0.1)'
                                            : 'rgba(34, 197, 94, 0.1)',
                                        color: pharmacy.isActive
                                            ? 'var(--error)'
                                            : 'var(--success)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.background = pharmacy.isActive
                                            ? 'rgba(239, 68, 68, 0.2)'
                                            : 'rgba(34, 197, 94, 0.2)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.background = pharmacy.isActive
                                            ? 'rgba(239, 68, 68, 0.1)'
                                            : 'rgba(34, 197, 94, 0.1)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    {pharmacy.isActive ? 'Suspend' : 'Activate'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.1); }
                }
            `}</style>
        </>
    );
}
