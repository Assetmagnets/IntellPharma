const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { authenticate, authorize, requireBranchAccess, logAudit, requireConfirmation } = require('../middleware/auth');

const router = express.Router();

// Get all branches (Owner only - for "All Branches" view)
router.get('/', authenticate, authorize('OWNER'), async (req, res) => {
    try {
        const branches = await prisma.branch.findMany({
            where: { ownerId: req.user.id, isActive: true },
            include: {
                subscription: true,
                _count: {
                    select: {
                        users: true,
                        products: true,
                        invoices: true
                    }
                }
            }
        });

        res.json(branches);
    } catch (error) {
        console.error('Get branches error:', error);
        res.status(500).json({ error: 'Failed to fetch branches.' });
    }
});

// Get single branch details
router.get('/:branchId', authenticate, requireBranchAccess, async (req, res) => {
    try {
        const { branchId } = req.params;

        const branch = await prisma.branch.findUnique({
            where: { id: branchId },
            include: {
                subscription: true,
                owner: {
                    select: { name: true, email: true }
                }
            }
        });

        if (!branch) {
            return res.status(404).json({ error: 'Branch not found.' });
        }

        res.json(branch);
    } catch (error) {
        console.error('Get branch error:', error);
        res.status(500).json({ error: 'Failed to fetch branch.' });
    }
});

// Create new branch
router.post('/', authenticate, authorize('OWNER'), async (req, res) => {
    try {
        const { name, address, phone, gstNumber } = req.body;

        // Check subscription limits
        const existingBranches = await prisma.branch.count({
            where: { ownerId: req.user.id, isActive: true }
        });

        const subscription = await prisma.subscription.findFirst({
            where: {
                branch: { ownerId: req.user.id }
            },
            orderBy: { createdAt: 'desc' }
        });

        const maxBranches = subscription ? subscription.maxBranches + subscription.extraBranches : 1;

        if (existingBranches >= maxBranches) {
            return res.status(403).json({
                error: 'Branch limit reached.',
                message: `Your plan allows ${maxBranches} branches. Upgrade to add more.`,
                currentCount: existingBranches,
                limit: maxBranches
            });
        }

        const branch = await prisma.branch.create({
            data: {
                name,
                address,
                phone,
                gstNumber,
                ownerId: req.user.id
            }
        });

        // Give owner access to the new branch
        await prisma.branchUser.create({
            data: {
                userId: req.user.id,
                branchId: branch.id,
                role: 'OWNER'
            }
        });

        await logAudit(req.user.id, branch.id, 'CREATE', 'Branch', branch.id, `Created branch: ${name}`, req.ip);

        res.status(201).json(branch);
    } catch (error) {
        console.error('Create branch error:', error);
        res.status(500).json({ error: 'Failed to create branch.' });
    }
});

// Update branch
router.put('/:branchId', authenticate, authorize('OWNER', 'MANAGER'), requireBranchAccess, async (req, res) => {
    try {
        const { branchId } = req.params;
        const { name, address, phone, gstNumber } = req.body;

        const branch = await prisma.branch.update({
            where: { id: branchId },
            data: { name, address, phone, gstNumber }
        });

        await logAudit(req.user.id, branchId, 'UPDATE', 'Branch', branchId, `Updated branch: ${name}`, req.ip);

        res.json(branch);
    } catch (error) {
        console.error('Update branch error:', error);
        res.status(500).json({ error: 'Failed to update branch.' });
    }
});

// Get branch users
router.get('/:branchId/users', authenticate, authorize('OWNER', 'MANAGER'), requireBranchAccess, async (req, res) => {
    try {
        const { branchId } = req.params;

        const users = await prisma.branchUser.findMany({
            where: { branchId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        isActive: true,
                        createdAt: true
                    }
                }
            }
        });

        res.json(users.map(bu => ({
            id: bu.id,
            role: bu.role,
            joinedAt: bu.createdAt,
            user: bu.user
        })));
    } catch (error) {
        console.error('Get branch users error:', error);
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
});

// Add user to branch
router.post('/:branchId/users', authenticate, authorize('OWNER', 'MANAGER'), requireBranchAccess, async (req, res) => {
    try {
        const { branchId } = req.params;
        const { email, password, name, phone, role } = req.body;

        // Check if user exists
        let user = await prisma.user.findUnique({ where: { email } });

        if (user) {
            // Check if user already has access to this branch
            const existingAccess = await prisma.branchUser.findUnique({
                where: { userId_branchId: { userId: user.id, branchId } }
            });

            if (existingAccess) {
                return res.status(400).json({ error: 'User already has access to this branch.' });
            }
        } else {
            // Create new user
            const hashedPassword = await bcrypt.hash(password, 12);
            user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    phone,
                    role
                }
            });
        }

        // Grant branch access
        await prisma.branchUser.create({
            data: {
                userId: user.id,
                branchId,
                role
            }
        });

        await logAudit(req.user.id, branchId, 'ADD_USER', 'Branch', branchId,
            `Added user ${email} with role ${role}`, req.ip);

        res.status(201).json({
            id: user.id,
            email: user.email,
            name: user.name,
            role
        });
    } catch (error) {
        console.error('Add user to branch error:', error);
        res.status(500).json({ error: 'Failed to add user.' });
    }
});

// Remove user from branch
router.delete('/:branchId/users/:userId', authenticate, authorize('OWNER', 'MANAGER'), requireBranchAccess, requireConfirmation, async (req, res) => {
    try {
        const { branchId, userId } = req.params;

        await prisma.branchUser.delete({
            where: { userId_branchId: { userId, branchId } }
        });

        await logAudit(req.user.id, branchId, 'REMOVE_USER', 'Branch', branchId,
            `Removed user ${userId}`, req.ip);

        res.json({ message: 'User removed from branch.' });
    } catch (error) {
        console.error('Remove user error:', error);
        res.status(500).json({ error: 'Failed to remove user.' });
    }
});

// Update branch user (role/details)
router.put('/:branchId/users/:userId', authenticate, authorize('OWNER', 'MANAGER'), requireBranchAccess, async (req, res) => {
    try {
        const { branchId, userId } = req.params;
        const { name, phone, role } = req.body;

        // Check if user exists in branch
        const branchUser = await prisma.branchUser.findUnique({
            where: { userId_branchId: { userId, branchId } }
        });

        if (!branchUser) {
            return res.status(404).json({ error: 'User not found in this branch.' });
        }

        // Prevent modifying own role
        if (userId === req.user.id && role !== branchUser.role) {
            return res.status(403).json({ error: 'You cannot change your own role.' });
        }

        // Update role in BranchUser
        if (role) {
            await prisma.branchUser.update({
                where: { userId_branchId: { userId, branchId } },
                data: { role }
            });
        }

        // Update user details (name/phone) - only if allowed/appropriate
        // NOTE: In a multi-tenant system, changing global user details from one branch might be risky.
        // Assuming here it's fine for Owner/Manager to update staff contact info.
        await prisma.user.update({
            where: { id: userId },
            data: { name, phone }
        });

        await logAudit(req.user.id, branchId, 'UPDATE_USER', 'BranchUser', userId,
            `Updated user ${userId} details/role`, req.ip);

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user.' });
    }
});

// Get user activity (audit logs)
router.get('/:branchId/users/:userId/activity', authenticate, authorize('OWNER', 'MANAGER'), requireBranchAccess, async (req, res) => {
    try {
        const { branchId, userId } = req.params;

        const activity = await prisma.auditLog.findMany({
            where: {
                branchId,
                userId
            },
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { name: true } }
            }
        });

        res.json(activity);
    } catch (error) {
        console.error('Get user activity error:', error);
        res.status(500).json({ error: 'Failed to fetch user activity.' });
    }
});

// Get branch performance comparison (Owner only)
router.get('/comparison/performance', authenticate, authorize('OWNER'), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const branches = await prisma.branch.findMany({
            where: { ownerId: req.user.id, isActive: true },
            select: { id: true, name: true }
        });

        let dateFilter = {};
        if (startDate && endDate) {
            const endObj = new Date(endDate);
            endObj.setHours(23, 59, 59, 999);

            dateFilter = {
                createdAt: {
                    gte: new Date(startDate),
                    lte: endObj
                }
            };
        }

        const performance = await Promise.all(
            branches.map(async (branch) => {
                const [sales, invoiceCount, productCount] = await Promise.all([
                    prisma.invoice.aggregate({
                        where: { branchId: branch.id, ...dateFilter },
                        _sum: { totalAmount: true }
                    }),
                    prisma.invoice.count({
                        where: { branchId: branch.id, ...dateFilter }
                    }),
                    prisma.product.count({
                        where: { branchId: branch.id, isActive: true }
                    })
                ]);

                return {
                    branchId: branch.id,
                    branchName: branch.name,
                    totalSales: Number(sales._sum.totalAmount || 0),
                    invoiceCount,
                    productCount
                };
            })
        );

        res.json(performance);
    } catch (error) {
        console.error('Branch comparison error:', error);
        res.status(500).json({ error: 'Failed to fetch branch comparison.' });
    }
});

module.exports = router;
