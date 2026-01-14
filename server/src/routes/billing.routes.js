const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize, requireBranchAccess, logAudit } = require('../middleware/auth');

const router = express.Router();

// Generate invoice number
const generateInvoiceNumber = async (branchId) => {
    const date = new Date();
    const prefix = `INV${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;

    const lastInvoice = await prisma.invoice.findFirst({
        where: { invoiceNumber: { startsWith: prefix } },
        orderBy: { invoiceNumber: 'desc' }
    });

    let sequence = 1;
    if (lastInvoice) {
        const lastSequence = parseInt(lastInvoice.invoiceNumber.slice(-6));
        sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(6, '0')}`;
};

// Calculate GST
const calculateGST = (amount, gstRate, isInterState = false) => {
    const gstAmount = (amount * gstRate) / 100;
    if (isInterState) {
        return { cgst: 0, sgst: 0, igst: gstAmount };
    }
    return { cgst: gstAmount / 2, sgst: gstAmount / 2, igst: 0 };
};

// Create new invoice
router.post('/:branchId', authenticate, authorize('OWNER', 'MANAGER', 'PHARMACIST', 'BILLING_STAFF'), requireBranchAccess, async (req, res) => {
    try {
        const { branchId } = req.params;
        const {
            customerName,
            customerPhone,
            customerAddress,
            items,
            discountPercent = 0, // Changed: now accepts percentage
            paymentMethod = 'CASH',
            isInterState = false,
            notes
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Invoice must have at least one item.' });
        }

        const result = await prisma.$transaction(async (tx) => {
            const invoiceNumber = await generateInvoiceNumber(branchId);

            let subtotal = 0;
            let totalCgst = 0;
            let totalSgst = 0;
            let totalIgst = 0;
            const invoiceItems = [];

            // Process each item
            for (const item of items) {
                const product = await tx.product.findUnique({ where: { id: item.productId } });

                if (!product) {
                    throw new Error(`Product not found: ${item.productId}`);
                }

                // Convert Prisma Decimals to Numbers for comparison and math
                const currentStock = Number(product.quantity);
                const requestedQty = Number(item.quantity);

                if (currentStock < requestedQty) {
                    throw new Error(`Insufficient stock for ${product.name}. Available: ${currentStock}`);
                }

                const itemSubtotal = parseFloat(product.mrp) * requestedQty;
                // Item discount is also treated as percentage
                const itemDiscountPercent = parseFloat(item.discount || 0);
                const itemDiscountAmount = (itemSubtotal * itemDiscountPercent) / 100;
                const taxableAmount = itemSubtotal - itemDiscountAmount;
                const gst = calculateGST(taxableAmount, parseFloat(product.gstRate), isInterState);
                const itemTotal = taxableAmount + gst.cgst + gst.sgst + gst.igst;

                subtotal += itemSubtotal;
                totalCgst += gst.cgst;
                totalSgst += gst.sgst;
                totalIgst += gst.igst;

                invoiceItems.push({
                    productId: product.id,
                    productName: product.name,
                    quantity: requestedQty,
                    unitPrice: product.mrp,
                    discount: itemDiscountAmount, // Store the calculated amount
                    gstRate: product.gstRate,
                    cgst: gst.cgst,
                    sgst: gst.sgst,
                    igst: gst.igst,
                    total: itemTotal
                });

                // Update stock and auto-archive if zero
                const newQuantity = currentStock - requestedQty;
                const shouldArchive = newQuantity <= 0;

                await tx.product.update({
                    where: { id: product.id },
                    data: {
                        quantity: newQuantity,
                        isActive: !shouldArchive // Deactivate if stock is 0 or less
                    }
                });
            }

            // Calculate overall discount from percentage
            const overallDiscountAmount = (subtotal * parseFloat(discountPercent)) / 100;
            const totalAmount = subtotal - overallDiscountAmount + totalCgst + totalSgst + totalIgst;

            // Create invoice with items
            const invoice = await tx.invoice.create({
                data: {
                    invoiceNumber,
                    customerName,
                    customerPhone,
                    customerAddress,
                    subtotal,
                    discountAmount: overallDiscountAmount, // Store calculated amount from percentage
                    cgstAmount: totalCgst,
                    sgstAmount: totalSgst,
                    igstAmount: totalIgst,
                    totalAmount,
                    paymentMethod,
                    notes,
                    branchId,
                    createdById: req.user.id,
                    items: {
                        create: invoiceItems
                    }
                },
                include: {
                    items: true,
                    branch: {
                        select: {
                            name: true,
                            address: true,
                            gstNumber: true,
                            phone: true
                        }
                    }
                }
            });

            return invoice;
        });

        await logAudit(req.user.id, branchId, 'CREATE', 'Invoice', result.id,
            `Created invoice: ${result.invoiceNumber}, Amount: ${result.totalAmount}`, req.ip);

        res.status(201).json(result);
    } catch (error) {
        console.error('Create invoice error:', error);
        res.status(500).json({ error: error.message || 'Failed to create invoice.' });
    }
});

// Get all invoices for a branch
router.get('/:branchId', authenticate, requireBranchAccess, async (req, res) => {
    try {
        const { branchId } = req.params;
        const { startDate, endDate, status, page = 1, limit = 20 } = req.query;

        let where = { branchId };

        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        if (status) {
            where.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [invoices, total] = await Promise.all([
            prisma.invoice.findMany({
                where,
                include: {
                    createdBy: {
                        select: { name: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.invoice.count({ where })
        ]);

        res.json({
            invoices,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get invoices error:', error);
        res.status(500).json({ error: 'Failed to fetch invoices.' });
    }
});

// Get single invoice
router.get('/:branchId/:invoiceId', authenticate, requireBranchAccess, async (req, res) => {
    try {
        const { invoiceId } = req.params;

        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                items: {
                    include: {
                        product: {
                            select: { barcode: true, hsnCode: true }
                        }
                    }
                },
                branch: true,
                createdBy: {
                    select: { name: true, email: true }
                },
                returns: true
            }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found.' });
        }

        res.json(invoice);
    } catch (error) {
        console.error('Get invoice error:', error);
        res.status(500).json({ error: 'Failed to fetch invoice.' });
    }
});

// Process return
router.post('/:branchId/:invoiceId/return', authenticate, authorize('OWNER', 'MANAGER', 'BILLING_STAFF'), requireBranchAccess, async (req, res) => {
    try {
        const { branchId, invoiceId } = req.params;
        const { reason, refundAmount, returnItems } = req.body;

        const result = await prisma.$transaction(async (tx) => {
            const invoice = await tx.invoice.findUnique({
                where: { id: invoiceId },
                include: { items: true }
            });

            if (!invoice) {
                throw new Error('Invoice not found.');
            }

            // Restore stock for returned items
            for (const returnItem of returnItems) {
                const invoiceItem = invoice.items.find(i => i.id === returnItem.invoiceItemId);
                if (invoiceItem) {
                    await tx.product.update({
                        where: { id: invoiceItem.productId },
                        data: { quantity: { increment: returnItem.quantity } }
                    });
                }
            }

            // Create return record
            const returnRecord = await tx.return.create({
                data: {
                    invoiceId,
                    reason,
                    refundAmount: parseFloat(refundAmount),
                    creditNote: `CN-${invoice.invoiceNumber}`
                }
            });

            // Update invoice status
            await tx.invoice.update({
                where: { id: invoiceId },
                data: { status: 'REFUNDED' }
            });

            return returnRecord;
        });

        await logAudit(req.user.id, branchId, 'RETURN', 'Invoice', invoiceId,
            `Processed return. Refund: ${refundAmount}`, req.ip);

        res.json(result);
    } catch (error) {
        console.error('Process return error:', error);
        res.status(500).json({ error: error.message || 'Failed to process return.' });
    }
});

// Helper to safely convert Decimal to Number
const toNum = (val) => {
    if (!val) return 0;
    if (val && val.toNumber) return val.toNumber();
    return Number(val) || 0;
};

// Get sales summary
router.get('/:branchId/reports/summary', authenticate, authorize('OWNER', 'MANAGER'), requireBranchAccess, async (req, res) => {
    try {
        const { branchId } = req.params;
        const { startDate, endDate } = req.query;

        const where = { branchId };
        if (startDate && endDate) {
            const endObj = new Date(endDate);
            endObj.setHours(23, 59, 59, 999);

            where.createdAt = {
                gte: new Date(startDate),
                lte: endObj
            };
        }

        const [summary, paymentBreakdown] = await Promise.all([
            prisma.invoice.aggregate({
                where,
                _sum: {
                    totalAmount: true,
                    cgstAmount: true,
                    sgstAmount: true,
                    igstAmount: true,
                    discountAmount: true
                },
                _count: true
            }),
            prisma.invoice.groupBy({
                by: ['paymentMethod'],
                where,
                _sum: { totalAmount: true },
                _count: true
            })
        ]);

        res.json({
            totalSales: toNum(summary._sum.totalAmount),
            totalGST: toNum(summary._sum.cgstAmount) + toNum(summary._sum.sgstAmount) + toNum(summary._sum.igstAmount),
            totalDiscount: toNum(summary._sum.discountAmount),
            invoiceCount: summary._count,
            paymentBreakdown: paymentBreakdown.map(p => ({
                method: p.paymentMethod,
                total: p._sum.totalAmount,
                count: p._count
            }))
        });
    } catch (error) {
        console.error('Sales summary error:', error);
        res.status(500).json({ error: 'Failed to fetch sales summary.' });
    }
});

// Get advanced report data
router.get('/:branchId/reports/advanced', authenticate, authorize('OWNER', 'MANAGER'), requireBranchAccess, async (req, res) => {
    try {
        const { branchId } = req.params;
        const { startDate, endDate } = req.query;

        const endObj = new Date(endDate);
        endObj.setHours(23, 59, 59, 999);

        const dateFilter = {
            createdAt: {
                gte: new Date(startDate),
                lte: endObj
            }
        };

        const [
            summary,
            paymentBreakdown,
            topProducts,
            inventoryValuation
        ] = await Promise.all([
            // 1. Financial Summary
            prisma.invoice.aggregate({
                where: { branchId, ...dateFilter },
                _sum: {
                    totalAmount: true,
                    discountAmount: true,
                    cgstAmount: true,
                    sgstAmount: true,
                    igstAmount: true
                },
                _count: true
            }),
            // 2. Payment Method Breakdown
            prisma.invoice.groupBy({
                by: ['paymentMethod'],
                where: { branchId, ...dateFilter },
                _sum: { totalAmount: true },
                _count: true
            }),
            // 3. Top Selling Products
            prisma.invoiceItem.groupBy({
                by: ['productName'],
                where: {
                    invoice: { branchId, ...dateFilter }
                },
                _sum: {
                    quantity: true,
                    total: true
                },
                orderBy: {
                    _sum: { quantity: 'desc' }
                },
                take: 5
            }),
            // 4. Current Inventory Value (Snapshop - not historical)
            prisma.product.aggregate({
                where: { branchId, isActive: true },
                _sum: {
                    purchasePrice: true, // This is unit price, need to multiply in app or here if possible. 
                    // Prisma aggregate doesn't support multiplication directly easily without raw query.
                    // We'll estimate or just count items for now. 
                },
                _count: true
            })
        ]);

        // Calculate accurate inventory value
        // Since we can't easily do sum(qty * price) in simple prisma aggregate, let's do a raw query for it or fetch all.
        // For a report, accuracy matters. Let's use raw query for inventory value.
        const stockValueResult = await prisma.$queryRaw`
            SELECT SUM("quantity" * "purchasePrice") as "totalValue" 
            FROM "Product" 
            WHERE "branchId" = ${branchId} AND "isActive" = true
        `;
        const currentStockValue = stockValueResult[0]?.totalValue || 0;

        res.json({
            period: { startDate, endDate },
            financials: {
                totalSales: toNum(summary._sum.totalAmount),
                totalGST: toNum(summary._sum.cgstAmount) + toNum(summary._sum.sgstAmount) + toNum(summary._sum.igstAmount),
                totalDiscount: toNum(summary._sum.discountAmount),
                invoiceCount: summary._count
            },
            paymentBreakdown: paymentBreakdown.map(p => ({
                method: p.paymentMethod,
                total: p._sum.totalAmount,
                count: p._count
            })),
            topProducts: topProducts.map(p => ({
                name: p.productName,
                quantity: p._sum.quantity,
                revenue: p._sum.total
            })),
            inventory: {
                currentValue: currentStockValue,
                productCount: inventoryValuation._count
            }
        });

    } catch (error) {
        console.error('Advanced report error:', error);
        res.status(500).json({ error: 'Failed to generate report.' });
    }
});

module.exports = router;
