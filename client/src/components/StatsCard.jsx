import '../styles/components.css';

export default function StatsCard({ icon: Icon, iconBg, label, value, change, changeType }) {
    return (
        <div className="stat-card animate-slideUp">
            <div className={`stat-icon ${iconBg || ''}`}>
                <Icon size={24} />
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
            {change && (
                <div className={`stat-change ${changeType || ''}`}>
                    {changeType === 'positive' && '↑'}
                    {changeType === 'negative' && '↓'}
                    {change}
                </div>
            )}
        </div>
    );
}
