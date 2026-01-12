const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize, requireBranchAccess, logAudit } = require('../middleware/auth');

const router = express.Router();

// IMPORTANT: Place specific routes BEFORE generic parameterized routes

// Get single product by ID or barcode - MUST BE BEFORE /:branchId
router.get('/:branchId/find', authenticate, requireBranchAccess, async (req, res) => {
    try {
        const { branchId } = req.params;
        const { barcode, id } = req.query;

        console.log('Find product request:', { branchId, barcode, id });

        let product;
        if (barcode) {
            product = await prisma.product.findFirst({
                where: { branchId, barcode, isActive: true }
            });
        } else if (id) {
            product = await prisma.product.findFirst({
                where: { branchId, id, isActive: true }
            });
        }

        if (!product) {
            console.log('Product not found for:', { barcode, id });
            return res.status(404).json({ error: 'Product not found.' });
        }

        console.log('Found product:', product.name);
        res.json(product);
    } catch (error) {
        console.error('Find product error:', error);
        res.status(500).json({ error: 'Failed to find product.' });
    }
});

// Get low stock alerts - MUST BE BEFORE /:branchId
router.get('/:branchId/alerts/low-stock', authenticate, requireBranchAccess, async (req, res) => {
    try {
        const { branchId } = req.params;

        const products = await prisma.$queryRaw`
      SELECT * FROM "Product" 
      WHERE "branchId" = ${branchId} 
      AND "isActive" = true 
      AND "quantity" <= "minStock"
      ORDER BY "quantity" ASC
    `;

        res.json(products);
    } catch (error) {
        console.error('Low stock alerts error:', error);
        res.status(500).json({ error: 'Failed to fetch low stock alerts.' });
    }
});

// Get expiring soon products - MUST BE BEFORE /:branchId
router.get('/:branchId/alerts/expiring', authenticate, requireBranchAccess, async (req, res) => {
    try {
        const { branchId } = req.params;
        const sixtyDaysFromNow = new Date();
        sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
        console.log('DEBUG: Fetching expiring products', { branchId, now: new Date(), limit: sixtyDaysFromNow });

        const products = await prisma.product.findMany({
            where: {
                branchId,
                isActive: true,
                expiryDate: {
                    lte: sixtyDaysFromNow,
                    gte: new Date()
                }
            },
            orderBy: { expiryDate: 'asc' }
        });

        console.log('DEBUG: Found expiring products:', products.length);
        res.json(products);
    } catch (error) {
        console.error('Expiring products error:', error);
        res.status(500).json({ error: 'Failed to fetch expiring products.' });
    }
});

// Get critical alerts (Low Stock AND Expiring < 60 days) - MUST BE BEFORE /:branchId
router.get('/:branchId/alerts/critical', authenticate, requireBranchAccess, async (req, res) => {
    try {
        const { branchId } = req.params;
        const sixtyDaysFromNow = new Date();
        sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

        const products = await prisma.$queryRaw`
            SELECT * FROM "Product"
            WHERE "branchId" = ${branchId}
            AND "isActive" = true
            AND "quantity" <= "minStock"
            AND "expiryDate" <= ${sixtyDaysFromNow}
            ORDER BY "expiryDate" ASC
        `;

        res.json(products);
    } catch (error) {
        console.error('Critical alerts error:', error);
        res.status(500).json({ error: 'Failed to fetch critical alerts.' });
    }
});

// Get all products for a branch (with optional search)
router.get('/:branchId', authenticate, requireBranchAccess, async (req, res) => {
    try {
        const { branchId } = req.params;
        const { search, lowStock, expired } = req.query;

        console.log('Get products request:', { branchId, search, lowStock, expired });

        let where = { branchId, isActive: true };

        // Search by name, generic name, or barcode
        if (search && search.trim()) {
            const searchTerm = search.trim();
            where = {
                AND: [
                    { branchId, isActive: true },
                    {
                        OR: [
                            { name: { contains: searchTerm, mode: 'insensitive' } },
                            { genericName: { contains: searchTerm, mode: 'insensitive' } },
                            { barcode: { contains: searchTerm } }
                        ]
                    }
                ]
            };
        }

        if (lowStock === 'true') {
            where.quantity = { lte: prisma.product.fields.minStock };
        }

        if (expired === 'true') {
            where.expiryDate = { lte: new Date() };
        }

        const products = await prisma.product.findMany({
            where,
            orderBy: { name: 'asc' }
        });

        console.log('Found products:', products.length);
        res.json(products);
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Failed to fetch products.' });
    }
});

// Add new product
router.post('/:branchId', authenticate, authorize('OWNER', 'MANAGER', 'INVENTORY_STAFF'), requireBranchAccess, async (req, res) => {
    try {
        const { branchId } = req.params;
        const {
            name,
            genericName,
            manufacturer,
            barcode,
            batchNumber,
            expiryDate,
            mrp,
            purchasePrice,
            gstRate,
            hsnCode,
            quantity,
            minStock,
            unit
        } = req.body;

        // Validate required fields
        if (!name || !mrp || !purchasePrice) {
            return res.status(400).json({ error: 'Name, MRP, and Purchase Price are required.' });
        }

        // Parse expiry date properly - add time component for ISO-8601
        let parsedExpiryDate = null;
        if (expiryDate && expiryDate.trim() !== '') {
            // If it's just a date (YYYY-MM-DD), add time to make it a valid ISO DateTime
            parsedExpiryDate = new Date(expiryDate + 'T00:00:00.000Z');
        }

        const product = await prisma.product.create({
            data: {
                name: name.trim(),
                genericName: genericName?.trim() || null,
                manufacturer: manufacturer?.trim() || null,
                barcode: barcode?.trim() || null,
                batchNumber: batchNumber?.trim() || null,
                expiryDate: parsedExpiryDate,
                mrp: parseFloat(mrp),
                purchasePrice: parseFloat(purchasePrice),
                gstRate: parseFloat(gstRate || 12),
                hsnCode: hsnCode?.trim() || null,
                quantity: parseInt(quantity || 0),
                minStock: parseInt(minStock || 10),
                unit: unit?.trim() || 'Pcs',
                branchId
            }
        });

        await logAudit(req.user.id, branchId, 'CREATE', 'Product', product.id, `Created product: ${product.name}`, req.ip);

        res.status(201).json(product);
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Failed to create product. ' + error.message });
    }
});

// Update product
router.put('/:branchId/:productId', authenticate, authorize('OWNER', 'MANAGER', 'INVENTORY_STAFF'), requireBranchAccess, async (req, res) => {
    try {
        const { branchId, productId } = req.params;
        const updateData = req.body;

        const product = await prisma.product.update({
            where: { id: productId },
            data: {
                ...updateData,
                mrp: updateData.mrp ? parseFloat(updateData.mrp) : undefined,
                purchasePrice: updateData.purchasePrice ? parseFloat(updateData.purchasePrice) : undefined,
                gstRate: updateData.gstRate ? parseFloat(updateData.gstRate) : undefined,
                quantity: updateData.quantity !== undefined ? parseInt(updateData.quantity) : undefined,
                minStock: updateData.minStock ? parseInt(updateData.minStock) : undefined
            }
        });

        await logAudit(req.user.id, branchId, 'UPDATE', 'Product', product.id, `Updated product: ${product.name}`, req.ip);

        res.json(product);
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Failed to update product.' });
    }
});

// Update stock quantity
router.patch('/:branchId/:productId/stock', authenticate, authorize('OWNER', 'MANAGER', 'INVENTORY_STAFF'), requireBranchAccess, async (req, res) => {
    try {
        const { branchId, productId } = req.params;
        const { quantity, operation } = req.body; // operation: 'add' or 'set'

        const currentProduct = await prisma.product.findUnique({ where: { id: productId } });

        let newQuantity;
        if (operation === 'add') {
            newQuantity = currentProduct.quantity + parseInt(quantity);
        } else {
            newQuantity = parseInt(quantity);
        }

        const product = await prisma.product.update({
            where: { id: productId },
            data: { quantity: newQuantity }
        });

        await logAudit(req.user.id, branchId, 'STOCK_UPDATE', 'Product', product.id,
            `Stock ${operation}: ${quantity}, New total: ${newQuantity}`, req.ip);

        res.json(product);
    } catch (error) {
        console.error('Update stock error:', error);
        res.status(500).json({ error: 'Failed to update stock.' });
    }
});

// Delete product (Smart Delete)
router.delete('/:branchId/:productId', authenticate, authorize('OWNER', 'MANAGER'), requireBranchAccess, async (req, res) => {
    try {
        const { branchId, productId } = req.params;

        // Check if product is used in invoices or stock transfers
        const [invoiceCount, transferCount] = await Promise.all([
            prisma.invoiceItem.count({ where: { productId } }),
            prisma.stockTransferItem.count({ where: { productId } })
        ]);

        if (invoiceCount === 0 && transferCount === 0) {
            // HARD DELETE: Remove from DB completely if never sold or transferred
            await prisma.product.delete({
                where: { id: productId }
            });
            await logAudit(req.user.id, branchId, 'DELETE_FOREVER', 'Product', productId, 'Hard deleted unused product', req.ip);
            res.json({
                message: 'Product permanently removed from database.',
                deletedType: 'HARD'
            });
        } else {
            // SOFT DELETE: Hide if it has dependencies
            const product = await prisma.product.update({
                where: { id: productId },
                data: { isActive: false }
            });

            const reason = invoiceCount > 0 ? 'sales history' : 'stock transfers';
            await logAudit(req.user.id, branchId, 'DELETE_SOFT', 'Product', product.id, `Soft deleted product due to ${reason}: ${product.name}`, req.ip);

            res.json({
                message: `Product archived because it has ${reason}.`,
                deletedType: 'SOFT'
            });
        }
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Failed to delete product.' });
    }
});

module.exports = router;
