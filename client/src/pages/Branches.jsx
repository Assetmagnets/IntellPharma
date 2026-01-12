import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { branchAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import {
    Store,
    Building2,
    MapPin,
    Phone,
    Mail,
    Receipt,
    Pencil,
    Plus,
    X,
    Loader2
} from 'lucide-react';
import '../styles/branches.css';

export default function Branches() {
    const { user, currentBranch, branches: userBranches, switchBranch } = useAuth();
    const navigate = useNavigate();
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        gstNumber: '',
        licenseNumber: ''
    });

    useEffect(() => {
        loadBranches();
    }, []);

    const loadBranches = async () => {
        setLoading(true);
        try {
            const res = await branchAPI.getAll();
            setBranches(res.data || []);
        } catch (error) {
            console.error('Load branches error:', error);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditingBranch(null);
        setFormData({
            name: '',
            address: '',
            phone: '',
            email: '',
            gstNumber: '',
            licenseNumber: ''
        });
        setShowModal(true);
    };

    const openEditModal = (branch) => {
        setEditingBranch(branch);
        setFormData({
            name: branch.name || '',
            address: branch.address || '',
            phone: branch.phone || '',
            email: branch.email || '',
            gstNumber: branch.gstNumber || '',
            licenseNumber: branch.licenseNumber || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBranch) {
                await branchAPI.update(editingBranch.id, formData);
            } else {
                await branchAPI.create(formData);
            }
            setShowModal(false);
            loadBranches();
        } catch (error) {
            if (error.response?.status === 403 && error.response.data.upgradeURL) {
                if (confirm(error.response.data.message)) {
                    navigate('/subscription');
                }
            } else if (error.response?.status === 403) {
                // Generic subscription limit catch
                if (confirm('Branch limit reached. Would you like to upgrade your plan?')) {
                    navigate('/subscription');
                }
            } else {
                alert(error.response?.data?.error || 'Failed to save branch');
            }
        }
    };



    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-main">
                <Header title="Branches" icon={Store}>
                    <button className="btn btn-primary" onClick={openAddModal}>
                        <Plus size={18} />
                        Add Branch
                    </button>
                </Header>

                {loading ? (
                    <div className="loading-container">
                        <Loader2 className="spinner spinner-lg animate-spin" size={32} />
                    </div>
                ) : branches.length === 0 ? (
                    <div className="empty-state glass-panel">
                        <Store size={48} className="text-muted" />
                        <h3>No branches found</h3>
                        <p>Add your first branch to get started</p>
                        <button className="btn btn-primary" onClick={openAddModal}>
                            <Plus size={18} />
                            Add Branch
                        </button>
                    </div>
                ) : (
                    <div className="branches-grid">
                        {branches.map(branch => (
                            <div key={branch.id} className="branch-card glass-panel">
                                <div className="branch-header">
                                    <div className="branch-icon">
                                        <Building2 size={24} />
                                    </div>
                                    <div className="branch-info">
                                        <h3>{branch.name}</h3>
                                        <span className={`status-badge ${branch.isActive ? 'active' : 'inactive'}`}>
                                            {branch.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>

                                <div className="branch-details">
                                    {branch.address && (
                                        <div className="detail-row">
                                            <span className="detail-icon">
                                                <MapPin size={16} />
                                            </span>
                                            <span>{branch.address}</span>
                                        </div>
                                    )}
                                    {branch.phone && (
                                        <div className="detail-row">
                                            <span className="detail-icon">
                                                <Phone size={16} />
                                            </span>
                                            <span>{branch.phone}</span>
                                        </div>
                                    )}
                                    {branch.email && (
                                        <div className="detail-row">
                                            <span className="detail-icon">
                                                <Mail size={16} />
                                            </span>
                                            <span>{branch.email}</span>
                                        </div>
                                    )}
                                    {branch.gstNumber && (
                                        <div className="detail-row">
                                            <span className="detail-icon">
                                                <Receipt size={16} />
                                            </span>
                                            <span>GST: {branch.gstNumber}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="branch-stats">
                                    <div className="stat">
                                        <span className="stat-value">{branch._count?.products || 0}</span>
                                        <span className="stat-label">Products</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-value">{branch._count?.users || 0}</span>
                                        <span className="stat-label">Staff</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-value">{branch._count?.invoices || 0}</span>
                                        <span className="stat-label">Invoices</span>
                                    </div>
                                </div>

                                <div className="branch-actions">

                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => openEditModal(branch)}
                                    >
                                        <Pencil size={16} />
                                        Edit
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add/Edit Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal branch-modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{editingBranch ? 'Edit Branch' : 'Add New Branch'}</h2>
                                <button className="modal-close" onClick={() => setShowModal(false)}>
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="branch-form">
                                <div className="form-group">
                                    <label className="form-label">Branch Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., Main Store, Downtown Branch"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Address</label>
                                    <textarea
                                        className="form-input"
                                        rows="2"
                                        placeholder="Full address of the branch"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>

                                <div className="form-row">
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
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            placeholder="branch@pharmacy.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">GST Number</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="22XXXXX1234X1Z5"
                                            value={formData.gstNumber}
                                            onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Drug License Number</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="DL-XX-XXXXXX"
                                            value={formData.licenseNumber}
                                            onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingBranch ? 'Update Branch' : 'Create Branch'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
