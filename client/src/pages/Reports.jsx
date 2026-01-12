import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { billingAPI, branchAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import {
    BarChart3,
    IndianRupee,
    Receipt,
    Store,
    Tag,
    Percent,
    Banknote,
    CreditCard,
    Smartphone,
    FileText,
    Loader2,
    Landmark,
    FileStack,

    Download,
    FileSpreadsheet
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../styles/reports.css';

export default function Reports() {
    const { currentBranch, branches, hasRole } = useAuth();
    const [activeTab, setActiveTab] = useState('sales');
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [salesData, setSalesData] = useState(null);
    const [advancedData, setAdvancedData] = useState(null);
    const [branchComparison, setBranchComparison] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReportData();
    }, [currentBranch, dateRange, activeTab]);

    const loadReportData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'sales' || activeTab === 'gst') {
                const res = await billingAPI.getSalesSummary(currentBranch?.id, dateRange);
                setSalesData(res.data);
            }

            if (activeTab === 'branches' && hasRole('OWNER')) {
                const res = await branchAPI.getPerformance(dateRange);
                setBranchComparison(res.data || []);
            }

            if (activeTab === 'advanced') {
                const res = await billingAPI.getAdvancedReport(currentBranch?.id, dateRange);
                setAdvancedData(res.data);
            }
        } catch (error) {
            console.error('Report load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        const num = Number(amount);
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(isNaN(num) ? 0 : num);
    };

    const formatCurrencyPDF = (amount) => {
        const num = Number(amount);
        return 'Rs. ' + new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 0
        }).format(isNaN(num) ? 0 : num);
    };

    const generateBasicPDF = () => {
        const doc = new jsPDF();

        // Fix for autoTable not being available on doc instance
        if (typeof doc.autoTable !== 'function') {
            // Explicitly register plugin if needed, though import usually handles it
            // If this still fails, we'll try the import 'jspdf-autotable' side-effect method again but check package versions
        }
        const branchName = currentBranch?.name || 'Pharmacy';
        const period = `${new Date(dateRange.startDate).toLocaleDateString()} to ${new Date(dateRange.endDate).toLocaleDateString()}`;

        // Common Header for all reports
        doc.setFontSize(22);
        doc.text(branchName, 14, 20);

        doc.setFontSize(12);
        let reportTitle = '';
        if (activeTab === 'sales') reportTitle = 'Sales Summary Report';
        else if (activeTab === 'gst') reportTitle = 'GST Report';
        else if (activeTab === 'advanced') reportTitle = 'Advanced Sales & Inventory Report';
        else if (activeTab === 'branches') reportTitle = 'Branch Performance Report';

        doc.text(reportTitle, 14, 30);
        doc.text(`Period: ${period}`, 14, 36);
        doc.line(14, 40, 196, 40);

        // --- SALES SUMMARY PDF ---
        if (activeTab === 'sales' && salesData) {
            doc.setFontSize(14);
            doc.text('Financial Summary', 14, 50);

            const financials = [
                ['Total Sales', formatCurrencyPDF(salesData.totalSales)],
                ['Total GST', formatCurrencyPDF(salesData.totalGST)],
                ['Total Discounts', formatCurrencyPDF(salesData.totalDiscount)],
                ['Total Invoices', (salesData.invoiceCount || 0).toString()]
            ];

            autoTable(doc, {
                startY: 55,
                head: [['Metric', 'Value']],
                body: financials,
                theme: 'grid',
                headStyles: { fillColor: [66, 66, 66] }
            });

            if (salesData.paymentBreakdown && salesData.paymentBreakdown.length > 0) {
                let finalY = doc.lastAutoTable.finalY + 15;
                doc.text('Payment Method Breakdown', 14, finalY);

                const paymentData = salesData.paymentBreakdown.map(p => [
                    p.method,
                    p.count,
                    formatCurrencyPDF(p.total)
                ]);

                autoTable(doc, {
                    startY: finalY + 5,
                    head: [['Method', 'Transactions', 'Amount']],
                    body: paymentData,
                    theme: 'striped'
                });
            }
        }

        // --- GST REPORT PDF ---
        else if (activeTab === 'gst' && salesData) {
            doc.setFontSize(14);
            doc.text('GST Summary', 14, 50);

            const gstData = [
                ['CGST Collected', formatCurrencyPDF(salesData.totalGST / 2)],
                ['SGST Collected', formatCurrencyPDF(salesData.totalGST / 2)],
                ['Total GST Liability', formatCurrencyPDF(salesData.totalGST)]
            ];

            autoTable(doc, {
                startY: 55,
                head: [['Component', 'Amount']],
                body: gstData,
                theme: 'grid',
                headStyles: { fillColor: [66, 66, 66] }
            });

            doc.setFontSize(10);
            doc.text('* This report is for internal reference. Please consult your CA for official filing.', 14, doc.lastAutoTable.finalY + 10);
        }

        // --- ADVANCED REPORT PDF ---
        else if (activeTab === 'advanced' && advancedData) {
            // Financial Summary
            doc.setFontSize(14);
            doc.text('Financial Summary', 14, 50);

            const financials = [
                ['Total Sales', formatCurrencyPDF(advancedData.financials.totalSales)],
                ['Total GST Collected', formatCurrencyPDF(advancedData.financials.totalGST)],
                ['Total Discounts', formatCurrencyPDF(advancedData.financials.totalDiscount)],
                ['Total Invoices', advancedData.financials.invoiceCount.toString()],
                ['Current Inventory Value', formatCurrencyPDF(advancedData.inventory.currentValue)]
            ];

            autoTable(doc, {
                startY: 55,
                head: [['Metric', 'Value']],
                body: financials,
                theme: 'grid',
                headStyles: { fillColor: [66, 66, 66] }
            });

            // Payment Breakdown
            let finalY = doc.lastAutoTable.finalY + 15;
            doc.text('Payment Methods', 14, finalY);

            const paymentData = advancedData.paymentBreakdown.map(p => [
                p.method,
                p.count,
                formatCurrencyPDF(p.total)
            ]);

            autoTable(doc, {
                startY: finalY + 5,
                head: [['Method', 'Transactions', 'Amount']],
                body: paymentData,
                theme: 'striped'
            });

            // Top Products
            finalY = doc.lastAutoTable.finalY + 15;
            doc.text('Top Selling Products', 14, finalY);

            const productData = advancedData.topProducts.map(p => [
                p.name,
                p.quantity,
                formatCurrencyPDF(p.revenue)
            ]);

            autoTable(doc, {
                startY: finalY + 5,
                head: [['Product', 'Qty Sold', 'Revenue']],
                body: productData,
                theme: 'striped'
            });
        }

        // --- BRANCH COMPARISON PDF ---
        else if (activeTab === 'branches' && branchComparison.length > 0) {
            doc.setFontSize(14);
            doc.text('Branch Performance Comparison', 14, 50);

            const branchData = branchComparison.map(b => [
                b.branchName,
                formatCurrencyPDF(b.totalSales),
                b.invoiceCount,
                b.productCount
            ]);

            autoTable(doc, {
                startY: 55,
                head: [['Branch', 'Total Sales', 'Invoices', 'Products']],
                body: branchData,
                theme: 'striped'
            });
        }
        else {
            alert('No data available to generate report for this tab.');
            return;
        }

        const reportTitleFileName = activeTab === 'sales' ? 'Sales_Summary_Report' :
            activeTab === 'gst' ? 'GST_Report' :
                activeTab === 'advanced' ? 'Advanced_Report' : 'Branch_Report';

        // Common Footer
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(10);
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(`Page ${i} of ${pageCount}`, 196, 285, { align: 'right' });
            doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 285);
        }

        doc.save(`${reportTitleFileName.replace(/ /g, '_')}_${dateRange.startDate}.pdf`);
    };

    const generatePremiumPDF = () => {
        const doc = new jsPDF();
        const branchName = currentBranch?.name || 'Pharmacy';
        const period = `${new Date(dateRange.startDate).toLocaleDateString()} to ${new Date(dateRange.endDate).toLocaleDateString()}`;

        let reportTitle = '';
        if (activeTab === 'sales') reportTitle = 'Sales Summary Report';
        else if (activeTab === 'gst') reportTitle = 'GST Report';
        else if (activeTab === 'advanced') reportTitle = 'Advanced Sales & Inventory Report';
        else if (activeTab === 'branches') reportTitle = 'Branch Performance Report';

        // --- STEPPED PROFESSIONAL HEADER ---
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, 210, 297, 'F'); // Reset page background

        // Colors
        const deepNavy = [26, 35, 126];    // #1a237e - Main Brand Color
        const darkCharcoal = [30, 30, 30]; // #1e1e1e - Top Narrow Strip
        const accentBlue = [63, 81, 181];  // #3f51b5 - Accent info bg
        const lightGray = [245, 245, 245]; // #f5f5f5 - Content bg accents

        // 1. Narrow Top Strip (Professional Trim)
        // Height: 8mm
        doc.setFillColor(...darkCharcoal);
        doc.rect(0, 0, 210, 8, 'F');

        // Optional: Small contact text in the narrow strip
        doc.setTextColor(200, 200, 200);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text('MEDISTOCK ENTERPRISE REPORTING', 205, 5.5, { align: 'right' });

        // 2. Wide Main Header Bar
        // Height: 32mm (Starts at y=8)
        doc.setFillColor(...deepNavy);
        doc.rect(0, 8, 210, 32, 'F');

        // --- Branding in Main Bar ---
        // Logo Placeholder (Circle)
        doc.setFillColor(255, 255, 255);
        doc.circle(24, 24, 10, 'F');
        doc.setTextColor(...deepNavy);
        doc.setFontSize(16);
        doc.setFont('times', 'bold');
        doc.text('M', 24, 26, { align: 'center' });

        // Brand Name next to logo
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text('MEDISTOCK', 40, 22);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('Pharmacy Management Solutions', 40, 28);

        // --- Report Title (Right Aligned in Main Bar) ---
        // We use a diagonal separator for style on the right side
        // Lighten the right side slightly or just keep text clean

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text(reportTitle.toUpperCase(), 205, 22, { align: 'right' });

        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.text(`Period: ${period}`, 205, 29, { align: 'right' });

        // --- INFO BAND (Below Header) ---
        // A clean band separating header from content
        const bandTop = 40;
        doc.setFillColor(240, 242, 245); // Very light grey
        doc.rect(0, bandTop, 210, 20, 'F');

        // Info Grid in Band
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(10);

        // Left: Branch Info
        doc.setFont('helvetica', 'bold');
        doc.text('BRANCH:', 14, bandTop + 13);
        doc.setFont('helvetica', 'normal');
        doc.text(branchName.toUpperCase(), 35, bandTop + 13);

        // Center: Date Generated
        doc.setFont('helvetica', 'bold');
        doc.text('GENERATED:', 90, bandTop + 13);
        doc.setFont('helvetica', 'normal');
        doc.text(new Date().toLocaleDateString(), 118, bandTop + 13);

        // Right: Plan Info
        doc.setFont('helvetica', 'bold');
        doc.text('PLAN:', 160, bandTop + 13);
        doc.setFont('helvetica', 'normal');
        doc.text((currentBranch?.subscription?.plan || 'PREMIUM').toUpperCase(), 175, bandTop + 13);

        // Bottom Line of Band
        doc.setDrawColor(200, 200, 200);
        doc.line(0, bandTop + 20, 210, bandTop + 20);

        let contentStartY = bandTop + 35;


        // --- CONTENT SECTION (Consistent Styling) ---
        // Helper specifically for this function's scope to ensure consistent colors
        const tableHeadColor = [26, 35, 126]; // Matches Deep Navy

        // SALES CONTENT
        if (activeTab === 'sales' && salesData) {
            doc.setFontSize(12);
            doc.setTextColor(...deepNavy);
            doc.setFont('helvetica', 'bold');
            doc.text('1. FINANCIAL OVERVIEW', 14, contentStartY);

            const financials = [
                ['Total Sales', formatCurrencyPDF(salesData.totalSales)],
                ['Total GST', formatCurrencyPDF(salesData.totalGST)],
                ['Total Discounts', formatCurrencyPDF(salesData.totalDiscount)],
                ['Total Invoices', (salesData.invoiceCount || 0).toString()]
            ];

            autoTable(doc, {
                startY: contentStartY + 5,
                head: [['Metric', 'Value']],
                body: financials,
                theme: 'grid',
                headStyles: { fillColor: tableHeadColor, textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: lightGray },
                styles: { fontSize: 10, cellPadding: 6 },
            });

            if (salesData.paymentBreakdown && salesData.paymentBreakdown.length > 0) {
                let finalY = doc.lastAutoTable.finalY + 15;
                doc.text('2. PAYMENT BREAKDOWN', 14, finalY);

                const paymentData = salesData.paymentBreakdown.map(p => [
                    p.method,
                    p.count,
                    formatCurrencyPDF(p.total)
                ]);

                autoTable(doc, {
                    startY: finalY + 5,
                    head: [['Method', 'Transactions', 'Amount']],
                    body: paymentData,
                    theme: 'striped',
                    headStyles: { fillColor: [66, 66, 66], textColor: 255 },
                });
            }
        }

        // GST CONTENT
        else if (activeTab === 'gst' && salesData) {
            doc.setFontSize(12);
            doc.setTextColor(...deepNavy);
            doc.setFont('helvetica', 'bold');
            doc.text('1. TAX LIABILITY BREAKDOWN', 14, contentStartY);

            const gstData = [
                ['CGST Component (Center)', formatCurrencyPDF(salesData.totalGST / 2)],
                ['SGST Component (State)', formatCurrencyPDF(salesData.totalGST / 2)],
                ['Total GST Collected', formatCurrencyPDF(salesData.totalGST)]
            ];

            autoTable(doc, {
                startY: contentStartY + 5,
                head: [['Tax Component', 'Amount']],
                body: gstData,
                theme: 'grid',
                headStyles: { fillColor: tableHeadColor }
            });

            let finalY = doc.lastAutoTable.finalY + 15;
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.setFont('helvetica', 'italic');
            doc.text('Disclaimer: Values are calculated based on recorded sales. Please verify with official tax returns.', 14, finalY);
        }

        // ADVANCED CONTENT
        else if (activeTab === 'advanced' && advancedData) {
            doc.setFontSize(12);
            doc.setTextColor(...deepNavy);
            doc.setFont('helvetica', 'bold');
            doc.text('1. EXECUTIVE SUMMARY', 14, contentStartY);

            const financials = [
                ['Total Revenue', formatCurrencyPDF(advancedData.financials.totalSales)],
                ['Total Tax Collected', formatCurrencyPDF(advancedData.financials.totalGST)],
                ['Discounts Allowed', formatCurrencyPDF(advancedData.financials.totalDiscount)],
                ['Transaction Volume', advancedData.financials.invoiceCount.toString()],
                ['Inventory Valuation', formatCurrencyPDF(advancedData.inventory.currentValue)]
            ];

            autoTable(doc, {
                startY: contentStartY + 5,
                head: [['Key Performance Indicator', 'Value']],
                body: financials,
                theme: 'grid',
                headStyles: { fillColor: tableHeadColor }
            });

            let finalY = doc.lastAutoTable.finalY + 15;
            doc.text('2. REVENUE CHANNELS', 14, finalY);

            const paymentData = advancedData.paymentBreakdown.map(p => [
                p.method,
                p.count,
                formatCurrencyPDF(p.total)
            ]);

            autoTable(doc, {
                startY: finalY + 5,
                head: [['Channel', 'Volume', 'Revenue']],
                body: paymentData,
                theme: 'striped',
                headStyles: { fillColor: [66, 66, 66] }
            });

            finalY = doc.lastAutoTable.finalY + 15;
            doc.text('3. TOP PERFORMING PRODUCTS', 14, finalY);

            const productData = advancedData.topProducts.map(p => [
                p.name,
                p.quantity,
                formatCurrencyPDF(p.revenue)
            ]);

            autoTable(doc, {
                startY: finalY + 5,
                head: [['Product Name', 'Units Sold', 'Revenue Generated']],
                body: productData,
                theme: 'striped',
                headStyles: { fillColor: [66, 66, 66] }
            });
        }

        // BRANCH CONTENT
        else if (activeTab === 'branches' && branchComparison.length > 0) {
            doc.setFontSize(12);
            doc.setTextColor(...deepNavy);
            doc.setFont('helvetica', 'bold');
            doc.text('1. MULTI-BRANCH ANALYSIS', 14, contentStartY);

            const branchData = branchComparison.map(b => [
                b.branchName,
                formatCurrencyPDF(b.totalSales),
                b.invoiceCount,
                b.productCount
            ]);

            autoTable(doc, {
                startY: contentStartY + 5,
                head: [['Branch', 'Total Sales', 'Invoices', 'Products']],
                body: branchData,
                theme: 'grid',
                headStyles: { fillColor: tableHeadColor }
            });
        }

        // --- FOOTER ---
        const pageCount = doc.internal.getNumberOfPages();
        // Decorative bottom strip (Matches Top)
        doc.setFillColor(...deepNavy);
        doc.rect(0, 290, 210, 7, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(`Medistock Premium Report | Page ${i} of ${pageCount}`, 14, 294.5);
            doc.text('Confidential Document', 196, 294.5, { align: 'right' });
        }

        doc.save(`${reportTitle.replace(/ /g, '_')}_Premium_${dateRange.startDate}.pdf`);
    };

    const generatePDF = () => {
        // Check Subscription Plan using optional chaining
        const plan = currentBranch?.subscription?.plan || 'FREE';

        if (['PRO', 'PREMIUM', 'ENTERPRISE'].includes(plan)) {
            generatePremiumPDF();
        } else {
            generateBasicPDF();
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-main">
                <Header title="Reports" icon={BarChart3} />

                {/* Date Range Selector */}
                <div className="date-range-bar glass-panel">
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-end', flexWrap: 'wrap', flex: 1 }}>
                        <div className="date-inputs">
                            <div className="form-group">
                                <label className="form-label">From</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={dateRange.startDate}
                                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">To</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={dateRange.endDate}
                                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="quick-dates">
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => {
                                    const today = new Date();
                                    setDateRange({
                                        startDate: today.toISOString().split('T')[0],
                                        endDate: today.toISOString().split('T')[0]
                                    });
                                }}
                            >
                                Today
                            </button>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => {
                                    const today = new Date();
                                    const weekAgo = new Date(today.setDate(today.getDate() - 7));
                                    setDateRange({
                                        startDate: weekAgo.toISOString().split('T')[0],
                                        endDate: new Date().toISOString().split('T')[0]
                                    });
                                }}
                            >
                                Last 7 Days
                            </button>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => {
                                    const today = new Date();
                                    setDateRange({
                                        startDate: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
                                        endDate: today.toISOString().split('T')[0]
                                    });
                                }}
                            >
                                This Month
                            </button>
                        </div>
                    </div>

                    <button className="btn btn-primary" onClick={generatePDF} title="Download Report as PDF">
                        <Download size={18} />
                        Download PDF
                    </button>
                </div>

                {/* Report Tabs */}
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'sales' ? 'active' : ''}`}
                        onClick={() => setActiveTab('sales')}
                    >
                        <IndianRupee size={16} />
                        Sales Summary
                    </button>
                    <button
                        className={`tab ${activeTab === 'gst' ? 'active' : ''}`}
                        onClick={() => setActiveTab('gst')}
                    >
                        <Receipt size={16} />
                        GST Report
                    </button>
                    {hasRole('OWNER') && (
                        <button
                            className={`tab ${activeTab === 'branches' ? 'active' : ''}`}
                            onClick={() => setActiveTab('branches')}
                        >
                            <Store size={16} />
                            Branch Comparison
                        </button>
                    )}
                    <button
                        className={`tab ${activeTab === 'advanced' ? 'active' : ''}`}
                        onClick={() => setActiveTab('advanced')}
                    >
                        <FileSpreadsheet size={16} />
                        Detailed Report
                    </button>
                </div>

                {/* Report Content */}
                {loading ? (
                    <div className="loading-container">
                        <Loader2 className="spinner spinner-lg animate-spin" size={32} />
                    </div>
                ) : (
                    <div className="report-content">
                        {/* Sales Summary */}
                        {activeTab === 'sales' && salesData && (
                            <div className="sales-report">
                                <div className="stats-grid">
                                    <div className="stat-card glass-panel">
                                        <div className="stat-icon gradient-primary">
                                            <IndianRupee size={24} />
                                        </div>
                                        <div className="stat-value">{formatCurrency(salesData.totalSales)}</div>
                                        <div className="stat-label">Total Sales</div>
                                    </div>
                                    <div className="stat-card glass-panel">
                                        <div className="stat-icon gradient-accent">
                                            <FileStack size={24} />
                                        </div>
                                        <div className="stat-value">{salesData.invoiceCount || 0}</div>
                                        <div className="stat-label">Invoices</div>
                                    </div>
                                    <div className="stat-card glass-panel">
                                        <div className="stat-icon bg-warning">
                                            <Tag size={24} />
                                        </div>
                                        <div className="stat-value">{formatCurrency(salesData.totalDiscount)}</div>
                                        <div className="stat-label">Discounts Given</div>
                                    </div>
                                    <div className="stat-card glass-panel">
                                        <div className="stat-icon gradient-primary">
                                            <Landmark size={24} />
                                        </div>
                                        <div className="stat-value">{formatCurrency(salesData.totalGST)}</div>
                                        <div className="stat-label">Total GST</div>
                                    </div>
                                </div>

                                {/* Payment Breakdown */}
                                {salesData.paymentBreakdown && salesData.paymentBreakdown.length > 0 && (
                                    <div className="report-section glass-panel">
                                        <h3>Payment Method Breakdown</h3>
                                        <div className="payment-breakdown">
                                            {salesData.paymentBreakdown.map(item => (
                                                <div key={item.method} className="breakdown-item">
                                                    <div className="breakdown-info">
                                                        <span className="method-icon">
                                                            {item.method === 'CASH' && <Banknote size={16} />}
                                                            {item.method === 'CARD' && <CreditCard size={16} />}
                                                            {item.method === 'UPI' && <Smartphone size={16} />}
                                                            {item.method === 'CREDIT' && <FileText size={16} />}
                                                        </span>
                                                        <span className="method-name">{item.method}</span>
                                                    </div>
                                                    <div className="breakdown-stats">
                                                        <span className="breakdown-count">{item.count} txns</span>
                                                        <span className="breakdown-amount">{formatCurrency(item.total)}</span>
                                                    </div>
                                                    <div className="breakdown-bar">
                                                        <div
                                                            className="bar-fill"
                                                            style={{
                                                                width: `${(item.total / salesData.totalSales) * 100}%`
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* GST Report */}
                        {activeTab === 'gst' && salesData && (
                            <div className="gst-report">
                                <div className="gst-summary glass-panel">
                                    <h3>GST Summary</h3>
                                    <div className="gst-grid">
                                        <div className="gst-card">
                                            <div className="gst-label">CGST Collected</div>
                                            <div className="gst-value">{formatCurrency(salesData.totalGST / 2)}</div>
                                        </div>
                                        <div className="gst-card">
                                            <div className="gst-label">SGST Collected</div>
                                            <div className="gst-value">{formatCurrency(salesData.totalGST / 2)}</div>
                                        </div>
                                        <div className="gst-card total">
                                            <div className="gst-label">Total GST Liability</div>
                                            <div className="gst-value">{formatCurrency(salesData.totalGST)}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="gst-info glass-panel">
                                    <h3>
                                        <FileText size={20} />
                                        GST Filing Information
                                    </h3>
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <span className="info-label">GSTR-1</span>
                                            <span className="info-desc">Outward supplies - Due by 11th of next month</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">GSTR-3B</span>
                                            <span className="info-desc">Summary return - Due by 20th of next month</span>
                                        </div>
                                    </div>
                                    <div className="export-actions">
                                        <button className="btn btn-primary" onClick={() => exportReport('GSTR-1')}>
                                            <Download size={18} />
                                            Generate GSTR-1
                                        </button>
                                        <button className="btn btn-primary" onClick={() => exportReport('GSTR-3B')}>
                                            <Download size={18} />
                                            Generate GSTR-3B
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Branch Comparison */}
                        {activeTab === 'branches' && hasRole('OWNER') && (
                            <div className="branch-report">
                                {branchComparison.length === 0 ? (
                                    <div className="empty-state glass-panel">
                                        <Store size={48} className="text-muted" />
                                        <h3>No branch data available</h3>
                                        <p>Add more branches to compare performance</p>
                                    </div>
                                ) : (
                                    <div className="branch-comparison glass-panel">
                                        <h3>Branch Performance Comparison</h3>
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Branch</th>
                                                    <th>Total Sales</th>
                                                    <th>Invoices</th>
                                                    <th>Products</th>
                                                    <th>Performance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {branchComparison.map(branch => {
                                                    const maxSales = Math.max(...branchComparison.map(b => b.totalSales || 0));
                                                    const performance = maxSales > 0 ? ((branch.totalSales || 0) / maxSales) * 100 : 0;

                                                    return (
                                                        <tr key={branch.branchId}>
                                                            <td>
                                                                <span className="branch-name">{branch.branchName}</span>
                                                            </td>
                                                            <td>{formatCurrency(branch.totalSales)}</td>
                                                            <td>{branch.invoiceCount}</td>
                                                            <td>{branch.productCount}</td>
                                                            <td>
                                                                <div className="performance-bar">
                                                                    <div
                                                                        className="bar-fill"
                                                                        style={{ width: `${performance}%` }}
                                                                    ></div>
                                                                    <span className="bar-label">{Math.round(performance)}%</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                        )}

                        {/* Advanced Report */}
                        {activeTab === 'advanced' && advancedData && (
                            <div className="advanced-report">
                                <div className="stats-grid">
                                    <div className="stat-card glass-panel">
                                        <div className="stat-label">Total Revenue</div>
                                        <div className="stat-value">{formatCurrency(advancedData.financials.totalSales)}</div>
                                    </div>
                                    <div className="stat-card glass-panel">
                                        <div className="stat-label">Total Invoices</div>
                                        <div className="stat-value">{advancedData.financials.invoiceCount}</div>
                                    </div>
                                    <div className="stat-card glass-panel">
                                        <div className="stat-label">Inventory Value</div>
                                        <div className="stat-value">{formatCurrency(advancedData.inventory.currentValue)}</div>
                                    </div>
                                    <div className="stat-card glass-panel">
                                        <div className="stat-label">Top Product</div>
                                        <div className="stat-value" style={{ fontSize: '1.25rem' }}>
                                            {advancedData.topProducts[0]?.name || 'N/A'}
                                        </div>
                                    </div>
                                </div>

                                <div className="report-section glass-panel">
                                    <h3>Top Selling Products</h3>
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Quantity Sold</th>
                                                <th>Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {advancedData.topProducts.map((p, i) => (
                                                <tr key={i}>
                                                    <td>{p.name}</td>
                                                    <td>{p.quantity}</td>
                                                    <td>{formatCurrency(p.revenue)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main >
        </div >
    );
}
