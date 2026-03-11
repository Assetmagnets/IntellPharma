const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize, requireBranchAccess, logAudit } = require('../middleware/auth');

const router = express.Router();

// =====================
// RACK CRUD
// =====================

// GET all racks for a branch (with utilization stats)
router.get('/:branchId', authenticate, requireBranchAccess, async (req, res) => {
    try {
        const { branchId } = req.params;

        const racks = await prisma.rack.findMany({
            where: { branchId, isActive: true },
            include: {
                shelves: {
                    orderBy: { levelNumber: 'asc' },
                    include: {
                        locations: {
                            include: {
                                product: {
                                    select: { id: true, name: true, genericName: true, quantity: true, expiryDate: true, form: true, storageType: true }
                                }
                            }
                        }
                    }
                },
                _count: {
                    select: { locations: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        // Add utilization stats
        const racksWithStats = racks.map(rack => {
            const totalLocations = rack.locations ? rack.locations.length : rack._count.locations;
            const capacity = rack.maxCapacity || (rack.totalShelves * 20); // default 20 items per shelf
            const utilization = capacity > 0 ? Math.round((totalLocations / capacity) * 100) : 0;

            // Check for near-expiry items
            const now = new Date();
            const sixtyDaysFromNow = new Date();
            sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

            let nearExpiryCount = 0;
            rack.shelves.forEach(shelf => {
                shelf.locations.forEach(loc => {
                    if (loc.product.expiryDate && new Date(loc.product.expiryDate) <= sixtyDaysFromNow && new Date(loc.product.expiryDate) >= now) {
                        nearExpiryCount++;
                    }
                });
            });

            return {
                ...rack,
                stats: {
                    itemCount: totalLocations,
                    capacity,
                    utilization: Math.min(utilization, 100),
                    nearExpiryCount
                }
            };
        });

        res.json(racksWithStats);
    } catch (error) {
        console.error('Get racks error:', error);
        res.status(500).json({ error: 'Failed to fetch racks.' });
    }
});

// CREATE a new rack (auto-creates shelves)
router.post('/:branchId', authenticate, authorize('OWNER', 'MANAGER'), requireBranchAccess, async (req, res) => {
    try {
        const { branchId } = req.params;
        const { name, type, description, totalShelves, categoryTags, maxCapacity } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Rack name is required.' });
        }

        const shelfCount = parseInt(totalShelves) || 5;

        const rack = await prisma.$transaction(async (tx) => {
            // Create the rack
            const newRack = await tx.rack.create({
                data: {
                    branchId,
                    name: name.trim(),
                    type: type || 'GENERAL',
                    description: description?.trim() || null,
                    totalShelves: shelfCount,
                    categoryTags: categoryTags || [],
                    maxCapacity: maxCapacity ? parseInt(maxCapacity) : null
                }
            });

            // Auto-create shelves
            const shelvesData = [];
            for (let i = 1; i <= shelfCount; i++) {
                // Priority: middle shelves get highest priority (eye-level = easiest access)
                const mid = Math.ceil(shelfCount / 2);
                const priority = Math.max(0, 10 - Math.abs(i - mid));

                shelvesData.push({
                    rackId: newRack.id,
                    name: `Shelf ${i}`,
                    levelNumber: i,
                    priority
                });
            }

            await tx.shelf.createMany({ data: shelvesData });

            // Return with shelves included
            return tx.rack.findUnique({
                where: { id: newRack.id },
                include: {
                    shelves: { orderBy: { levelNumber: 'asc' } }
                }
            });
        });

        await logAudit(req.user.id, branchId, 'CREATE', 'Rack', rack.id, `Created rack: ${rack.name} with ${shelfCount} shelves`, req.ip);

        res.status(201).json(rack);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'A rack with this name already exists in this branch.' });
        }
        console.error('Create rack error:', error);
        res.status(500).json({ error: 'Failed to create rack. ' + error.message });
    }
});

// UPDATE a rack (supports adding/removing shelves)
router.put('/:branchId/:rackId', authenticate, authorize('OWNER', 'MANAGER'), requireBranchAccess, async (req, res) => {
    try {
        const { branchId, rackId } = req.params;
        const { name, type, description, categoryTags, maxCapacity, totalShelves } = req.body;

        const result = await prisma.$transaction(async (tx) => {
            // Update basic rack info
            const updatedRack = await tx.rack.update({
                where: { id: rackId },
                data: {
                    name: name?.trim(),
                    type,
                    description: description?.trim(),
                    categoryTags,
                    maxCapacity: maxCapacity ? parseInt(maxCapacity) : undefined
                }
            });

            // Handle shelf count changes
            if (totalShelves !== undefined && totalShelves !== null) {
                const newShelfCount = parseInt(totalShelves);
                if (newShelfCount < 1) {
                    throw new Error('Rack must have at least 1 shelf.');
                }

                const existingShelves = await tx.shelf.findMany({
                    where: { rackId },
                    orderBy: { levelNumber: 'asc' },
                    include: { _count: { select: { locations: true } } }
                });

                const currentCount = existingShelves.length;

                if (newShelfCount > currentCount) {
                    // ADD new shelves
                    const shelvesData = [];
                    for (let i = currentCount + 1; i <= newShelfCount; i++) {
                        const mid = Math.ceil(newShelfCount / 2);
                        const priority = Math.max(0, 10 - Math.abs(i - mid));
                        shelvesData.push({
                            rackId,
                            name: `Shelf ${i}`,
                            levelNumber: i,
                            priority
                        });
                    }
                    await tx.shelf.createMany({ data: shelvesData });

                    console.log(`Added ${newShelfCount - currentCount} new shelves to rack ${updatedRack.name}`);
                } else if (newShelfCount < currentCount) {
                    // REMOVE shelves from the bottom, but only empty ones
                    const shelvesToRemove = existingShelves
                        .slice(newShelfCount)
                        .filter(s => s._count.locations === 0);

                    if (shelvesToRemove.length > 0) {
                        await tx.shelf.deleteMany({
                            where: { id: { in: shelvesToRemove.map(s => s.id) } }
                        });
                        console.log(`Removed ${shelvesToRemove.length} empty shelves from rack ${updatedRack.name}`);
                    }

                    const removedCount = shelvesToRemove.length;
                    const actualNewCount = currentCount - removedCount;
                    if (actualNewCount !== newShelfCount) {
                        console.log(`Could not remove all requested shelves — ${currentCount - newShelfCount - removedCount} shelf(s) still have products.`);
                    }
                }

                // Update totalShelves and maxCapacity
                const finalShelfCount = await tx.shelf.count({ where: { rackId } });
                await tx.rack.update({
                    where: { id: rackId },
                    data: {
                        totalShelves: finalShelfCount,
                        maxCapacity: maxCapacity ? parseInt(maxCapacity) : finalShelfCount * 20
                    }
                });
            }

            return tx.rack.findUnique({
                where: { id: rackId },
                include: { shelves: { orderBy: { levelNumber: 'asc' } } }
            });
        });

        await logAudit(req.user.id, branchId, 'UPDATE', 'Rack', result.id, `Updated rack: ${result.name}`, req.ip);

        res.json(result);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'A rack with this name already exists in this branch.' });
        }
        console.error('Update rack error:', error);
        res.status(500).json({ error: 'Failed to update rack. ' + error.message });
    }
});

// DELETE a rack (soft delete)
router.delete('/:branchId/:rackId', authenticate, authorize('OWNER', 'MANAGER'), requireBranchAccess, async (req, res) => {
    try {
        const { branchId, rackId } = req.params;

        // Check if rack has products assigned
        const locationCount = await prisma.productLocation.count({ where: { rackId } });

        if (locationCount > 0) {
            return res.status(400).json({
                error: `Cannot delete rack with ${locationCount} assigned product(s). Move or unassign them first.`
            });
        }

        await prisma.rack.update({
            where: { id: rackId },
            data: { isActive: false }
        });

        await logAudit(req.user.id, branchId, 'DELETE', 'Rack', rackId, `Soft deleted rack`, req.ip);

        res.json({ message: 'Rack deleted successfully.' });
    } catch (error) {
        console.error('Delete rack error:', error);
        res.status(500).json({ error: 'Failed to delete rack.' });
    }
});

// =====================
// SMART RACKING TOGGLE
// =====================

// GET /:branchId/racking-status — check if Smart Racking is enabled
router.get('/:branchId/racking-status', authenticate, requireBranchAccess, async (req, res) => {
    try {
        const branch = await prisma.branch.findUnique({
            where: { id: req.params.branchId },
            select: { smartRackingEnabled: true }
        });
        res.json({ enabled: branch?.smartRackingEnabled || false });
    } catch (error) {
        console.error('Racking status error:', error);
        res.status(500).json({ error: 'Failed to get racking status.' });
    }
});

// POST /:branchId/toggle-racking — enable or disable Smart Racking
router.post('/:branchId/toggle-racking', authenticate, authorize('OWNER', 'MANAGER'), requireBranchAccess, async (req, res) => {
    try {
        const { enabled } = req.body;
        await prisma.branch.update({
            where: { id: req.params.branchId },
            data: { smartRackingEnabled: !!enabled }
        });
        res.json({ enabled: !!enabled });
    } catch (error) {
        console.error('Toggle racking error:', error);
        res.status(500).json({ error: 'Failed to toggle racking.' });
    }
});

// =====================
// BACKFILL — assign unassigned products to racks
// =====================

// POST /:branchId/backfill
router.post('/:branchId/backfill', authenticate, authorize('OWNER', 'MANAGER'), requireBranchAccess, async (req, res) => {
    try {
        const { branchId } = req.params;

        // Find products with NO location entry
        const unassigned = await prisma.product.findMany({
            where: { branchId, isActive: true, locations: { none: {} } }
        });

        if (unassigned.length === 0) {
            // Still enable the flag even if no products to assign
            await prisma.branch.update({ where: { id: branchId }, data: { smartRackingEnabled: true } });
            return res.json({ message: 'All products already assigned.', assigned: 0 });
        }

        // Find or create a GENERAL rack
        let rack = await prisma.rack.findFirst({
            where: { branchId, isActive: true, type: 'GENERAL' },
            include: {
                shelves: {
                    orderBy: { priority: 'desc' },
                    include: { _count: { select: { locations: true } } }
                }
            }
        });

        if (!rack) {
            const shelfCount = 5;
            rack = await prisma.$transaction(async (tx) => {
                const newRack = await tx.rack.create({
                    data: {
                        branchId,
                        name: 'General Rack',
                        type: 'GENERAL',
                        description: 'Auto-created default rack',
                        totalShelves: shelfCount,
                        categoryTags: [],
                        maxCapacity: shelfCount * 20
                    }
                });
                const shelvesData = [];
                for (let i = 1; i <= shelfCount; i++) {
                    const mid = Math.ceil(shelfCount / 2);
                    const priority = Math.max(0, 10 - Math.abs(i - mid));
                    shelvesData.push({ rackId: newRack.id, name: `Shelf ${i}`, levelNumber: i, priority });
                }
                await tx.shelf.createMany({ data: shelvesData });
                return tx.rack.findUnique({
                    where: { id: newRack.id },
                    include: {
                        shelves: {
                            orderBy: { priority: 'desc' },
                            include: { _count: { select: { locations: true } } }
                        }
                    }
                });
            });
        }

        // Assign each product to the least-occupied shelf
        let assignedCount = 0;
        for (const product of unassigned) {
            const freshShelves = await prisma.shelf.findMany({
                where: { rackId: rack.id },
                orderBy: { priority: 'desc' },
                include: { _count: { select: { locations: true } } }
            });

            if (!freshShelves || freshShelves.length === 0) {
                console.error('No shelves found for rack', rack.id);
                continue;
            }

            const bestShelf = freshShelves.reduce((best, shelf) => {
                if (shelf._count.locations < best._count.locations) return shelf;
                if (shelf._count.locations === best._count.locations && shelf.priority > best.priority) return shelf;
                return best;
            }, freshShelves[0]);

            const existingInShelf = bestShelf._count.locations;
            const binLabel = `${String.fromCharCode(65 + (existingInShelf % 26))}${Math.floor(existingInShelf / 26) + 1}`;

            await prisma.productLocation.create({
                data: {
                    productId: product.id,
                    branchId,
                    rackId: rack.id,
                    shelfId: bestShelf.id,
                    binLabel,
                    quantity: parseFloat(product.quantity) || 0
                }
            });
            assignedCount++;
        }

        await logAudit(req.user.id, branchId, 'CREATE', 'ProductLocation', null, `Backfill: assigned ${assignedCount} products to racks`, req.ip);

        // Enable Smart Racking for this branch
        await prisma.branch.update({ where: { id: branchId }, data: { smartRackingEnabled: true } });

        res.json({ message: `Successfully assigned ${assignedCount} product(s) to racks.`, assigned: assignedCount });
    } catch (error) {
        console.error('Backfill error:', error);
        res.status(500).json({ error: 'Failed to backfill products.' });
    }
});

// =====================
// SMART LOCATION ASSIGNMENT
// =====================

// POST suggest-location: AI-driven suggestion for where to place a product
router.post('/:branchId/suggest-location', authenticate, requireBranchAccess, async (req, res) => {
    try {
        const { branchId } = req.params;
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ error: 'Product ID is required.' });
        }

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        // 1. Check if product is already placed somewhere
        const existingLocation = await prisma.productLocation.findFirst({
            where: { productId, branchId },
            include: {
                rack: true,
                shelf: true
            }
        });

        if (existingLocation) {
            return res.json({
                suggestion: {
                    rackId: existingLocation.rackId,
                    rackName: existingLocation.rack.name,
                    shelfId: existingLocation.shelfId,
                    shelfName: existingLocation.shelf.name,
                    binLabel: existingLocation.binLabel,
                    reason: 'Product already has an assigned location.'
                },
                isExisting: true
            });
        }

        // 2. Find racks matching storage type
        const matchingRacks = await prisma.rack.findMany({
            where: {
                branchId,
                isActive: true,
                type: product.storageType || 'GENERAL'
            },
            include: {
                shelves: {
                    orderBy: { priority: 'desc' }, // Best access first
                    include: {
                        _count: { select: { locations: true } }
                    }
                },
                _count: { select: { locations: true } }
            },
            orderBy: { name: 'asc' }
        });

        if (matchingRacks.length === 0) {
            // Fallback: suggest any GENERAL rack
            const anyRack = await prisma.rack.findFirst({
                where: { branchId, isActive: true, type: 'GENERAL' },
                include: {
                    shelves: {
                        orderBy: { priority: 'desc' },
                        include: { _count: { select: { locations: true } } }
                    }
                }
            });

            if (!anyRack) {
                return res.status(404).json({ error: 'No racks available. Please create a rack first.' });
            }

            matchingRacks.push(anyRack);
        }

        // 3. Check if another product with same first letter is already in a rack
        const firstLetter = product.name.charAt(0).toUpperCase();
        const siblingLocation = await prisma.productLocation.findFirst({
            where: {
                branchId,
                product: {
                    name: { startsWith: firstLetter, mode: 'insensitive' }
                }
            },
            include: { rack: true, shelf: true }
        });

        let selectedRack = null;
        let selectedShelf = null;
        let reason = '';

        if (siblingLocation && matchingRacks.find(r => r.id === siblingLocation.rackId)) {
            // Place near alphabetical siblings
            selectedRack = matchingRacks.find(r => r.id === siblingLocation.rackId);
            reason = `Grouped alphabetically with other "${firstLetter}" medicines in ${selectedRack.name}.`;
        } else {
            // Pick the rack with least utilization
            selectedRack = matchingRacks.reduce((best, rack) => {
                const capacity = rack.maxCapacity || (rack.totalShelves * 20);
                const usage = rack._count.locations / capacity;
                const bestCapacity = best.maxCapacity || (best.totalShelves * 20);
                const bestUsage = best._count.locations / bestCapacity;
                return usage < bestUsage ? rack : best;
            }, matchingRacks[0]);
            reason = `Assigned to ${selectedRack.name} (${selectedRack.type} storage, lowest utilization).`;
        }

        // 4. Pick best shelf based on product form
        const shelves = selectedRack.shelves;
        if (product.form === 'SYRUP' || product.form === 'INJECTION') {
            // Heavier/liquid items -> lower shelves (higher levelNumber)
            selectedShelf = shelves.reduce((best, s) =>
                s.levelNumber > best.levelNumber ? s : best, shelves[0]);
            reason += ` Placed on lower shelf (${selectedShelf.name}) for easy handling of ${product.form.toLowerCase()}.`;
        } else {
            // Tablets & others -> highest priority (eye-level)
            selectedShelf = shelves.reduce((best, s) =>
                s.priority > best.priority ? s : best, shelves[0]);
            reason += ` Placed on ${selectedShelf.name} (eye-level, priority ${selectedShelf.priority}).`;
        }

        // 5. Generate bin label
        const existingInShelf = await prisma.productLocation.count({
            where: { shelfId: selectedShelf.id }
        });
        const binLabel = `${String.fromCharCode(65 + (existingInShelf % 26))}${Math.floor(existingInShelf / 26) + 1}`;

        res.json({
            suggestion: {
                rackId: selectedRack.id,
                rackName: selectedRack.name,
                rackType: selectedRack.type,
                shelfId: selectedShelf.id,
                shelfName: selectedShelf.name,
                shelfLevel: selectedShelf.levelNumber,
                binLabel,
                reason
            },
            isExisting: false
        });
    } catch (error) {
        console.error('Suggest location error:', error);
        res.status(500).json({ error: 'Failed to suggest location.' });
    }
});

// POST assign-location: Assign a product to a rack/shelf
router.post('/:branchId/assign-location', authenticate, authorize('OWNER', 'MANAGER', 'INVENTORY_STAFF'), requireBranchAccess, async (req, res) => {
    try {
        const { branchId } = req.params;
        const { productId, rackId, shelfId, binLabel, quantity } = req.body;

        if (!productId || !rackId || !shelfId) {
            return res.status(400).json({ error: 'Product ID, Rack ID, and Shelf ID are required.' });
        }

        // Check if product already assigned to this shelf
        const existing = await prisma.productLocation.findUnique({
            where: { productId_shelfId: { productId, shelfId } }
        });

        let location;
        if (existing) {
            // Update quantity
            location = await prisma.productLocation.update({
                where: { id: existing.id },
                data: {
                    quantity: quantity !== undefined ? parseFloat(quantity) : existing.quantity,
                    binLabel: binLabel || existing.binLabel
                },
                include: {
                    rack: true,
                    shelf: true,
                    product: { select: { id: true, name: true } }
                }
            });
        } else {
            location = await prisma.productLocation.create({
                data: {
                    productId,
                    branchId,
                    rackId,
                    shelfId,
                    binLabel: binLabel || null,
                    quantity: parseFloat(quantity || 0)
                },
                include: {
                    rack: true,
                    shelf: true,
                    product: { select: { id: true, name: true } }
                }
            });
        }

        await logAudit(req.user.id, branchId, 'ASSIGN_LOCATION', 'Product', productId,
            `Assigned ${location.product.name} to ${location.rack.name} > ${location.shelf.name}`, req.ip);

        res.status(201).json(location);
    } catch (error) {
        console.error('Assign location error:', error);
        res.status(500).json({ error: 'Failed to assign location.' });
    }
});

// POST move-product: Move a product from one shelf to another
router.post('/:branchId/move-product', authenticate, authorize('OWNER', 'MANAGER', 'INVENTORY_STAFF'), requireBranchAccess, async (req, res) => {
    try {
        const { branchId } = req.params;
        const { productId, fromShelfId, toRackId, toShelfId, quantity, binLabel } = req.body;

        if (!productId || !fromShelfId || !toShelfId) {
            return res.status(400).json({ error: 'Product ID, source shelf, and target shelf are required.' });
        }

        const sourceLocation = await prisma.productLocation.findUnique({
            where: { productId_shelfId: { productId, shelfId: fromShelfId } }
        });

        if (!sourceLocation) {
            return res.status(404).json({ error: 'Product not found at the source location.' });
        }

        const moveQty = quantity !== undefined ? parseFloat(quantity) : parseFloat(sourceLocation.quantity);

        const result = await prisma.$transaction(async (tx) => {
            // Deduct from source
            const newSourceQty = parseFloat(sourceLocation.quantity) - moveQty;
            if (newSourceQty <= 0) {
                await tx.productLocation.delete({ where: { id: sourceLocation.id } });
            } else {
                await tx.productLocation.update({
                    where: { id: sourceLocation.id },
                    data: { quantity: newSourceQty }
                });
            }

            // Add to destination
            const existingDest = await tx.productLocation.findUnique({
                where: { productId_shelfId: { productId, shelfId: toShelfId } }
            });

            let destLocation;
            if (existingDest) {
                destLocation = await tx.productLocation.update({
                    where: { id: existingDest.id },
                    data: { quantity: { increment: moveQty } }
                });
            } else {
                destLocation = await tx.productLocation.create({
                    data: {
                        productId,
                        branchId,
                        rackId: toRackId,
                        shelfId: toShelfId,
                        binLabel: binLabel || null,
                        quantity: moveQty
                    }
                });
            }

            return destLocation;
        });

        await logAudit(req.user.id, branchId, 'MOVE_PRODUCT', 'Product', productId,
            `Moved ${moveQty} units from shelf ${fromShelfId} to shelf ${toShelfId}`, req.ip);

        res.json({ message: 'Product moved successfully.', location: result });
    } catch (error) {
        console.error('Move product error:', error);
        res.status(500).json({ error: 'Failed to move product.' });
    }
});

// DELETE unassign a product from a location
router.delete('/:branchId/location/:locationId', authenticate, authorize('OWNER', 'MANAGER', 'INVENTORY_STAFF'), requireBranchAccess, async (req, res) => {
    try {
        const { branchId, locationId } = req.params;

        await prisma.productLocation.delete({
            where: { id: locationId }
        });

        await logAudit(req.user.id, branchId, 'UNASSIGN_LOCATION', 'ProductLocation', locationId,
            `Removed product location assignment`, req.ip);

        res.json({ message: 'Product unassigned from location.' });
    } catch (error) {
        console.error('Unassign location error:', error);
        res.status(500).json({ error: 'Failed to unassign product.' });
    }
});

// =====================
// SEARCH & FIND
// =====================

// GET find product location(s)
router.get('/:branchId/find-product', authenticate, requireBranchAccess, async (req, res) => {
    try {
        const { branchId } = req.params;
        const { q } = req.query;

        if (!q || !q.trim()) {
            return res.status(400).json({ error: 'Search query is required.' });
        }

        const searchTerm = q.trim();

        // Find products matching the search
        const products = await prisma.product.findMany({
            where: {
                branchId,
                isActive: true,
                OR: [
                    { name: { contains: searchTerm, mode: 'insensitive' } },
                    { genericName: { contains: searchTerm, mode: 'insensitive' } },
                    { manufacturer: { contains: searchTerm, mode: 'insensitive' } },
                    { barcode: { contains: searchTerm } }
                ]
            },
            include: {
                locations: {
                    include: {
                        rack: { select: { id: true, name: true, type: true } },
                        shelf: { select: { id: true, name: true, levelNumber: true } }
                    }
                }
            },
            take: 20,
            orderBy: { name: 'asc' }
        });

        res.json(products);
    } catch (error) {
        console.error('Find product location error:', error);
        res.status(500).json({ error: 'Failed to search products.' });
    }
});

// =====================
// RACK MAP (Visual overview)
// =====================

// GET full rack map for visual display
router.get('/:branchId/map/overview', authenticate, requireBranchAccess, async (req, res) => {
    try {
        const { branchId } = req.params;

        const racks = await prisma.rack.findMany({
            where: { branchId, isActive: true },
            include: {
                shelves: {
                    orderBy: { levelNumber: 'asc' },
                    include: {
                        locations: {
                            include: {
                                product: {
                                    select: {
                                        id: true, name: true, quantity: true,
                                        expiryDate: true, minStock: true,
                                        form: true, storageType: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { name: 'asc' }
        });

        // Compute alerts per rack
        const now = new Date();
        const sixtyDaysFromNow = new Date();
        sixtyDaysFromNow.setDate(now.getDate() + 60);

        const rackMap = racks.map(rack => {
            let lowStockCount = 0;
            let nearExpiryCount = 0;
            let totalItems = 0;

            rack.shelves.forEach(shelf => {
                shelf.locations.forEach(loc => {
                    totalItems++;
                    const p = loc.product;
                    if (parseFloat(p.quantity) <= p.minStock) lowStockCount++;
                    if (p.expiryDate && new Date(p.expiryDate) <= sixtyDaysFromNow && new Date(p.expiryDate) >= now) {
                        nearExpiryCount++;
                    }
                });
            });

            const capacity = rack.maxCapacity || (rack.totalShelves * 20);

            return {
                id: rack.id,
                name: rack.name,
                type: rack.type,
                description: rack.description,
                totalShelves: rack.totalShelves,
                shelves: rack.shelves.map(shelf => ({
                    id: shelf.id,
                    name: shelf.name,
                    levelNumber: shelf.levelNumber,
                    priority: shelf.priority,
                    items: shelf.locations.map(loc => ({
                        locationId: loc.id,
                        productId: loc.product.id,
                        productName: loc.product.name,
                        quantity: loc.quantity,
                        binLabel: loc.binLabel,
                        isLowStock: parseFloat(loc.product.quantity) <= loc.product.minStock,
                        isNearExpiry: loc.product.expiryDate &&
                            new Date(loc.product.expiryDate) <= sixtyDaysFromNow &&
                            new Date(loc.product.expiryDate) >= now
                    }))
                })),
                stats: {
                    totalItems,
                    capacity,
                    utilization: capacity > 0 ? Math.min(Math.round((totalItems / capacity) * 100), 100) : 0,
                    lowStockCount,
                    nearExpiryCount
                }
            };
        });

        res.json(rackMap);
    } catch (error) {
        console.error('Get rack map error:', error);
        res.status(500).json({ error: 'Failed to fetch rack map.' });
    }
});

// =====================
// ALERTS
// =====================

// GET racking alerts (overfilled, near-expiry, duplicates)
router.get('/:branchId/alerts/all', authenticate, requireBranchAccess, async (req, res) => {
    try {
        const { branchId } = req.params;
        const alerts = [];

        const racks = await prisma.rack.findMany({
            where: { branchId, isActive: true },
            include: {
                _count: { select: { locations: true } }
            }
        });

        // 1. Overfilled racks
        racks.forEach(rack => {
            const capacity = rack.maxCapacity || (rack.totalShelves * 20);
            const usage = rack._count.locations;
            if (usage >= capacity * 0.9) {
                alerts.push({
                    type: 'RACK_FULL',
                    severity: usage >= capacity ? 'critical' : 'warning',
                    rackId: rack.id,
                    rackName: rack.name,
                    message: `${rack.name} is at ${Math.round((usage / capacity) * 100)}% capacity (${usage}/${capacity} items).`
                });
            }
        });

        // 2. Near-expiry items in racks
        const sixtyDaysFromNow = new Date();
        sixtyDaysFromNow.setDate(new Date().getDate() + 60);

        const nearExpiryLocations = await prisma.productLocation.findMany({
            where: {
                branchId,
                product: {
                    expiryDate: { lte: sixtyDaysFromNow, gte: new Date() }
                }
            },
            include: {
                product: { select: { name: true, expiryDate: true } },
                rack: { select: { name: true } },
                shelf: { select: { name: true } }
            }
        });

        nearExpiryLocations.forEach(loc => {
            alerts.push({
                type: 'NEAR_EXPIRY',
                severity: 'warning',
                rackName: loc.rack.name,
                shelfName: loc.shelf.name,
                productName: loc.product.name,
                expiryDate: loc.product.expiryDate,
                message: `${loc.product.name} in ${loc.rack.name} > ${loc.shelf.name} expires on ${new Date(loc.product.expiryDate).toLocaleDateString()}.`
            });
        });

        // 3. Duplicate product locations (same product in multiple racks)
        const duplicates = await prisma.$queryRaw`
            SELECT "productId", COUNT(DISTINCT "rackId") as rack_count
            FROM "ProductLocation"
            WHERE "branchId" = ${branchId}
            GROUP BY "productId"
            HAVING COUNT(DISTINCT "rackId") > 1
        `;

        for (const dup of duplicates) {
            const product = await prisma.product.findUnique({ where: { id: dup.productId }, select: { name: true } });
            if (product) {
                alerts.push({
                    type: 'DUPLICATE_LOCATION',
                    severity: 'info',
                    productName: product.name,
                    rackCount: Number(dup.rack_count),
                    message: `${product.name} is stored in ${dup.rack_count} different racks. Consider consolidating.`
                });
            }
        }

        res.json(alerts);
    } catch (error) {
        console.error('Get racking alerts error:', error);
        res.status(500).json({ error: 'Failed to fetch racking alerts.' });
    }
});

// =====================
// SINGLE RACK DETAIL (must be LAST — /:branchId/:rackId is a catch-all)
// =====================
router.get('/:branchId/:rackId', authenticate, requireBranchAccess, async (req, res) => {
    try {
        const { rackId } = req.params;

        const rack = await prisma.rack.findUnique({
            where: { id: rackId },
            include: {
                shelves: {
                    orderBy: { levelNumber: 'asc' },
                    include: {
                        locations: {
                            include: {
                                product: {
                                    select: {
                                        id: true, name: true, genericName: true, manufacturer: true,
                                        quantity: true, expiryDate: true, batchNumber: true,
                                        form: true, storageType: true, mrp: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!rack) {
            return res.status(404).json({ error: 'Rack not found.' });
        }

        res.json(rack);
    } catch (error) {
        console.error('Get rack detail error:', error);
        res.status(500).json({ error: 'Failed to fetch rack details.' });
    }
});

// =====================
// SMART RACKING TOGGLE
// =====================

// GET racking status for a branch
router.get('/:branchId/racking-status', authenticate, requireBranchAccess, async (req, res) => {
    try {
        const { branchId } = req.params;
        const branch = await prisma.branch.findUnique({
            where: { id: branchId },
            select: { smartRackingEnabled: true }
        });
        res.json({ enabled: branch?.smartRackingEnabled || false });
    } catch (error) {
        console.error('Get racking status error:', error);
        res.status(500).json({ error: 'Failed to get racking status.' });
    }
});

// POST toggle racking on/off
router.post('/:branchId/toggle-racking', authenticate, authorize('OWNER', 'MANAGER'), requireBranchAccess, async (req, res) => {
    try {
        const { branchId } = req.params;
        const { enabled } = req.body;
        await prisma.branch.update({
            where: { id: branchId },
            data: { smartRackingEnabled: !!enabled }
        });
        console.log(`Smart Racking ${enabled ? 'ENABLED' : 'DISABLED'} for branch ${branchId}`);
        res.json({ success: true, enabled: !!enabled });
    } catch (error) {
        console.error('Toggle racking error:', error);
        res.status(500).json({ error: 'Failed to toggle racking.' });
    }
});

// POST backfill — auto-assign all unassigned products to racks
router.post('/:branchId/backfill', authenticate, authorize('OWNER', 'MANAGER'), requireBranchAccess, async (req, res) => {
    try {
        const { branchId } = req.params;

        // Find all products NOT yet assigned to any rack
        const unassigned = await prisma.product.findMany({
            where: {
                branchId,
                isActive: true,
                locations: { none: {} }
            }
        });

        if (unassigned.length === 0) {
            // Still enable the flag even if nothing to backfill
            await prisma.branch.update({
                where: { id: branchId },
                data: { smartRackingEnabled: true }
            });
            return res.json({ message: 'No unassigned products found.', assigned: 0 });
        }

        // Find or create a General Rack
        let rack = await prisma.rack.findFirst({
            where: { branchId, isActive: true },
            include: {
                shelves: {
                    orderBy: { levelNumber: 'asc' },
                    include: { _count: { select: { locations: true } } }
                }
            }
        });

        if (!rack) {
            rack = await prisma.rack.create({
                data: {
                    branchId,
                    name: 'General Rack',
                    type: 'GENERAL',
                    description: 'Auto-created default rack',
                    totalShelves: 5,
                    maxCapacity: 100,
                    shelves: {
                        create: Array.from({ length: 5 }, (_, i) => ({
                            name: `Shelf ${i + 1}`,
                            levelNumber: i + 1
                        }))
                    }
                },
                include: {
                    shelves: {
                        orderBy: { levelNumber: 'asc' },
                        include: { _count: { select: { locations: true } } }
                    }
                }
            });
        }

        // Assign each product to the least-occupied shelf
        let assignedCount = 0;
        for (const product of unassigned) {
            // Refresh shelf counts
            const freshShelves = await prisma.shelf.findMany({
                where: { rackId: rack.id },
                orderBy: { levelNumber: 'asc' },
                include: { _count: { select: { locations: true } } }
            });

            if (freshShelves.length === 0) continue;

            // Pick the shelf with fewest items
            const leastOccupied = freshShelves.reduce((min, shelf) =>
                shelf._count.locations < min._count.locations ? shelf : min
                , freshShelves[0]);

            const position = leastOccupied._count.locations + 1;
            const binLabel = `${String.fromCharCode(65 + (position - 1))}${leastOccupied.levelNumber}`;

            await prisma.rackLocation.create({
                data: {
                    rackId: rack.id,
                    shelfId: leastOccupied.id,
                    productId: product.id,
                    position,
                    binLabel
                }
            });
            assignedCount++;
        }

        // Enable Smart Racking in the database
        await prisma.branch.update({
            where: { id: branchId },
            data: { smartRackingEnabled: true }
        });

        console.log(`Backfill complete: ${assignedCount} products assigned for branch ${branchId}`);
        res.json({ message: `Successfully assigned ${assignedCount} product(s) to racks.`, assigned: assignedCount });
    } catch (error) {
        console.error('Backfill error:', error);
        res.status(500).json({ error: 'Failed to backfill products.' });
    }
});

module.exports = router;
