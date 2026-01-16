import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import Header from '../../components/Header';
import {
    Activity,
    Clock,
    User,
    Store,
    AlertCircle,
    RefreshCw
} from 'lucide-react';
import '../../styles/dashboard.css';

export default function ActivityLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await superAdminAPI.getActivityLogs();
            setLogs(response.data);
        } catch (err) {
            console.error('Failed to load activity logs:', err);
            setError('Failed to load activity logs');
        } finally {
            setLoading(false);
        }
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return date.toLocaleString();
    };

    const getActionColor = (action) => {
        const actionLower = action?.toLowerCase() || '';
        if (actionLower.includes('create') || actionLower.includes('add')) return 'var(--success)';
        if (actionLower.includes('delete') || actionLower.includes('remove')) return 'var(--error)';
        if (actionLower.includes('update') || actionLower.includes('edit')) return 'var(--warning)';
        return 'var(--primary-500)';
    };

    if (loading) {
        return (
            <>
                <Header title="Activity Logs" icon={Activity} />
                <div className="loading-container">
                    <div className="spinner spinner-lg"></div>
                    <p>Loading activity logs...</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Header title="Activity Logs" icon={Activity}>
                <button
                    className="btn btn-secondary"
                    onClick={loadLogs}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </Header>

            {error && (
                <div className="alert-banner critical" style={{ marginBottom: '1.5rem' }}>
                    <div className="alert-content">
                        <AlertCircle size={24} />
                        <div>
                            <h3>Error</h3>
                            <p>{error}</p>
                        </div>
                    </div>
                </div>
            )}

            <section className="dashboard-section">
                <div className="section-header">
                    <h2>
                        <Clock size={20} style={{ marginRight: '0.5rem' }} />
                        Last 24 Hours Activity
                    </h2>
                    <p>{logs.length} activities recorded</p>
                </div>

                {logs.length === 0 ? (
                    <div className="prompt-item glass-panel" style={{ textAlign: 'center', padding: '2rem' }}>
                        <Activity size={48} style={{ color: 'var(--dark-text-secondary)', marginBottom: '1rem' }} />
                        <p style={{ color: 'var(--dark-text-secondary)' }}>No activity logs in the last 24 hours</p>
                    </div>
                ) : (
                    <div className="recent-prompts">
                        {logs.map((log) => (
                            <div key={log.id} className="prompt-item glass-panel">
                                <div className="prompt-text" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                    <div style={{
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '12px',
                                        background: getActionColor(log.action),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        flexShrink: 0
                                    }}>
                                        <Activity size={20} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <strong style={{
                                            display: 'block',
                                            marginBottom: '4px',
                                            color: 'var(--dark-text)'
                                        }}>
                                            {log.action}
                                        </strong>
                                        <p style={{
                                            fontSize: '0.8125rem',
                                            color: 'var(--dark-text-secondary)',
                                            margin: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            flexWrap: 'wrap'
                                        }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <User size={12} />
                                                {log.user?.name || 'Unknown'}
                                            </span>
                                            {log.branch && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Store size={12} />
                                                    {log.branch.name}
                                                </span>
                                            )}
                                            {log.entity && (
                                                <span style={{
                                                    background: 'var(--dark-surface-2)',
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem'
                                                }}>
                                                    {log.entity}
                                                </span>
                                            )}
                                        </p>
                                        {log.details && (
                                            <p style={{
                                                fontSize: '0.75rem',
                                                color: 'var(--dark-text-secondary)',
                                                marginTop: '4px',
                                                opacity: 0.8
                                            }}>
                                                {log.details}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="prompt-meta" style={{
                                    textAlign: 'right',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    gap: '4px'
                                }}>
                                    <span>{formatTimeAgo(log.createdAt)}</span>
                                    {log.ipAddress && (
                                        <span style={{ fontSize: '0.6875rem', opacity: 0.6 }}>
                                            IP: {log.ipAddress}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </>
    );
}
