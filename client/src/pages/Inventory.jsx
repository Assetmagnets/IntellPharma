import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { inventoryAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import {
    Package,
    Search,
    AlertTriangle,
    Clock,
    PackageOpen,
    Loader2,
    Pencil,
    Trash2,
    Plus,
    X,
    List
} from 'lucide-react';
import '../styles/inventory.css';

export default function Inventory() {
    const { currentBranch, hasRole } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all'); // all, low-stock, expiring
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        genericName: '',
        manufacturer: '',
        barcode: '',
        batchNumber: '',
        expiryDate: '',
        mrp: '',
        purchasePrice: '',
        gstRate: '12',
        hsnCode: '',
        quantity: '',
        minStock: '10',
        unit: 'Strip',
        tabletsPerStrip: '10'
    });

    useEffect(() => {
        if (currentBranch) {
            loadProducts();
        }
    }, [currentBranch, filter]);

    const loadProducts = async () => {
        setLoading(true);
        try {
            let res;
            // Use specific endpoints for filters to ensure correct logic (e.g. SQL comparison for low stock)
            if (filter === 'low-stock') {
                res = await inventoryAPI.getLowStock(currentBranch?.id);
                // Apply client-side search for these specific endpoints as they don't support backend search params yet
                if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    res.data = res.data.filter(p =>
                        p.name.toLowerCase().includes(query) ||
                        p.barcode?.includes(query) ||
                        p.genericName?.toLowerCase().includes(query)
                    );
                }
            } else if (filter === 'expiring') {
                res = await inventoryAPI.getExpiring(currentBranch?.id);
                if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    res.data = res.data.filter(p =>
                        p.name.toLowerCase().includes(query) ||
                        p.barcode?.includes(query) ||
                        p.genericName?.toLowerCase().includes(query)
                    );
                }
            } else {
                // Default 'all' filter uses the standard search endpoint
                const params = { search: searchQuery };
                res = await inventoryAPI.getProducts(currentBranch?.id, params);
            }

            setProducts(res.data || []);
        } catch (error) {
            console.error('Load products error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        // Debounce search
        setTimeout(() => loadProducts(), 300);
    };

    const openAddModal = () => {
        setEditingProduct(null);
        setFormData({
            name: '',
            genericName: '',
            manufacturer: '',
            barcode: '',
            batchNumber: '',
            expiryDate: '',
            mrp: '',
            purchasePrice: '',
            gstRate: '12',
            hsnCode: '',
            quantity: '',
            minStock: '10',
            unit: 'Strip',
            tabletsPerStrip: '10'
        });
        setShowModal(true);
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name || '',
            genericName: product.genericName || '',
            manufacturer: product.manufacturer || '',
            barcode: product.barcode || '',
            batchNumber: product.batchNumber || '',
            expiryDate: product.expiryDate ? product.expiryDate.split('T')[0] : '',
            mrp: product.mrp || '',
            purchasePrice: product.purchasePrice || '',
            gstRate: product.gstRate || '12',
            hsnCode: product.hsnCode || '',
            quantity: product.quantity || '',
            minStock: product.minStock || '10',
            unit: product.unit || 'Strip',
            tabletsPerStrip: product.tabletsPerStrip || '10'
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await inventoryAPI.updateProduct(currentBranch?.id, editingProduct.id, formData);
            } else {
                await inventoryAPI.createProduct(currentBranch?.id, formData);
            }
            setShowModal(false);
            loadProducts();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to save product');
        }
    };

    const handleDelete = async (productId) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await inventoryAPI.deleteProduct(currentBranch?.id, productId);
            loadProducts();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to delete product');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const formatStockDisplay = (product) => {
        if (product.unit === 'Strip' || product.unit === 'Box' || product.tabletsPerStrip > 1) {
            const total = Number(product.quantity);
            const strips = Math.floor(total);
            const looseFraction = total - strips;
            // E.g. 0.5 * 10 = 5 tabs. Round to handle floating point errors
            const looseTabs = Math.round(looseFraction * (product.tabletsPerStrip || 10));

            if (looseTabs === 0) return `${strips} ${product.unit}`;
            return `${strips} ${product.unit}, ${looseTabs} Tabs`;
        }
        return `${Number(product.quantity)} ${product.unit}`;
    };

    const getStockStatus = (product) => {
        if (product.quantity <= 0) return { class: 'out', label: 'Out of Stock' };
        if (product.quantity <= product.minStock) return { class: 'low', label: 'Low Stock' };
        return { class: 'ok', label: 'In Stock' };
    };

    const getExpiryStatus = (expiryDate) => {
        if (!expiryDate) return null;
        const expiry = new Date(expiryDate);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) return { class: 'expired', label: 'Expired' };
        if (daysUntilExpiry <= 30) return { class: 'expiring', label: `${daysUntilExpiry}d` };
        return null;
    };

    const canEdit = hasRole('OWNER', 'MANAGER', 'INVENTORY_STAFF');

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-main">
                <Header title="Inventory" icon={Package} />

                {/* Filters & Search */}
                <div className="inventory-toolbar glass-panel">
                    <div className="search-box">
                        <Search className="search-icon" size={18} />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search by name, barcode, manufacturer..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>

                    <div className="filter-tabs">
                        <button
                            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            <List size={16} />
                            All Products
                        </button>
                        <button
                            className={`filter-tab ${filter === 'low-stock' ? 'active' : ''}`}
                            onClick={() => setFilter('low-stock')}
                        >
                            <AlertTriangle size={16} />
                            Low Stock
                        </button>
                        <button
                            className={`filter-tab ${filter === 'expiring' ? 'active' : ''}`}
                            onClick={() => setFilter('expiring')}
                        >
                            <Clock size={16} />
                            Expiring Soon
                        </button>
                    </div>

                    {products.length > 0 && canEdit && (
                        <button className="btn btn-primary ml-auto" onClick={openAddModal}>
                            <Plus size={18} />
                            Add Product
                        </button>
                    )}
                </div>

                {/* Products Table */}
                <div className="table-container glass-panel">
                    {loading ? (
                        <div className="loading-container">
                            <Loader2 className="spinner spinner-lg animate-spin" size={32} />
                        </div>
                    ) : products.length === 0 ? (
                        <div className="empty-state">
                            <PackageOpen size={48} className="text-muted" />
                            <h3>No products found</h3>
                            <p>Add your first product to get started</p>
                            {canEdit && (
                                <button className="btn btn-primary" onClick={openAddModal}>
                                    <Plus size={18} />
                                    Add Product
                                </button>
                            )}
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Barcode</th>
                                    <th>Stock</th>
                                    <th>MRP</th>
                                    <th>GST</th>
                                    <th>Expiry</th>
                                    <th>Status</th>
                                    {canEdit && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(product => {
                                    const stockStatus = getStockStatus(product);
                                    const expiryStatus = getExpiryStatus(product.expiryDate);

                                    return (
                                        <tr key={product.id}>
                                            <td>
                                                <div className="product-cell">
                                                    <span className="product-name">{product.name}</span>
                                                    <span className="product-detail">
                                                        {product.genericName} | {product.manufacturer}
                                                    </span>
                                                </div>
                                            </td>
                                            <td><code>{product.barcode || '-'}</code></td>
                                            <td>
                                                <span className="stock-qty">{formatStockDisplay(product)}</span>
                                            </td>
                                            <td>{formatCurrency(product.mrp)}</td>
                                            <td>{product.gstRate}%</td>
                                            <td>
                                                {product.expiryDate
                                                    ? new Date(product.expiryDate).toLocaleDateString()
                                                    : '-'
                                                }
                                            </td>
                                            <td>
                                                <span className={`badge badge-${stockStatus.class}`}>
                                                    {stockStatus.label}
                                                </span>
                                                {expiryStatus && (
                                                    <span className={`badge badge-${expiryStatus.class} ml-1`}>
                                                        {expiryStatus.label}
                                                    </span>
                                                )}
                                            </td>
                                            {canEdit && (
                                                <td>
                                                    <div className="action-btns">
                                                        <button
                                                            className="btn btn-ghost btn-sm"
                                                            onClick={() => openEditModal(product)}
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button
                                                            className="btn btn-ghost btn-sm"
                                                            onClick={() => handleDelete(product.id)}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
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

                {/* Add/Edit Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal product-modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
                                <button className="modal-close" onClick={() => setShowModal(false)}>
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="product-form">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Product Name *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Generic Name</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.genericName}
                                            onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Manufacturer</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.manufacturer}
                                            onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Barcode</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.barcode}
                                            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Batch Number</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.batchNumber}
                                            onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Expiry Date</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={formData.expiryDate}
                                            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">MRP *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-input"
                                            value={formData.mrp}
                                            onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Purchase Price *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-input"
                                            value={formData.purchasePrice}
                                            onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">GST Rate (%)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-input"
                                            value={formData.gstRate}
                                            onChange={(e) => setFormData({ ...formData, gstRate: e.target.value })}
                                            placeholder="Enter GST %"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">HSN Code</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.hsnCode}
                                            onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Quantity *</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.quantity}
                                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Min Stock Level</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.minStock}
                                            onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Unit</label>
                                        <select
                                            className="form-input"
                                            value={formData.unit}
                                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        >
                                            <option value="Pcs">Pcs</option>
                                            <option value="Strip">Strip</option>
                                            <option value="Bottle">Bottle</option>
                                            <option value="Box">Box</option>
                                            <option value="Sachet">Sachet</option>
                                        </select>
                                    </div>

                                    {/* New Tablets Per Strip Field */}
                                    {(formData.unit === 'Strip' || formData.unit === 'Box') && (
                                        <div className="form-group">
                                            <label className="form-label">Tablets per Unit</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={formData.tabletsPerStrip}
                                                onChange={(e) => setFormData({ ...formData, tabletsPerStrip: e.target.value })}
                                                placeholder="Default: 10"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingProduct ? 'Update Product' : 'Add Product'}
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
