import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { inventoryAPI, billingAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import {
    ReceiptText,
    ScanBarcode,
    Search,
    ShoppingCart,
    Trash2,
    X,
    Plus,
    Minus,
    IndianRupee,
    CreditCard,
    Smartphone,
    FileText,
    ClipboardList,
    Printer,
    User,
    Loader2
} from 'lucide-react';
import '../styles/billing.css';

export default function Billing() {
    const { currentBranch, user } = useAuth();
    const [cart, setCart] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '' });
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [discount, setDiscount] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [invoice, setInvoice] = useState(null);
    const [showInvoice, setShowInvoice] = useState(false);
    const searchInputRef = useRef(null);
    const barcodeInputRef = useRef(null);

    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);

    // Search products
    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            console.log('Searching for:', query, 'Branch:', currentBranch?.id);
            const res = await inventoryAPI.getProducts(currentBranch?.id, { search: query });
            console.log('Search results:', res.data);
            setSearchResults(res.data || []);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setSearching(false);
        }
    };

    // Barcode scan handler
    const handleBarcodeScan = async (e) => {
        if (e.key === 'Enter' && e.target.value) {
            const barcode = e.target.value.trim();
            try {
                const res = await inventoryAPI.findProduct(currentBranch?.id, { barcode });
                if (res.data) {
                    addToCart(res.data);
                    e.target.value = '';
                }
            } catch (error) {
                alert('Product not found for barcode: ' + barcode);
            }
        }
    };

    // Add product to cart
    const addToCart = (product) => {
        console.log('Adding to cart:', product);

        if (!product || !product.id) {
            console.error('Invalid product:', product);
            return;
        }

        const existing = cart.find(item => item.productId === product.id);
        if (existing) {
            if (existing.quantity >= product.quantity) {
                alert(`Only ${product.quantity} units available in stock`);
                return;
            }
            setCart(cart.map(item =>
                item.productId === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            if (product.quantity < 1) {
                alert('Product is out of stock');
                return;
            }
            setCart([...cart, {
                productId: product.id,
                name: product.name,
                mrp: parseFloat(product.mrp),
                gstRate: parseFloat(product.gstRate),
                quantity: 1,
                loose: 0,
                tabletsPerStrip: product.tabletsPerStrip || 10,
                maxQuantity: product.quantity,
                discount: 0
            }]);
        }
        setSearchQuery('');
        setSearchResults([]);
    };

    // Update cart item quantity
    const updateQuantity = (productId, newQty) => {
        if (newQty < 0) return;
        setCart(cart.map(item =>
            item.productId === productId ? { ...item, quantity: newQty } : item
        ));
    };

    // Update loose tablets count
    const updateItemLoose = (productId, count) => {
        const newLoose = parseInt(count) || 0;
        if (newLoose < 0) return;

        setCart(cart.map(item => {
            if (item.productId !== productId) return item;

            // Cap loose tablets to tabletsPerStrip - 1 (since 10 tabs = 1 strip)
            const limit = (item.tabletsPerStrip || 10) - 1;
            return { ...item, loose: Math.min(newLoose, limit) };
        }));
    };

    // Remove from cart
    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.productId !== productId));
    };

    // Calculate totals
    const calculateTotals = () => {
        let subtotal = 0;
        let totalGst = 0;

        cart.forEach(item => {
            const stripPrice = item.mrp;
            const tabletPrice = item.mrp / (item.tabletsPerStrip || 10);

            const itemTotal = (stripPrice * item.quantity) + (tabletPrice * (item.loose || 0));

            // Taxable Amount (assuming MRP includes GST? Usually MRP is inclusive, but here code treated it as base. 
            // Looking at original code: itemTotal - discount... implies basic calc. 
            // Let's stick to original flow: GST is added ON TOP of taxable amount derived from MRP?
            // Wait, previous code: subtotal += itemTotal; totalGst += (taxable * gstRate).
            // Let's assume MRP is base price here for simplicity or previous logic.

            const taxableAmount = itemTotal; // No item level discount anymore
            const gstAmount = (taxableAmount * item.gstRate) / 100;

            subtotal += itemTotal;
            totalGst += gstAmount;
        });

        // Overall discount is percentage
        const discountAmount = (subtotal * discount) / 100;
        const grandTotal = subtotal - discountAmount + totalGst;
        return { subtotal, totalGst, grandTotal, discountAmount };
    };

    // Create invoice
    const handleCreateInvoice = async () => {
        if (cart.length === 0) {
            alert('Cart is empty');
            return;
        }

        setProcessing(true);
        try {
            const items = cart.map(item => ({
                productId: item.productId,
                // Combine strip + loose into a single decimal quantity
                quantity: item.quantity + ((item.loose || 0) / (item.tabletsPerStrip || 10)),
                discount: 0 // No item level discount
            }));

            const res = await billingAPI.createInvoice(currentBranch?.id, {
                customerName: customerInfo.name,
                customerPhone: customerInfo.phone,
                customerAddress: customerInfo.address,
                items,
                discountPercent: discount, // Send as percentage
                paymentMethod
            });

            setInvoice(res.data);
            setShowInvoice(true);
            setCart([]);
            setCustomerInfo({ name: '', phone: '', address: '' });
            setDiscount(0);
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to create invoice');
        } finally {
            setProcessing(false);
        }
    };

    const { subtotal, totalGst, grandTotal, discountAmount } = calculateTotals();

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-main">
                <Header title="Billing" icon={ReceiptText} />

                <div className="billing-container">
                    {/* Left Panel - Product Search & Cart */}
                    <div className="billing-left">
                        {/* Barcode Scanner */}
                        <div className="barcode-section glass-panel">
                            <label className="form-label">
                                <ScanBarcode size={18} />
                                Barcode Scanner
                            </label>
                            <input
                                ref={barcodeInputRef}
                                type="text"
                                className="form-input"
                                placeholder="Scan barcode or enter manually..."
                                onKeyDown={handleBarcodeScan}
                            />
                        </div>

                        {/* Product Search */}
                        <div className="search-section glass-panel" style={{ overflow: 'visible' }}>
                            <label className="form-label">
                                <Search size={18} />
                                Search Products
                            </label>
                            <div className="search-box" style={{ position: 'relative' }}>
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    className="form-input"
                                    placeholder="Search by name, generic name..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                />
                                {searching && <Loader2 className="spinner spinner-sm animate-spin" size={16} />}

                                {/* Search Results Dropdown - inside search-box for proper positioning */}
                                {searchResults.length > 0 && (
                                    <div className="search-results" style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        zIndex: 9999,
                                        marginTop: '4px',
                                        background: 'var(--dark-surface)',
                                        border: '1px solid var(--dark-border)',
                                        borderRadius: '12px',
                                        maxHeight: '300px',
                                        overflowY: 'auto',
                                        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
                                    }}>
                                        {searchResults.map(product => (
                                            <div
                                                key={product.id}
                                                className="search-result-item"
                                                onClick={() => addToCart(product)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="product-info">
                                                    <span className="product-name">{product.name}</span>
                                                    <span className="product-detail">{product.genericName} | Stock: {product.quantity}</span>
                                                </div>
                                                <span className="product-price">{formatCurrency(product.mrp)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Cart */}
                        <div className="cart-section glass-panel">
                            <div className="cart-header">
                                <h3>
                                    <ShoppingCart size={20} />
                                    Cart ({cart.length} items)
                                </h3>
                                {cart.length > 0 && (
                                    <button className="btn btn-ghost btn-sm" onClick={() => setCart([])}>
                                        <Trash2 size={16} />
                                        Clear All
                                    </button>
                                )}
                            </div>

                            {cart.length === 0 ? (
                                <div className="cart-empty">
                                    <ShoppingCart size={48} className="text-muted" />
                                    <p>Cart is empty</p>
                                    <p className="text-muted">Search or scan products to add</p>
                                </div>
                            ) : (
                                <div className="cart-items">
                                    {cart.map(item => (
                                        <div key={item.productId} className="cart-item">
                                            <div className="item-info">
                                                <span className="item-name">{item.name}</span>
                                                <span className="item-price">{formatCurrency(item.mrp)} × {item.quantity}</span>
                                            </div>
                                            <div className="item-controls" style={{ gap: '0.5rem', alignItems: 'center' }}>
                                                {/* Strip Quantity */}
                                                <div className="quantity-controls">
                                                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                                                        <Minus size={14} />
                                                    </button>
                                                    <span title="Strips">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                                                        <Plus size={14} />
                                                    </button>
                                                </div>

                                                {/* Loose Tablets Input */}
                                                <div className="loose-controls" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        style={{ width: '50px', padding: '4px', textAlign: 'center' }}
                                                        placeholder="Tab"
                                                        min="0"
                                                        max={item.tabletsPerStrip ? item.tabletsPerStrip - 1 : 9}
                                                        value={item.loose || ''}
                                                        onChange={(e) => updateItemLoose(item.productId, e.target.value)}
                                                    />
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tabs</span>
                                                </div>

                                                <button className="remove-btn" onClick={() => removeFromCart(item.productId)}>
                                                    <X size={16} />
                                                </button>
                                            </div>
                                            <div className="item-total">
                                                {formatCurrency(
                                                    (item.mrp * item.quantity) +
                                                    ((item.mrp / (item.tabletsPerStrip || 10)) * (item.loose || 0))
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Customer & Payment */}
                    <div className="billing-right">
                        {/* Customer Info */}
                        <div className="customer-section glass-panel">
                            <h3>
                                <User size={20} />
                                Customer Details
                            </h3>
                            <div className="form-group">
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Customer Name"
                                    value={customerInfo.name}
                                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <input
                                    type="tel"
                                    className="form-input"
                                    placeholder="Phone Number"
                                    value={customerInfo.phone}
                                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="payment-section glass-panel">
                            <h3>
                                <CreditCard size={20} />
                                Payment Method
                            </h3>
                            <div className="payment-options">
                                {['CASH', 'CARD', 'UPI', 'CREDIT'].map(method => (
                                    <button
                                        key={method}
                                        className={`payment-option ${paymentMethod === method ? 'active' : ''}`}
                                        onClick={() => setPaymentMethod(method)}
                                    >
                                        {method === 'CASH' && <IndianRupee size={18} />}
                                        {method === 'CARD' && <CreditCard size={18} />}
                                        {method === 'UPI' && <Smartphone size={18} />}
                                        {method === 'CREDIT' && <FileText size={18} />}
                                        {method}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Bill Summary */}
                        <div className="summary-section glass-panel">
                            <h3>
                                <ClipboardList size={20} />
                                Bill Summary
                            </h3>
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="summary-row">
                                <span>GST</span>
                                <span>{formatCurrency(totalGst)}</span>
                            </div>
                            <div className="summary-row discount-row">
                                <span>Discount (%)</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="number"
                                        className="discount-input"
                                        value={discount || ''}
                                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                        placeholder="0"
                                        max="100"
                                        min="0"
                                    />
                                    <span>%</span>
                                </div>
                            </div>
                            {discountAmount > 0 && (
                                <div className="summary-row">
                                    <span>Discount Amount</span>
                                    <span style={{ color: 'var(--success)' }}>-{formatCurrency(discountAmount)}</span>
                                </div>
                            )}
                            <div className="summary-row total-row">
                                <span>Grand Total</span>
                                <span className="grand-total">{formatCurrency(grandTotal)}</span>
                            </div>

                            <button
                                className="btn btn-primary btn-lg w-full"
                                onClick={handleCreateInvoice}
                                disabled={cart.length === 0 || processing}
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="spinner spinner-sm animate-spin" size={18} />
                                        Processing...
                                    </>
                                ) : (
                                    <>Generate Invoice</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Invoice Modal - Professional Print Layout */}
                {showInvoice && invoice && (
                    <div className="modal-overlay" onClick={() => setShowInvoice(false)}>
                        <div className="modal invoice-modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header no-print">
                                <h2>Invoice #{invoice.invoiceNumber}</h2>
                                <button className="modal-close" onClick={() => setShowInvoice(false)}>
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Printable Invoice Content */}
                            <div className="invoice-print-area" id="invoice-print">
                                {/* Invoice Header with Pharmacy Name */}
                                <div className="invoice-header-print">
                                    <h1 className="pharmacy-name">{invoice.branch?.name || 'IntellPharma'}</h1>
                                    <p className="pharmacy-address">{invoice.branch?.address || ''}</p>
                                    {invoice.branch?.phone && <p>Phone: {invoice.branch.phone}</p>}
                                    {invoice.branch?.gstNumber && <p>GSTIN: {invoice.branch.gstNumber}</p>}
                                </div>

                                <div className="invoice-divider">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>

                                {/* Invoice Details */}
                                <div className="invoice-details-row">
                                    <div>
                                        <strong>Invoice: #{invoice.invoiceNumber}</strong>
                                    </div>
                                    <div>
                                        <strong>Date: {new Date(invoice.createdAt).toLocaleDateString('en-IN')}</strong>
                                    </div>
                                </div>

                                {invoice.customerName && (
                                    <div className="customer-info-print">
                                        <p>Customer: {invoice.customerName}</p>
                                        {invoice.customerPhone && <p>Phone: {invoice.customerPhone}</p>}
                                    </div>
                                )}

                                <div className="invoice-divider">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>

                                {/* Items Table */}
                                <table className="invoice-table-print">
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'left' }}>Item</th>
                                            <th style={{ textAlign: 'center' }}>Qty</th>
                                            <th style={{ textAlign: 'right' }}>Rate</th>
                                            <th style={{ textAlign: 'right' }}>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoice.items?.map(item => (
                                            <tr key={item.id}>
                                                <td>{item.productName}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {Number(item.quantity) % 1 !== 0
                                                        ? Number(item.quantity).toFixed(2).replace(/\.?0+$/, '')
                                                        : item.quantity}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>₹{parseFloat(item.unitPrice).toFixed(2)}</td>
                                                <td style={{ textAlign: 'right' }}>₹{parseFloat(item.total).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="invoice-divider">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>

                                {/* Totals */}
                                <div className="invoice-totals-print">
                                    <div className="total-row-print">
                                        <span>Subtotal:</span>
                                        <span>₹{parseFloat(invoice.subtotal).toFixed(2)}</span>
                                    </div>
                                    <div className="total-row-print">
                                        <span>CGST:</span>
                                        <span>₹{parseFloat(invoice.cgstAmount || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="total-row-print">
                                        <span>SGST:</span>
                                        <span>₹{parseFloat(invoice.sgstAmount || 0).toFixed(2)}</span>
                                    </div>
                                    {parseFloat(invoice.discountAmount || 0) > 0 && (
                                        <div className="total-row-print discount-print">
                                            <span>Discount:</span>
                                            <span>-₹{parseFloat(invoice.discountAmount).toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="total-row-print grand-total-print">
                                        <span>GRAND TOTAL:</span>
                                        <span>₹{parseFloat(invoice.totalAmount).toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="invoice-divider">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>

                                <div className="payment-method-print">
                                    Payment: {invoice.paymentMethod}
                                </div>

                                <div className="invoice-footer-print">
                                    <p>Thank you for your purchase!</p>
                                    <p className="footer-note">Items once sold are not refundable</p>
                                </div>
                            </div>

                            <div className="invoice-actions no-print">
                                <button className="btn btn-secondary" onClick={() => window.print()}>
                                    <Printer size={18} />
                                    Print
                                </button>
                                <button className="btn btn-primary" onClick={() => setShowInvoice(false)}>
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
