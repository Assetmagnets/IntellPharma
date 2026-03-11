import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { rackingAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import {
    LayoutGrid, Search, AlertTriangle, Plus, Edit2, Trash2,
    MapPin, Package, ChevronRight, X, Loader2, Sparkles,
    Thermometer, Shield, Box, Bell, Info, Clock, List,
    PackageOpen, Printer, ToggleLeft, ToggleRight, Zap, ArrowRight
} from 'lucide-react';
import '../styles/racking.css';

export default function RackManagement() {
    const { currentBranch, user } = useAuth();
    const [activeTab, setActiveTab] = useState('map');
    const [racks, setRacks] = useState([]);
    const [rackMap, setRackMap] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRack, setEditingRack] = useState(null);
    const [tooltip, setTooltip] = useState(null);
    const [highlightRack, setHighlightRack] = useState(null);
    const [rackingEnabled, setRackingEnabled] = useState(false);
    const [backfilling, setBackfilling] = useState(false);
    const searchTimeout = useRef(null);

    // Load toggle state from database
    useEffect(() => {
        if (currentBranch) {
            (async () => {
                try {
                    const statusRes = await rackingAPI.getRackingStatus(currentBranch.id);
                    const isEnabled = statusRes.data.enabled;
                    setRackingEnabled(isEnabled);
                    if (isEnabled) loadData();
                    else setLoading(false);
                } catch (err) {
                    console.error('Failed to load racking status:', err);
                    setLoading(false);
                }
            })();
        }
    }, [currentBranch]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [racksRes, mapRes, alertsRes] = await Promise.all([
                rackingAPI.getRacks(currentBranch.id),
                rackingAPI.getRackMap(currentBranch.id),
                rackingAPI.getAlerts(currentBranch.id)
            ]);
            setRacks(racksRes.data);
            setRackMap(mapRes.data);
            setAlerts(alertsRes.data);
        } catch (error) {
            console.error('Error loading rack data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEnableRacking = async () => {
        setBackfilling(true);
        try {
            // Backfill existing products + enable in DB
            const res = await rackingAPI.backfillProducts(currentBranch.id);
            console.log('Backfill result:', res.data);

            setRackingEnabled(true);
            loadData();

            if (res.data.assigned > 0) {
                alert(`✅ Smart Racking enabled! ${res.data.assigned} medicine(s) have been organized into shelves.`);
            } else {
                alert('✅ Smart Racking enabled! All new medicines will be automatically organized.');
            }
        } catch (error) {
            console.error('Enable racking error:', error);
            alert('Failed to enable Smart Racking. Please try again.');
        } finally {
            setBackfilling(false);
        }
    };

    const handleDisableRacking = async () => {
        if (!confirm('Are you sure? This will stop auto-assigning medicines to racks. Your existing data is still saved.')) return;
        try {
            await rackingAPI.toggleRacking(currentBranch.id, false);
            setRackingEnabled(false);
            setRackMap([]);
            setRacks([]);
            setAlerts([]);
            setSearchQuery('');
            setSearchResults([]);
        } catch (error) {
            console.error('Disable racking error:', error);
        }
    };

    const handleSearch = (value) => {
        setSearchQuery(value);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        if (!value.trim()) { setSearchResults([]); setHighlightRack(null); return; }

        searchTimeout.current = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const res = await rackingAPI.findProduct(currentBranch.id, value);
                setSearchResults(res.data);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setSearchLoading(false);
            }
        }, 300);
    };

    const handleHighlightRack = (rackId) => {
        setHighlightRack(rackId);
        setActiveTab('map');
        setTimeout(() => setHighlightRack(null), 3000);
    };

    const handleSaveRack = async (formData) => {
        try {
            if (editingRack) {
                await rackingAPI.updateRack(currentBranch.id, editingRack.id, formData);
            } else {
                await rackingAPI.createRack(currentBranch.id, formData);
            }
            setShowModal(false);
            setEditingRack(null);
            loadData();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to save rack');
        }
    };

    const handleDeleteRack = async (rackId) => {
        if (!confirm('Are you sure you want to delete this rack?')) return;
        try {
            await rackingAPI.deleteRack(currentBranch.id, rackId);
            loadData();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to delete rack');
        }
    };

    const handlePrintShelves = () => {
        window.print();
    };

    const storageIcon = (type) => {
        const icons = {
            REFRIGERATED: <Thermometer size={14} />,
            CONTROLLED: <Shield size={14} />,
            HAZARDOUS: <AlertTriangle size={14} />,
            BULK: <Box size={14} />
        };
        return icons[type] || <Package size={14} />;
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-main">
                <Header title="Smart Racking" icon={LayoutGrid} />

                {/* === INTRO SCREEN (when disabled) === */}
                {!rackingEnabled ? (
                    <div className="racking-intro glass-panel">
                        <div className="racking-intro-icon">
                            <LayoutGrid size={56} />
                        </div>
                        <h2>Smart Racking System</h2>
                        <p className="racking-intro-subtitle">
                            Organize your medicines on shelves — just like a real pharmacy!
                        </p>

                        <div className="racking-intro-features">
                            <div className="racking-intro-feature">
                                <div className="feature-icon"><Zap size={22} /></div>
                                <div>
                                    <strong>Auto-Organize</strong>
                                    <p>New medicines are automatically placed on the best shelf</p>
                                </div>
                            </div>
                            <div className="racking-intro-feature">
                                <div className="feature-icon"><Search size={22} /></div>
                                <div>
                                    <strong>Quick Find</strong>
                                    <p>Search any medicine → instantly see which rack & shelf it's on</p>
                                </div>
                            </div>
                            <div className="racking-intro-feature">
                                <div className="feature-icon"><Printer size={22} /></div>
                                <div>
                                    <strong>Print Labels</strong>
                                    <p>Print shelf labels and stick them on your real shelves</p>
                                </div>
                            </div>
                        </div>

                        <div className="racking-intro-how">
                            <h3>How does it work?</h3>
                            <div className="racking-intro-steps">
                                <div className="intro-step">
                                    <span className="step-num">1</span>
                                    <span>You add a medicine from Inventory</span>
                                </div>
                                <ArrowRight size={18} className="step-arrow" />
                                <div className="intro-step">
                                    <span className="step-num">2</span>
                                    <span>System places it on a shelf automatically</span>
                                </div>
                                <ArrowRight size={18} className="step-arrow" />
                                <div className="intro-step">
                                    <span className="step-num">3</span>
                                    <span>Staff can see the location while billing</span>
                                </div>
                            </div>
                        </div>

                        <button
                            className="btn btn-primary btn-lg racking-enable-btn"
                            onClick={handleEnableRacking}
                            disabled={backfilling}
                        >
                            {backfilling ? (
                                <><Loader2 className="spinner spinner-sm animate-spin" size={20} /> Setting up shelves...</>
                            ) : (
                                <><ToggleRight size={22} /> Enable Smart Racking</>
                            )}
                        </button>
                        <p className="racking-intro-note">
                            Already have medicines? No problem — they'll be auto-organized when you enable.
                        </p>
                    </div>
                ) : (
                    /* === MAIN RACKING UI (when enabled) === */
                    <>
                        {/* Toolbar */}
                        <div className="racking-toolbar glass-panel">
                            <div className="search-box">
                                <Search size={18} className="search-icon" />
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Search medicine name, salt, barcode..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                />
                                {searchLoading && <Loader2 className="spinner spinner-sm animate-spin" size={16} style={{ position: 'absolute', right: '2.5rem', top: '50%', transform: 'translateY(-50%)' }} />}
                                {searchQuery && !searchLoading && (
                                    <button onClick={() => { setSearchQuery(''); setSearchResults([]); setHighlightRack(null); }}
                                        style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--dark-text-secondary)' }}>
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            <div className="filter-tabs">
                                <button
                                    className={`filter-tab ${activeTab === 'map' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('map')}
                                >
                                    <LayoutGrid size={16} />
                                    Rack Map
                                </button>
                                <button
                                    className={`filter-tab ${activeTab === 'alerts' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('alerts')}
                                >
                                    <Bell size={16} />
                                    Alerts {alerts.length > 0 && <span className="badge badge-low" style={{ marginLeft: '0.25rem', fontSize: '0.7rem' }}>{alerts.length}</span>}
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                                <button className="btn btn-secondary" onClick={handlePrintShelves} title="Print shelf labels">
                                    <Printer size={18} />
                                    Print
                                </button>
                                <button className="btn btn-primary" onClick={() => { setEditingRack(null); setShowModal(true); }}>
                                    <Plus size={18} />
                                    Add Rack
                                </button>
                                <button
                                    className="btn btn-ghost"
                                    onClick={handleDisableRacking}
                                    title="Disable Smart Racking"
                                    style={{ color: 'var(--dark-text-secondary)' }}
                                >
                                    <ToggleLeft size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="table-container glass-panel" style={{ padding: '1.25rem' }}>
                            {loading ? (
                                <div className="loading-container">
                                    <Loader2 className="spinner spinner-lg animate-spin" size={32} />
                                </div>
                            ) : searchQuery ? (
                                /* === SEARCH RESULTS (shown when user types in search bar) === */
                                <div className="animate-fadeIn">
                                    {searchResults.length === 0 && !searchLoading && (
                                        <div className="empty-state">
                                            <Search size={48} className="text-muted" />
                                            <h3>No results found</h3>
                                            <p>Try a different name, salt, or barcode</p>
                                        </div>
                                    )}

                                    {searchResults.map(product => (
                                        <div key={product.id} className="search-result-item">
                                            <div className="search-result-info">
                                                <h4>{product.name}</h4>
                                                <p>
                                                    {product.genericName || product.manufacturer || '—'}
                                                    &nbsp;•&nbsp;Qty: {parseFloat(product.quantity)}
                                                </p>
                                            </div>
                                            <div className="search-result-locations">
                                                {product.locations && product.locations.length > 0 ? (
                                                    product.locations.map(loc => (
                                                        <button
                                                            key={loc.rack.id + loc.shelf.id}
                                                            className="search-result-location"
                                                            onClick={() => handleHighlightRack(loc.rack.id)}
                                                        >
                                                            <MapPin size={12} />
                                                            {loc.rack.name} <ChevronRight size={10} /> {loc.shelf.name}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <span className="search-result-location not-assigned">
                                                        <MapPin size={12} /> Not Assigned
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <>
                                    {/* === RACK MAP TAB === */}
                                    {activeTab === 'map' && (
                                        <>
                                            {rackMap.length === 0 ? (
                                                <div className="empty-state">
                                                    <PackageOpen size={48} className="text-muted" />
                                                    <h3>No racks created yet</h3>
                                                    <p>Add your first rack to start organizing inventory</p>
                                                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                                                        <Plus size={18} />
                                                        Add Rack
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="rack-map-grid">
                                                    {rackMap.map(rack => {
                                                        // Calculate column count: max items across shelves or minimum 4
                                                        const maxItems = Math.max(...rack.shelves.map(s => s.items.length), 1);
                                                        const columnCount = Math.max(maxItems, 4);
                                                        const columnLetters = Array.from({ length: columnCount }, (_, i) => String.fromCharCode(65 + i));

                                                        return (
                                                            <div key={rack.id} className={`rack-shelf-unit ${highlightRack === rack.id ? 'rack-highlight' : ''}`}>
                                                                {/* Shelf Header (wood-style) */}
                                                                <div className="rack-shelf-header">
                                                                    <div>
                                                                        <div className="rack-shelf-header-info">
                                                                            <h3>
                                                                                {storageIcon(rack.type)}
                                                                                {rack.name}
                                                                                <span className={`rack-type-badge ${rack.type}`}>{rack.type}</span>
                                                                            </h3>
                                                                        </div>
                                                                        {rack.description && <div className="rack-shelf-desc">{rack.description}</div>}
                                                                    </div>
                                                                    <div className="rack-shelf-header-actions">
                                                                        <button title="Edit" onClick={() => {
                                                                            const full = racks.find(r => r.id === rack.id);
                                                                            setEditingRack(full || rack);
                                                                            setShowModal(true);
                                                                        }}><Edit2 size={14} /></button>
                                                                        <button title="Delete" onClick={() => handleDeleteRack(rack.id)}><Trash2 size={14} /></button>
                                                                    </div>
                                                                </div>

                                                                {/* Stats bar */}
                                                                <div className="rack-shelf-stats">
                                                                    <span className="rack-stat-chip items">
                                                                        <Package size={11} /> {rack.stats.totalItems} items
                                                                    </span>
                                                                    {rack.stats.nearExpiryCount > 0 && (
                                                                        <span className="rack-stat-chip expiry">
                                                                            <Clock size={11} /> {rack.stats.nearExpiryCount} expiring
                                                                        </span>
                                                                    )}
                                                                    {rack.stats.lowStockCount > 0 && (
                                                                        <span className="rack-stat-chip low-stock">
                                                                            <AlertTriangle size={11} /> {rack.stats.lowStockCount} low
                                                                        </span>
                                                                    )}
                                                                    <div className="rack-util-mini">
                                                                        <div className="rack-util-mini-bar">
                                                                            <div
                                                                                className={`rack-util-mini-fill ${rack.stats.utilization < 60 ? 'low' : rack.stats.utilization < 85 ? 'medium' : 'high'}`}
                                                                                style={{ width: `${rack.stats.utilization}%` }}
                                                                            />
                                                                        </div>
                                                                        {rack.stats.utilization}%
                                                                    </div>
                                                                </div>

                                                                {/* Column Headers (A, B, C, D...) */}
                                                                <div className="shelf-column-headers" style={{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }}>
                                                                    {columnLetters.map(letter => (
                                                                        <div key={letter} className="shelf-column-header">{letter}</div>
                                                                    ))}
                                                                </div>

                                                                {/* Shelf Rows */}
                                                                <div className="shelf-grid">
                                                                    {rack.shelves.map((shelf, shelfIdx) => (
                                                                        <div
                                                                            key={shelf.id}
                                                                            className="shelf-grid-row"
                                                                            style={{ gridTemplateColumns: `54px repeat(${columnCount}, 1fr)` }}
                                                                        >
                                                                            {/* Row label */}
                                                                            <div className="shelf-row-label">{shelfIdx + 1}</div>

                                                                            {/* Cells */}
                                                                            {columnLetters.map((letter, colIdx) => {
                                                                                const item = shelf.items[colIdx];
                                                                                return (
                                                                                    <div key={letter} className="shelf-cell">
                                                                                        {item ? (
                                                                                            <div
                                                                                                className={`medicine-box ${item.isNearExpiry ? 'status-expiring' : item.isLowStock ? 'status-low-stock' : 'status-ok'}`}
                                                                                                onMouseEnter={(e) => setTooltip({
                                                                                                    x: e.clientX + 12,
                                                                                                    y: e.clientY - 80,
                                                                                                    name: item.productName,
                                                                                                    qty: item.quantity,
                                                                                                    bin: item.binLabel
                                                                                                })}
                                                                                                onMouseLeave={() => setTooltip(null)}
                                                                                            >
                                                                                                <span className="medicine-box-name">{item.productName}</span>
                                                                                                <div className="medicine-box-meta">
                                                                                                    <span className="medicine-box-qty">Qty: {parseFloat(item.quantity)}</span>
                                                                                                    {item.binLabel && <span className="medicine-box-bin">{item.binLabel}</span>}
                                                                                                </div>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <div className="shelf-cell-empty">—</div>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* === ALERTS TAB === */}
                                    {activeTab === 'alerts' && (
                                        <div className="animate-fadeIn">
                                            {alerts.length === 0 ? (
                                                <div className="empty-state">
                                                    <Bell size={48} className="text-muted" />
                                                    <h3>All clear!</h3>
                                                    <p>No racking alerts right now</p>
                                                </div>
                                            ) : (
                                                alerts.map((alert, idx) => (
                                                    <div key={idx} className={`racking-alert-item ${alert.severity}`}>
                                                        <div className="racking-alert-icon">
                                                            {alert.severity === 'critical' ? <AlertTriangle size={18} /> :
                                                                alert.severity === 'warning' ? <AlertTriangle size={18} /> :
                                                                    <Info size={18} />}
                                                        </div>
                                                        <span className="racking-alert-message">{alert.message}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Create/Edit Modal */}
                        {showModal && (
                            <RackModal
                                rack={editingRack}
                                onSave={handleSaveRack}
                                onClose={() => { setShowModal(false); setEditingRack(null); }}
                            />
                        )}
                    </>
                )}

                {/* === PRINT-ONLY: Rack Bin Labels (Stickers) === */}
                {rackingEnabled && rackMap.length > 0 && <div className="print-only-labels">
                    {rackMap.map(rack => {
                        // Calculate column count same as display grid
                        const maxItems = Math.max(...rack.shelves.map(s => s.items.length), 0);
                        const columnCount = Math.max(maxItems, 4);
                        const columnLetters = Array.from({ length: columnCount }, (_, i) => String.fromCharCode(65 + i));

                        return (
                            <div key={rack.id} className="print-rack-section">
                                <h2 className="print-rack-title">
                                    {rack.name} <span style={{ fontSize: '12pt', fontWeight: 'normal' }}>({rack.type})</span>
                                </h2>
                                <div className="print-label-grid">
                                    {rack.shelves.map((shelf, shelfIdx) =>
                                        columnLetters.map((letter, colIdx) => (
                                            <div key={`${shelf.id}-${letter}`} className="print-bin-label">
                                                <div className="label-rack-name">{rack.name}</div>
                                                <div className="label-bin-code">
                                                    Shelf {shelfIdx + 1} &mdash; {letter}
                                                </div>
                                                <div className="label-bin-meta">
                                                    {rack.type} Storage
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>}

                {/* Tooltip */}
                {tooltip && (
                    <div className="product-tooltip" style={{ top: tooltip.y, left: tooltip.x }}>
                        <h4>{tooltip.name}</h4>
                        <p>Quantity: {parseFloat(tooltip.qty)}</p>
                        {tooltip.bin && <p>Bin: {tooltip.bin}</p>}
                    </div>
                )}
            </main>
        </div>
    );
}

/* === Rack Create/Edit Modal === */
function RackModal({ rack, onSave, onClose }) {
    const [formData, setFormData] = useState({
        name: rack?.name || '',
        type: rack?.type || 'GENERAL',
        description: rack?.description || '',
        totalShelves: rack?.shelves?.length || rack?.totalShelves || 5,
        categoryTags: rack?.categoryTags?.join(', ') || '',
        maxCapacity: rack?.maxCapacity || ''
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        await onSave({
            ...formData,
            totalShelves: parseInt(formData.totalShelves),
            categoryTags: formData.categoryTags ? formData.categoryTags.split(',').map(t => t.trim()).filter(Boolean) : [],
            maxCapacity: formData.maxCapacity ? parseInt(formData.maxCapacity) : null
        });
        setSaving(false);
    };

    const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal rack-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{rack ? 'Edit Rack' : 'Add Rack'}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="rack-modal-body">
                        <div className="form-group">
                            <label className="form-label">Rack Name *</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., Rack A, Fridge 1, Schedule H Cabinet"
                                value={formData.name}
                                onChange={(e) => update('name', e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Storage Type</label>
                            <select className="form-input" value={formData.type} onChange={(e) => update('type', e.target.value)}>
                                <option value="GENERAL">General (Room Temp)</option>
                                <option value="REFRIGERATED">Refrigerated (2-8°C)</option>
                                <option value="CONTROLLED">Controlled (Narcotics / Schedule H)</option>
                                <option value="HAZARDOUS">Hazardous</option>
                                <option value="BULK">Bulk Storage</option>
                            </select>
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Shelves</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.totalShelves}
                                    onChange={(e) => update('totalShelves', e.target.value)}
                                    min="1" max="20"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Max Capacity</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="Auto"
                                    value={formData.maxCapacity}
                                    onChange={(e) => update('maxCapacity', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Category Tags</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., Antibiotics, Pain Relief, Syrups"
                                value={formData.categoryTags}
                                onChange={(e) => update('categoryTags', e.target.value)}
                            />
                            <span className="form-hint">Comma separated. Helps with smart assignment.</span>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., Near dispensing counter"
                                value={formData.description}
                                onChange={(e) => update('description', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? <><Loader2 className="spinner spinner-sm animate-spin" size={18} /> Saving...</> : rack ? 'Update Rack' : 'Add Rack'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
