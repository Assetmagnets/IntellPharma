import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { branchAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import {
    Users as UsersIcon,
    User,
    Trash2,
    Plus,
    X,
    ClipboardList,
    Loader2,
    Eye,
    EyeOff,
    Edit,
    History,
    Activity
} from 'lucide-react';
import '../styles/users.css';

export default function Users() {
    const { currentBranch, hasRole } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'PHARMACIST'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [activityLogs, setActivityLogs] = useState([]);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [activityLoading, setActivityLoading] = useState(false);

    const roles = [
        { id: 'MANAGER', label: 'Manager', desc: 'Full access except owner settings' },
        { id: 'PHARMACIST', label: 'Pharmacist', desc: 'Billing, inventory, AI access' },
        { id: 'BILLING_STAFF', label: 'Billing Staff', desc: 'Billing only' },
        { id: 'INVENTORY_STAFF', label: 'Inventory Staff', desc: 'Inventory management only' }
    ];

    useEffect(() => {
        if (currentBranch) {
            loadUsers();
        }
    }, [currentBranch]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await branchAPI.getUsers(currentBranch?.id);
            setUsers(res.data || []);
        } catch (error) {
            console.error('Load users error:', error);
        } finally {
            setLoading(false);
        }
    };


    const openAddModal = () => {
        setEditingId(null);
        setFormData({
            name: '',
            email: '',
            phone: '',
            password: '',
            role: 'PHARMACIST'
        });
        setShowModal(true);
    };

    const openEditModal = (user, role) => {
        setEditingId(user.id);
        setFormData({
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            password: '', // Password update optional/separate usually
            role: role
        });
        setShowModal(true);
    };

    const openActivityModal = async (userId) => {
        setShowActivityModal(true);
        setActivityLoading(true);
        try {
            const res = await branchAPI.getUserActivity(currentBranch?.id, userId);
            setActivityLogs(res.data || []);
        } catch (error) {
            console.error('Fetch activity error:', error);
            setActivityLogs([]);
        } finally {
            setActivityLoading(false);
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await branchAPI.updateUser(currentBranch?.id, editingId, {
                    name: formData.name,
                    phone: formData.phone,
                    role: formData.role
                });
                alert('User updated successfully!');
            } else {
                await branchAPI.addUser(currentBranch?.id, formData);
                alert('User added successfully!');
            }
            setShowModal(false);
            loadUsers();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to save user');
        }
    };

    const handleRemoveUser = async (userId, userName) => {
        if (!confirm(`Are you sure you want to remove ${userName} from this branch?`)) return;

        try {
            await branchAPI.removeUser(currentBranch?.id, userId, true);
            loadUsers();
            alert('User removed from branch');
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to remove user');
        }
    };

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'OWNER': return 'badge-owner';
            case 'MANAGER': return 'badge-manager';
            case 'PHARMACIST': return 'badge-pharmacist';
            default: return 'badge-staff';
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-main">
                <Header title="User Management" icon={UsersIcon}>
                    {hasRole('OWNER', 'MANAGER') && (
                        <button className="btn btn-primary" onClick={openAddModal}>
                            <Plus size={18} />
                            Add User
                        </button>
                    )}
                </Header>

                {/* Role Overview */}
                <div className="roles-overview glass-panel">
                    <h3>
                        <ClipboardList size={22} />
                        Role Permissions Overview
                    </h3>
                    <div className="roles-grid">
                        {roles.map(role => (
                            <div key={role.id} className="role-card">
                                <span className={`role-badge ${getRoleBadgeClass(role.id)}`}>{role.label}</span>
                                <p>{role.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Users Table */}
                <div className="table-container glass-panel">
                    {loading ? (
                        <div className="loading-container">
                            <Loader2 className="spinner spinner-lg animate-spin" size={32} />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="empty-state">
                            <UsersIcon size={48} className="text-muted" />
                            <h3>No staff members yet</h3>
                            <p>Add users to manage this branch</p>
                            {hasRole('OWNER', 'MANAGER') && (
                                <button className="btn btn-primary" onClick={openAddModal}>
                                    <Plus size={18} />
                                    Add User
                                </button>
                            )}
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Contact</th>
                                    <th>Role</th>
                                    <th>Joined</th>
                                    {hasRole('OWNER', 'MANAGER') && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(branchUser => {
                                    const user = branchUser.user;
                                    return (
                                        <tr key={branchUser.id}>
                                            <td>
                                                <div className="user-cell">
                                                    <div className="user-avatar">
                                                        {user?.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="user-info">
                                                        <span className="user-name">{user?.name}</span>
                                                        <span className="user-email">{user?.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {user?.phone || '-'}
                                            </td>
                                            <td>
                                                <span className={`badge ${getRoleBadgeClass(branchUser.role)}`}>
                                                    {branchUser.role}
                                                </span>
                                            </td>
                                            <td>
                                                {new Date(branchUser.joinedAt).toLocaleDateString()}
                                            </td>
                                            {hasRole('OWNER', 'MANAGER') && (
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="btn btn-ghost btn-sm"
                                                            title="View Activity"
                                                            onClick={() => openActivityModal(user.id)}
                                                        >
                                                            <History size={16} />
                                                        </button>

                                                        {branchUser.role !== 'OWNER' && (
                                                            <>
                                                                <button
                                                                    className="btn btn-ghost btn-sm"
                                                                    title="Edit User"
                                                                    onClick={() => openEditModal(user, branchUser.role)}
                                                                >
                                                                    <Edit size={16} />
                                                                </button>
                                                                <button
                                                                    className="btn btn-ghost btn-sm text-danger"
                                                                    title="Remove User"
                                                                    onClick={() => handleRemoveUser(user.id, user.name)}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Add User Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal user-modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{editingId ? 'Edit User' : 'Add New User'}</h2>
                                <button className="modal-close" onClick={() => setShowModal(false)}>
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="user-form">
                                <div className="form-group">
                                    <label className="form-label">Full Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Staff member's name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            placeholder="user@pharmacy.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                            disabled={!!editingId} // Cannot change email
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phone</label>
                                        <input
                                            type="tel"
                                            className="form-input"
                                            placeholder="+91 XXXXXXXXXX"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {!editingId && (
                                    <div className="form-group">
                                        <label className="form-label">Temporary Password *</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className="form-input"
                                                placeholder="User will change this on first login"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                required
                                                minLength={6}
                                                style={{ paddingRight: '2.5rem' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
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
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Role *</label>
                                    <div className="role-selector">
                                        {roles.map(role => (
                                            <label
                                                key={role.id}
                                                className={`role-option ${formData.role === role.id ? 'selected' : ''}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="role"
                                                    value={role.id}
                                                    checked={formData.role === role.id}
                                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                                />
                                                <span className="role-label">{role.label}</span>
                                                <span className="role-desc">{role.desc}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingId ? 'Save Changes' : 'Add User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Activity History Modal */}
                {showActivityModal && (
                    <div className="modal-overlay" onClick={() => setShowActivityModal(false)}>
                        <div className="modal activity-modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>
                                    <Activity size={20} />
                                    User Activity History
                                </h2>
                                <button className="modal-close" onClick={() => setShowActivityModal(false)}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="activity-list-container">
                                {activityLoading ? (
                                    <div className="loading-container p-4">
                                        <Loader2 className="spinner animate-spin" />
                                    </div>
                                ) : activityLogs.length === 0 ? (
                                    <div className="empty-state p-4">
                                        <p>No recent activity found.</p>
                                    </div>
                                ) : (
                                    <ul className="activity-list">
                                        {activityLogs.map((log) => (
                                            <li key={log.id} className="activity-item">
                                                <div className="activity-icon">
                                                    <div className="dot"></div>
                                                </div>
                                                <div className="activity-content">
                                                    <p className="activity-action">{log.action}</p>
                                                    <p className="activity-details">{log.details}</p>
                                                    <span className="activity-time">
                                                        {new Date(log.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
