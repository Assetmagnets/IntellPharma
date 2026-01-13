import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { billingAPI, branchAPI, stripeAPI, subscriptionAPI } from '../services/api';
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
    FileSpreadsheet,
    X,
    Crown,
    Sparkles,
    FileCheck,
    Palette,
    ArrowLeft,
    Check
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
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [subscriptionPlan, setSubscriptionPlan] = useState('BASIC');
    const [generatedBlobUrl, setGeneratedBlobUrl] = useState(null);
    const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'preview'
    const [toastMsg, setToastMsg] = useState(null);

    useEffect(() => {
        if (toastMsg) {
            const timer = setTimeout(() => setToastMsg(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMsg]);

    useEffect(() => {
        loadReportData();
    }, [currentBranch, dateRange, activeTab]);

    // Load subscription plan to determine template access
    useEffect(() => {
        const loadSubscriptionPlan = async () => {
            try {
                // Try Stripe status first
                const stripeRes = await stripeAPI.getSubscriptionStatus();
                if (stripeRes.data?.plan) {
                    setSubscriptionPlan(stripeRes.data.plan);
                    return;
                }
            } catch (err) {
                console.log('Stripe status unavailable');
            }

            try {
                // Fallback to subscription API
                const subRes = await subscriptionAPI.getCurrent();
                if (subRes.data?.plan) {
                    setSubscriptionPlan(subRes.data.plan);
                }
            } catch (err) {
                console.log('Using default BASIC plan');
            }
        };
        loadSubscriptionPlan();
    }, []);

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

    const generateBasicPDF = (returnDoc = false) => {
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

        if (returnDoc) return doc;
        doc.save(`${reportTitleFileName.replace(/ /g, '_')}_${dateRange.startDate}.pdf`);
    };

    const generatePremiumPDF = (returnDoc = false) => {
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
        doc.text('PHARMASTOCK ENTERPRISE REPORTING', 205, 5.5, { align: 'right' });

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
        doc.text('PHARMASTOCK', 40, 22);

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
            doc.text(`PharmaStock Premium Report | Page ${i} of ${pageCount}`, 14, 294.5);
            doc.text('Confidential Document', 196, 294.5, { align: 'right' });
        }

        if (returnDoc) return doc;
        doc.save(`${reportTitle.replace(/ /g, '_')}_Executive_${dateRange.startDate}.pdf`);
    };

    // Template 2: Modern Gradient
    const generateModernPDF = (returnDoc = false) => {
        const doc = new jsPDF();
        const branchName = currentBranch?.name || 'Pharmacy';
        const period = `${new Date(dateRange.startDate).toLocaleDateString()} to ${new Date(dateRange.endDate).toLocaleDateString()}`;

        let reportTitle = '';
        if (activeTab === 'sales') reportTitle = 'Sales Summary Report';
        else if (activeTab === 'gst') reportTitle = 'GST Report';
        else if (activeTab === 'advanced') reportTitle = 'Advanced Report';
        else if (activeTab === 'branches') reportTitle = 'Branch Performance';

        // Modern gradient header (purple to blue simulation)
        const gradientPurple = [139, 92, 246];
        const gradientBlue = [59, 130, 246];

        doc.setFillColor(...gradientPurple);
        doc.rect(0, 0, 105, 45, 'F');
        doc.setFillColor(...gradientBlue);
        doc.rect(105, 0, 105, 45, 'F');

        // White text on gradient
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.text(reportTitle.toUpperCase(), 14, 25);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`${branchName} | ${period}`, 14, 35);

        // Badge style date
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(155, 15, 45, 18, 3, 3, 'F');
        doc.setTextColor(...gradientPurple);
        doc.setFontSize(9);
        doc.text('GENERATED', 177.5, 23, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(new Date().toLocaleDateString(), 177.5, 30, { align: 'center' });

        let contentStartY = 60;
        const tableHeadColor = [139, 92, 246];

        // Content based on tab
        if (activeTab === 'sales' && salesData) {
            doc.setTextColor(80, 80, 80);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('💰 Financial Overview', 14, contentStartY);

            autoTable(doc, {
                startY: contentStartY + 8,
                head: [['Metric', 'Value']],
                body: [
                    ['Total Sales', formatCurrencyPDF(salesData.totalSales)],
                    ['Total GST', formatCurrencyPDF(salesData.totalGST)],
                    ['Total Discounts', formatCurrencyPDF(salesData.totalDiscount)],
                    ['Invoices', (salesData.invoiceCount || 0).toString()]
                ],
                theme: 'grid',
                headStyles: { fillColor: tableHeadColor, fontSize: 11 },
                styles: { fontSize: 10, cellPadding: 5 },
                alternateRowStyles: { fillColor: [245, 243, 255] }
            });

            if (salesData.paymentBreakdown?.length > 0) {
                let finalY = doc.lastAutoTable.finalY + 15;
                doc.text('💳 Payment Methods', 14, finalY);

                autoTable(doc, {
                    startY: finalY + 8,
                    head: [['Method', 'Count', 'Amount']],
                    body: salesData.paymentBreakdown.map(p => [p.method, p.count, formatCurrencyPDF(p.total)]),
                    theme: 'striped',
                    headStyles: { fillColor: [59, 130, 246] }
                });
            }
        } else if (activeTab === 'gst' && salesData) {
            doc.setTextColor(80, 80, 80);
            doc.setFontSize(14);
            doc.text('📊 Tax Breakdown', 14, contentStartY);

            autoTable(doc, {
                startY: contentStartY + 8,
                head: [['Component', 'Amount']],
                body: [
                    ['CGST', formatCurrencyPDF(salesData.totalGST / 2)],
                    ['SGST', formatCurrencyPDF(salesData.totalGST / 2)],
                    ['Total GST', formatCurrencyPDF(salesData.totalGST)]
                ],
                theme: 'grid',
                headStyles: { fillColor: tableHeadColor }
            });
        } else if (activeTab === 'advanced' && advancedData) {
            doc.setTextColor(80, 80, 80);
            doc.setFontSize(14);
            doc.text('📈 Executive Summary', 14, contentStartY);

            autoTable(doc, {
                startY: contentStartY + 8,
                head: [['KPI', 'Value']],
                body: [
                    ['Revenue', formatCurrencyPDF(advancedData.financials.totalSales)],
                    ['Transactions', advancedData.financials.invoiceCount.toString()],
                    ['Inventory Value', formatCurrencyPDF(advancedData.inventory.currentValue)]
                ],
                theme: 'grid',
                headStyles: { fillColor: tableHeadColor }
            });
        } else if (activeTab === 'branches' && branchComparison.length > 0) {
            doc.setTextColor(80, 80, 80);
            doc.setFontSize(14);
            doc.text('🏪 Branch Analysis', 14, contentStartY);

            autoTable(doc, {
                startY: contentStartY + 8,
                head: [['Branch', 'Sales', 'Invoices']],
                body: branchComparison.map(b => [b.branchName, formatCurrencyPDF(b.totalSales), b.invoiceCount]),
                theme: 'grid',
                headStyles: { fillColor: tableHeadColor }
            });
        }

        // Modern footer
        doc.setFillColor(...gradientBlue);
        doc.rect(0, 287, 210, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text('PharmaStock Modern Report', 14, 293);
        doc.text(`Page 1 of 1`, 196, 293, { align: 'right' });

        if (returnDoc) return doc;
        doc.save(`${reportTitle.replace(/ /g, '_')}_Modern_${dateRange.startDate}.pdf`);
    };

    // Template 3: Minimal Clean
    const generateMinimalPDF = (returnDoc = false) => {
        const doc = new jsPDF();
        const branchName = currentBranch?.name || 'Pharmacy';
        const period = `${new Date(dateRange.startDate).toLocaleDateString()} to ${new Date(dateRange.endDate).toLocaleDateString()}`;

        let reportTitle = '';
        if (activeTab === 'sales') reportTitle = 'Sales Summary';
        else if (activeTab === 'gst') reportTitle = 'GST Report';
        else if (activeTab === 'advanced') reportTitle = 'Detailed Report';
        else if (activeTab === 'branches') reportTitle = 'Branch Report';

        // Minimal header - just clean lines
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(14, 15, 196, 15);

        doc.setTextColor(0, 0, 0);
        doc.setFont('times', 'bold');
        doc.setFontSize(24);
        doc.text(branchName.toUpperCase(), 14, 28);

        doc.setFont('times', 'italic');
        doc.setFontSize(12);
        doc.text(reportTitle, 14, 36);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Period: ${period}`, 196, 28, { align: 'right' });
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 196, 35, { align: 'right' });

        doc.setLineWidth(0.3);
        doc.line(14, 42, 196, 42);

        let contentStartY = 55;

        // Content
        if (activeTab === 'sales' && salesData) {
            doc.setFont('times', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text('Financial Summary', 14, contentStartY);

            autoTable(doc, {
                startY: contentStartY + 5,
                head: [['Description', 'Amount']],
                body: [
                    ['Total Sales', formatCurrencyPDF(salesData.totalSales)],
                    ['GST Collected', formatCurrencyPDF(salesData.totalGST)],
                    ['Discounts', formatCurrencyPDF(salesData.totalDiscount)],
                    ['Invoice Count', (salesData.invoiceCount || 0).toString()]
                ],
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 4, lineColor: [200, 200, 200], lineWidth: 0.1 },
                headStyles: { fontStyle: 'bold', fillColor: false, textColor: [0, 0, 0] }
            });
        } else if (activeTab === 'gst' && salesData) {
            doc.setFont('times', 'bold');
            doc.setFontSize(12);
            doc.text('Tax Components', 14, contentStartY);

            autoTable(doc, {
                startY: contentStartY + 5,
                head: [['Tax Type', 'Amount']],
                body: [
                    ['CGST', formatCurrencyPDF(salesData.totalGST / 2)],
                    ['SGST', formatCurrencyPDF(salesData.totalGST / 2)],
                    ['Total', formatCurrencyPDF(salesData.totalGST)]
                ],
                theme: 'plain',
                headStyles: { fontStyle: 'bold', fillColor: false, textColor: [0, 0, 0] }
            });
        } else if (activeTab === 'advanced' && advancedData) {
            doc.setFont('times', 'bold');
            doc.setFontSize(12);
            doc.text('Summary', 14, contentStartY);

            autoTable(doc, {
                startY: contentStartY + 5,
                head: [['Metric', 'Value']],
                body: [
                    ['Revenue', formatCurrencyPDF(advancedData.financials.totalSales)],
                    ['Transactions', advancedData.financials.invoiceCount.toString()],
                    ['Inventory', formatCurrencyPDF(advancedData.inventory.currentValue)]
                ],
                theme: 'plain',
                headStyles: { fontStyle: 'bold', fillColor: false, textColor: [0, 0, 0] }
            });
        } else if (activeTab === 'branches' && branchComparison.length > 0) {
            doc.setFont('times', 'bold');
            doc.setFontSize(12);
            doc.text('Branch Comparison', 14, contentStartY);

            autoTable(doc, {
                startY: contentStartY + 5,
                head: [['Branch', 'Sales', 'Invoices']],
                body: branchComparison.map(b => [b.branchName, formatCurrencyPDF(b.totalSales), b.invoiceCount]),
                theme: 'plain',
                headStyles: { fontStyle: 'bold', fillColor: false, textColor: [0, 0, 0] }
            });
        }

        // Minimal footer
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        doc.line(14, 280, 196, 280);
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text('Confidential', 14, 287);
        doc.text('Page 1', 196, 287, { align: 'right' });

        if (returnDoc) return doc;
        doc.save(`${reportTitle.replace(/ /g, '_')}_Minimal_${dateRange.startDate}.pdf`);
    };

    // Template 4: Classic Business
    const generateClassicPDF = (returnDoc = false) => {
        const doc = new jsPDF();
        const branchName = currentBranch?.name || 'Pharmacy';
        const period = `${new Date(dateRange.startDate).toLocaleDateString()} to ${new Date(dateRange.endDate).toLocaleDateString()}`;

        let reportTitle = '';
        if (activeTab === 'sales') reportTitle = 'Sales Report';
        else if (activeTab === 'gst') reportTitle = 'GST Report';
        else if (activeTab === 'advanced') reportTitle = 'Business Report';
        else if (activeTab === 'branches') reportTitle = 'Branch Report';

        // Classic colors
        const classicGreen = [34, 87, 63];
        const classicGold = [184, 157, 102];

        // Classic bordered header
        doc.setDrawColor(...classicGreen);
        doc.setLineWidth(2);
        doc.rect(10, 10, 190, 40);

        doc.setFillColor(...classicGreen);
        doc.rect(10, 10, 190, 15, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('times', 'bold');
        doc.setFontSize(18);
        doc.text(branchName.toUpperCase(), 105, 20, { align: 'center' });

        doc.setTextColor(...classicGreen);
        doc.setFontSize(14);
        doc.text(reportTitle, 105, 35, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('times', 'normal');
        doc.text(`Reporting Period: ${period}`, 105, 44, { align: 'center' });

        // Gold accent line
        doc.setDrawColor(...classicGold);
        doc.setLineWidth(1);
        doc.line(30, 55, 180, 55);

        let contentStartY = 70;
        const tableHeadColor = [34, 87, 63];

        // Content
        if (activeTab === 'sales' && salesData) {
            doc.setTextColor(...classicGreen);
            doc.setFont('times', 'bold');
            doc.setFontSize(12);
            doc.text('FINANCIAL STATEMENT', 14, contentStartY);

            autoTable(doc, {
                startY: contentStartY + 5,
                head: [['Description', 'Amount (INR)']],
                body: [
                    ['Gross Sales', formatCurrencyPDF(salesData.totalSales)],
                    ['Tax Collected (GST)', formatCurrencyPDF(salesData.totalGST)],
                    ['Customer Discounts', formatCurrencyPDF(salesData.totalDiscount)],
                    ['Number of Transactions', (salesData.invoiceCount || 0).toString()]
                ],
                theme: 'grid',
                headStyles: { fillColor: tableHeadColor, font: 'times', fontStyle: 'bold' },
                styles: { font: 'times', fontSize: 10 }
            });

            if (salesData.paymentBreakdown?.length > 0) {
                let finalY = doc.lastAutoTable.finalY + 15;
                doc.text('PAYMENT ANALYSIS', 14, finalY);

                autoTable(doc, {
                    startY: finalY + 5,
                    head: [['Payment Mode', 'Transactions', 'Total Amount']],
                    body: salesData.paymentBreakdown.map(p => [p.method, p.count, formatCurrencyPDF(p.total)]),
                    theme: 'grid',
                    headStyles: { fillColor: [100, 100, 100], font: 'times' },
                    styles: { font: 'times' }
                });
            }
        } else if (activeTab === 'gst' && salesData) {
            doc.setTextColor(...classicGreen);
            doc.setFont('times', 'bold');
            doc.setFontSize(12);
            doc.text('TAX LIABILITY STATEMENT', 14, contentStartY);

            autoTable(doc, {
                startY: contentStartY + 5,
                head: [['Tax Category', 'Amount']],
                body: [
                    ['Central GST (CGST)', formatCurrencyPDF(salesData.totalGST / 2)],
                    ['State GST (SGST)', formatCurrencyPDF(salesData.totalGST / 2)],
                    ['Total Tax Liability', formatCurrencyPDF(salesData.totalGST)]
                ],
                theme: 'grid',
                headStyles: { fillColor: tableHeadColor }
            });
        } else if (activeTab === 'advanced' && advancedData) {
            doc.setTextColor(...classicGreen);
            doc.setFont('times', 'bold');
            doc.setFontSize(12);
            doc.text('EXECUTIVE SUMMARY', 14, contentStartY);

            autoTable(doc, {
                startY: contentStartY + 5,
                head: [['Performance Indicator', 'Value']],
                body: [
                    ['Total Revenue', formatCurrencyPDF(advancedData.financials.totalSales)],
                    ['Transaction Volume', advancedData.financials.invoiceCount.toString()],
                    ['Inventory Valuation', formatCurrencyPDF(advancedData.inventory.currentValue)]
                ],
                theme: 'grid',
                headStyles: { fillColor: tableHeadColor }
            });
        } else if (activeTab === 'branches' && branchComparison.length > 0) {
            doc.setTextColor(...classicGreen);
            doc.setFont('times', 'bold');
            doc.setFontSize(12);
            doc.text('BRANCH PERFORMANCE ANALYSIS', 14, contentStartY);

            autoTable(doc, {
                startY: contentStartY + 5,
                head: [['Branch Name', 'Total Sales', 'Transactions']],
                body: branchComparison.map(b => [b.branchName, formatCurrencyPDF(b.totalSales), b.invoiceCount]),
                theme: 'grid',
                headStyles: { fillColor: tableHeadColor }
            });
        }

        // Classic footer with border
        doc.setDrawColor(...classicGreen);
        doc.setLineWidth(1);
        doc.line(10, 275, 200, 275);

        doc.setFillColor(...classicGreen);
        doc.rect(10, 280, 190, 10, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text('OFFICIAL BUSINESS DOCUMENT', 105, 286, { align: 'center' });


        if (returnDoc) return doc;
        doc.save(`${reportTitle.replace(/ /g, '_')}_Classic_${dateRange.startDate}.pdf`);
    };

    // Template definitions for the modal
    const reportTemplates = [
        {
            id: 'executive',
            name: 'Executive',
            description: 'Professional navy design with corporate branding',
            icon: Crown,
            color: '#1a237e',
            generate: generatePremiumPDF
        },
        {
            id: 'modern',
            name: 'Modern Gradient',
            description: 'Vibrant purple-blue gradient with bold typography',
            icon: Sparkles,
            color: '#8b5cf6',
            generate: generateModernPDF
        },
        {
            id: 'minimal',
            name: 'Minimal Clean',
            description: 'Elegant black & white for formal documents',
            icon: FileCheck,
            color: '#374151',
            generate: generateMinimalPDF
        },
        {
            id: 'classic',
            name: 'Classic Business',
            description: 'Traditional green & gold letterhead style',
            icon: Palette,
            color: '#22573f',
            generate: generateClassicPDF
        }
    ];

    const handleGenerateClick = () => {
        // If basic plan, generate immediately without modal (or could show basic preview)
        if (!['PRO', 'PREMIUM', 'ENTERPRISE'].includes(subscriptionPlan)) {
            const doc = generateBasicPDF(true);
            const blob = doc.output('bloburl');
            setGeneratedBlobUrl(blob);
            setToastMsg('Report generated! Click Download to save.');
        } else {
            // Premium: Show modal
            setViewMode('grid');
            setShowTemplateModal(true);
        }
    };

    const handleTemplateSelect = (template) => {
        setSelectedTemplate(template);
        try {
            const doc = template.generate(true); // Return doc
            const blob = doc.output('bloburl');
            setPreviewBlobUrl(blob);
            setViewMode('preview');
        } catch (error) {
            console.error('Preview Generation Error:', error);
            alert('Error generating preview');
        }
    };

    const handleConfirmGeneration = () => {
        setGeneratedBlobUrl(previewBlobUrl);
        setShowTemplateModal(false);
        setToastMsg('Report generated! Click Download button to save.');
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

                    <div className="header-actions">
                        {generatedBlobUrl && (
                            <a
                                href={generatedBlobUrl}
                                download={`Report_${dateRange.startDate}.pdf`}
                                className="btn btn-success"
                            >
                                <Download size={18} />
                                Download PDF
                            </a>
                        )}

                        <button className="btn btn-primary" onClick={handleGenerateClick} title="Generate New Report">
                            <FileText size={18} />
                            Generate Report
                            {['PRO', 'PREMIUM', 'ENTERPRISE'].includes(subscriptionPlan) && (
                                <Crown size={14} className="ml-1" />
                            )}
                        </button>
                    </div>
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
            </main>

            {/* Toast Notification */}
            {toastMsg && (
                <div className="toast toast-success" style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
                    <Check size={20} />
                    {toastMsg}
                </div>
            )}

            {/* Template Selection Modal */}
            {showTemplateModal && (
                <div className="modal-overlay">
                    <div className={`modal template-modal ${viewMode === 'preview' ? 'modal-lg' : ''}`}>
                        <div className="modal-header">
                            <div>
                                {viewMode === 'preview' ? (
                                    <button
                                        className="btn btn-ghost btn-sm mb-2 p-0 text-muted"
                                        onClick={() => setViewMode('grid')}
                                    >
                                        <ArrowLeft size={16} className="mr-1" /> Back to Templates
                                    </button>
                                ) : (
                                    <h2 className="text-xl font-bold">Select Report Template</h2>
                                )}
                                {viewMode === 'grid' && (
                                    <p className="text-muted text-sm">Choose a professional design for your report</p>
                                )}
                            </div>
                            <button className="btn-icon" onClick={() => setShowTemplateModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        {viewMode === 'grid' ? (
                            <div className="templates-grid">
                                {reportTemplates.map(template => (
                                    <div
                                        key={template.id}
                                        className="template-card"
                                        onClick={() => handleTemplateSelect(template)}
                                    >
                                        <div className="template-preview" style={{ background: template.color }}>
                                            <div className="template-icon">
                                                <template.icon size={32} color="white" />
                                            </div>
                                            <div className="template-lines">
                                                <div className="line lg" style={{ width: '60%' }}></div>
                                                <div className="line" style={{ width: '80%' }}></div>
                                                <div className="line" style={{ width: '70%' }}></div>
                                                <div className="line" style={{ width: '40%' }}></div>
                                            </div>
                                        </div>
                                        <div className="template-info">
                                            <div className="template-name">
                                                {template.name}
                                                {template.id === 'executive' && <span className="badge badge-warning text-xs ml-2">PRO</span>}
                                            </div>
                                            <div className="template-desc">{template.description}</div>
                                        </div>
                                        <button className="btn btn-sm btn-outline w-full mt-3">Select Design</button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="template-preview-full">
                                <div className="preview-frame-container" style={{ height: '60vh', background: '#f0f0f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                                    {previewBlobUrl ? (
                                        <iframe
                                            src={previewBlobUrl}
                                            style={{ width: '100%', height: '100%', border: 'none' }}
                                            title="PDF Preview"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="spinner spinner-lg"></div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-between items-center bg-dark-surface-2 p-4 rounded-xl border border-dark-border">
                                    <div>
                                        <h3 className="font-bold">{selectedTemplate?.name}</h3>
                                        <p className="text-sm text-muted">Ready to generate</p>
                                    </div>
                                    <button
                                        className="btn btn-primary btn-lg"
                                        onClick={handleConfirmGeneration}
                                    >
                                        <FileCheck size={20} />
                                        Generate Report
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
