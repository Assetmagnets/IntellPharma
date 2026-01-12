import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, subscriptionAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import {
    Settings as SettingsIcon,
    User,
    Shield,
    Bell,
    Sparkles,
    CreditCard,
    Plus,
    Eye,
    EyeOff
} from 'lucide-react';
import '../styles/settings.css';

export default function Settings() {
    const { user, currentBranch } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [aiSettings, setAiSettings] = useState({
        enableAnalytics: true,
        autoSuggestions: true,
        dailyDigest: false
    });
    const [notificationSettings, setNotificationSettings] = useState({
        emailAlerts: true,
        lowStockAlerts: true,
        expiryAlerts: true,
        salesSummary: true
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || ''
            });
        }
    }, [user]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // In production, this would call an update profile API
            alert('Profile updated successfully!');
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }

        setSaving(true);
        try {
            await authAPI.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            alert('Password changed successfully!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to change password');
        } finally {
            setSaving(false);
        }
    };

    const handleSettingsSave = async () => {
        setSaving(true);
        try {
            // In production, this would call an update settings API
            await new Promise(resolve => setTimeout(resolve, 500));
            alert('Settings saved!');
        } catch (error) {
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-main">
                <Header title="Settings" icon={SettingsIcon} />

                <div className="settings-layout">
                    {/* Settings Navigation */}
                    <nav className="settings-nav glass-panel">
                        <button
                            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            <User size={18} />
                            Profile
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
                            onClick={() => setActiveTab('security')}
                        >
                            <Shield size={18} />
                            Security
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
                            onClick={() => setActiveTab('notifications')}
                        >
                            <Bell size={18} />
                            Notifications
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'ai' ? 'active' : ''}`}
                            onClick={() => setActiveTab('ai')}
                        >
                            <Sparkles size={18} />
                            AI Settings
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'billing' ? 'active' : ''}`}
                            onClick={() => setActiveTab('billing')}
                        >
                            <CreditCard size={18} />
                            Billing
                        </button>
                    </nav>

                    {/* Settings Content */}
                    <div className="settings-content">
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div className="settings-section glass-panel">
                                <h2>Profile Information</h2>
                                <p className="section-desc">Update your personal details</p>

                                <form onSubmit={handleProfileUpdate}>
                                    <div className="form-group">
                                        <label className="form-label">Full Name</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={profileData.name}
                                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Email Address</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            value={profileData.email}
                                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Phone Number</label>
                                        <input
                                            type="tel"
                                            className="form-input"
                                            value={profileData.phone}
                                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                        />
                                    </div>

                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving ? 'Saving...' : 'Update Profile'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="settings-section glass-panel">
                                <h2>Change Password</h2>
                                <p className="section-desc">Keep your account secure</p>

                                <form onSubmit={handlePasswordChange}>
                                    <div className="form-group">
                                        <label className="form-label">Current Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showCurrentPassword ? "text" : "password"}
                                                className="form-input"
                                                value={passwordData.currentPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                required
                                                style={{ paddingRight: '2.5rem' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                style={{
                                                    position: 'absolute',
                                                    right: '0.75rem',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    background: 'none',
                                                    border: 'none',
                                                    color: 'var(--text-secondary)',
                                                    cursor: 'pointer',
                                                    padding: '0',
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">New Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                className="form-input"
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                required
                                                minLength={6}
                                                style={{ paddingRight: '2.5rem' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                style={{
                                                    position: 'absolute',
                                                    right: '0.75rem',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    background: 'none',
                                                    border: 'none',
                                                    color: 'var(--text-secondary)',
                                                    cursor: 'pointer',
                                                    padding: '0',
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Confirm New Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                className="form-input"
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                required
                                                style={{ paddingRight: '2.5rem' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                style={{
                                                    position: 'absolute',
                                                    right: '0.75rem',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    background: 'none',
                                                    border: 'none',
                                                    color: 'var(--text-secondary)',
                                                    cursor: 'pointer',
                                                    padding: '0',
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving ? 'Changing...' : 'Change Password'}
                                    </button>
                                </form>

                                <div className="security-info">
                                    <h3>
                                        <Shield size={18} />
                                        Security Tips
                                    </h3>
                                    <ul>
                                        <li>Use a strong, unique password</li>
                                        <li>Never share your password with anyone</li>
                                        <li>Change your password regularly</li>
                                        <li>Use different passwords for different accounts</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <div className="settings-section glass-panel">
                                <h2>Notification Preferences</h2>
                                <p className="section-desc">Control what alerts you receive</p>

                                <div className="toggle-list">
                                    <div className="toggle-item">
                                        <div className="toggle-info">
                                            <span className="toggle-label">Email Alerts</span>
                                            <span className="toggle-desc">Receive important updates via email</span>
                                        </div>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={notificationSettings.emailAlerts}
                                                onChange={(e) => setNotificationSettings({ ...notificationSettings, emailAlerts: e.target.checked })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>

                                    <div className="toggle-item">
                                        <div className="toggle-info">
                                            <span className="toggle-label">Low Stock Alerts</span>
                                            <span className="toggle-desc">Get notified when products are running low</span>
                                        </div>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={notificationSettings.lowStockAlerts}
                                                onChange={(e) => setNotificationSettings({ ...notificationSettings, lowStockAlerts: e.target.checked })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>

                                    <div className="toggle-item">
                                        <div className="toggle-info">
                                            <span className="toggle-label">Expiry Alerts</span>
                                            <span className="toggle-desc">Get notified about products nearing expiry</span>
                                        </div>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={notificationSettings.expiryAlerts}
                                                onChange={(e) => setNotificationSettings({ ...notificationSettings, expiryAlerts: e.target.checked })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>

                                    <div className="toggle-item">
                                        <div className="toggle-info">
                                            <span className="toggle-label">Daily Sales Summary</span>
                                            <span className="toggle-desc">Receive daily sales report via email</span>
                                        </div>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={notificationSettings.salesSummary}
                                                onChange={(e) => setNotificationSettings({ ...notificationSettings, salesSummary: e.target.checked })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                </div>

                                <button className="btn btn-primary" onClick={handleSettingsSave} disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Preferences'}
                                </button>
                            </div>
                        )}

                        {/* AI Settings Tab */}
                        {activeTab === 'ai' && (
                            <div className="settings-section glass-panel">
                                <h2>AI Features</h2>
                                <p className="section-desc">Configure AI assistant behavior</p>

                                <div className="toggle-list">
                                    <div className="toggle-item">
                                        <div className="toggle-info">
                                            <span className="toggle-label">Enable Analytics AI</span>
                                            <span className="toggle-desc">Allow AI to analyze your pharmacy data</span>
                                        </div>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={aiSettings.enableAnalytics}
                                                onChange={(e) => setAiSettings({ ...aiSettings, enableAnalytics: e.target.checked })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>

                                    <div className="toggle-item">
                                        <div className="toggle-info">
                                            <span className="toggle-label">Auto Suggestions</span>
                                            <span className="toggle-desc">Show AI-powered prompt suggestions</span>
                                        </div>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={aiSettings.autoSuggestions}
                                                onChange={(e) => setAiSettings({ ...aiSettings, autoSuggestions: e.target.checked })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>

                                    <div className="toggle-item">
                                        <div className="toggle-info">
                                            <span className="toggle-label">AI Daily Digest</span>
                                            <span className="toggle-desc">Receive AI-generated daily insights</span>
                                        </div>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={aiSettings.dailyDigest}
                                                onChange={(e) => setAiSettings({ ...aiSettings, dailyDigest: e.target.checked })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                </div>

                                <button className="btn btn-primary" onClick={handleSettingsSave} disabled={saving}>
                                    {saving ? 'Saving...' : 'Save AI Settings'}
                                </button>
                            </div>
                        )}

                        {/* Billing Tab */}
                        {activeTab === 'billing' && (
                            <div className="settings-section glass-panel">
                                <h2>Billing & Invoices</h2>
                                <p className="section-desc">Manage your subscription billing</p>

                                <div className="billing-card">
                                    <div className="billing-header">
                                        <span className="billing-icon">
                                            <CreditCard size={24} />
                                        </span>
                                        <div>
                                            <h3>Current Plan</h3>
                                            <p>Basic - Free</p>
                                        </div>
                                    </div>
                                    <a href="/subscription" className="btn btn-secondary">
                                        Manage Subscription
                                    </a>
                                </div>

                                <div className="billing-info-section">
                                    <h3>Payment Methods</h3>
                                    <p className="text-muted">No payment methods added yet</p>
                                    <button className="btn btn-secondary btn-sm">
                                        <Plus size={16} />
                                        Add Payment Method
                                    </button>
                                </div>

                                <div className="billing-info-section">
                                    <h3>Billing History</h3>
                                    <p className="text-muted">No billing history available</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
