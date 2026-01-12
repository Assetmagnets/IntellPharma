const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Subscription plans configuration
const PLANS = {
    BASIC: {
        name: 'Basic',
        price: 0,
        maxBranches: 1,
        aiEnabled: false,
        analyticsEnabled: false,
        features: ['Single branch', 'Basic billing', 'Inventory management']
    },
    PRO: {
        name: 'Pro',
        price: 999,
        maxBranches: 3,
        aiEnabled: true,
        analyticsEnabled: true,
        features: ['Up to 3 branches', 'AI insights', 'Advanced analytics', 'GST reports']
    },
    PREMIUM: {
        name: 'Premium',
        price: 1999,
        maxBranches: 10,
        aiEnabled: true,
        analyticsEnabled: true,
        features: ['Up to 10 branches', 'Full AI suite', 'Custom reports', 'Priority support', 'API access']
    },
    ENTERPRISE: {
        name: 'Enterprise',
        price: null, // Custom pricing
        maxBranches: 999,
        aiEnabled: true,
        analyticsEnabled: true,
        features: ['Unlimited branches', 'Dedicated support', 'Custom integrations', 'SLA guarantee']
    }
};

const EXTRA_BRANCH_PRICE = 500;

// Get available plans
router.get('/plans', async (req, res) => {
    res.json({
        plans: Object.entries(PLANS).map(([key, plan]) => ({
            id: key,
            ...plan
        })),
        extraBranchPrice: EXTRA_BRANCH_PRICE
    });
});

// Get current subscription (Owner only)
router.get('/current', authenticate, authorize('OWNER'), async (req, res) => {
    try {
        const subscription = await prisma.subscription.findFirst({
            where: {
                branch: { ownerId: req.user.id }
            },
            include: {
                branch: {
                    select: { id: true, name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!subscription) {
            return res.status(404).json({ error: 'No subscription found.' });
        }

        const branchCount = await prisma.branch.count({
            where: { ownerId: req.user.id, isActive: true }
        });

        const planDetails = PLANS[subscription.plan];

        res.json({
            ...subscription,
            planDetails,
            usage: {
                branchCount,
                maxBranches: subscription.maxBranches + subscription.extraBranches,
                remaining: subscription.maxBranches + subscription.extraBranches - branchCount
            }
        });
    } catch (error) {
        console.error('Get subscription error:', error);
        res.status(500).json({ error: 'Failed to fetch subscription.' });
    }
});

// Upgrade/Change subscription (Owner only)
router.post('/upgrade', authenticate, authorize('OWNER'), async (req, res) => {
    try {
        const { plan, extraBranches = 0 } = req.body;

        if (!PLANS[plan]) {
            return res.status(400).json({ error: 'Invalid plan.' });
        }

        const planConfig = PLANS[plan];

        // Find existing subscription
        const existingSubscription = await prisma.subscription.findFirst({
            where: {
                branch: { ownerId: req.user.id }
            }
        });

        if (!existingSubscription) {
            return res.status(404).json({ error: 'No subscription found to upgrade.' });
        }

        // Calculate prorated amount (simplified - in production use proper billing logic)
        const daysRemaining = existingSubscription.endDate
            ? Math.max(0, Math.ceil((existingSubscription.endDate - new Date()) / (1000 * 60 * 60 * 24)))
            : 30;

        const currentPlanPrice = PLANS[existingSubscription.plan]?.price || 0;
        const newPlanPrice = planConfig.price || 0;
        const proratedCredit = (currentPlanPrice / 30) * daysRemaining;
        const extraBranchCost = extraBranches * EXTRA_BRANCH_PRICE;
        const totalDue = Math.max(0, newPlanPrice + extraBranchCost - proratedCredit);

        // Update subscription
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);

        const updatedSubscription = await prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: {
                plan,
                maxBranches: planConfig.maxBranches,
                extraBranches,
                aiEnabled: planConfig.aiEnabled,
                analyticsEnabled: planConfig.analyticsEnabled,
                startDate: new Date(),
                endDate
            }
        });

        res.json({
            subscription: updatedSubscription,
            billing: {
                proratedCredit,
                newPlanPrice,
                extraBranchCost,
                totalDue
            },
            message: `Successfully upgraded to ${planConfig.name} plan!`
        });
    } catch (error) {
        console.error('Upgrade subscription error:', error);
        res.status(500).json({ error: 'Failed to upgrade subscription.' });
    }
});

// Add extra branches
router.post('/add-branches', authenticate, authorize('OWNER'), async (req, res) => {
    try {
        const { count = 1 } = req.body;

        const subscription = await prisma.subscription.findFirst({
            where: {
                branch: { ownerId: req.user.id }
            }
        });

        if (!subscription) {
            return res.status(404).json({ error: 'No subscription found.' });
        }

        const updatedSubscription = await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                extraBranches: subscription.extraBranches + count
            }
        });

        res.json({
            subscription: updatedSubscription,
            cost: count * EXTRA_BRANCH_PRICE,
            message: `Added ${count} extra branch(es) to your subscription.`
        });
    } catch (error) {
        console.error('Add branches error:', error);
        res.status(500).json({ error: 'Failed to add extra branches.' });
    }
});

// Cancel auto-renewal
router.post('/cancel-renewal', authenticate, authorize('OWNER'), async (req, res) => {
    try {
        const subscription = await prisma.subscription.findFirst({
            where: {
                branch: { ownerId: req.user.id }
            }
        });

        if (!subscription) {
            return res.status(404).json({ error: 'No subscription found.' });
        }

        await prisma.subscription.update({
            where: { id: subscription.id },
            data: { autoRenew: false }
        });

        res.json({
            message: 'Auto-renewal cancelled. Your subscription will remain active until the end date.',
            endDate: subscription.endDate
        });
    } catch (error) {
        console.error('Cancel renewal error:', error);
        res.status(500).json({ error: 'Failed to cancel renewal.' });
    }
});

// Get billing history (placeholder - integrate with payment provider)
router.get('/billing-history', authenticate, authorize('OWNER'), async (req, res) => {
    try {
        // In production, integrate with Razorpay/Stripe to fetch real invoices
        res.json({
            invoices: [],
            message: 'Billing history integration pending with payment provider.'
        });
    } catch (error) {
        console.error('Billing history error:', error);
        res.status(500).json({ error: 'Failed to fetch billing history.' });
    }
});

// Feature gating middleware (export for use in other routes)
const requireFeature = (feature) => {
    return async (req, res, next) => {
        try {
            const subscription = await prisma.subscription.findFirst({
                where: {
                    branch: { ownerId: req.user.id }
                }
            });

            if (!subscription) {
                return res.status(403).json({ error: 'No active subscription found.' });
            }

            if (feature === 'ai' && !subscription.aiEnabled) {
                return res.status(403).json({
                    error: 'AI features require Pro plan or higher.',
                    upgradeURL: '/subscription/upgrade'
                });
            }

            if (feature === 'analytics' && !subscription.analyticsEnabled) {
                return res.status(403).json({
                    error: 'Analytics features require Pro plan or higher.',
                    upgradeURL: '/subscription/upgrade'
                });
            }

            next();
        } catch (error) {
            return res.status(500).json({ error: 'Error checking subscription.' });
        }
    };
};

module.exports = router;
module.exports.requireFeature = requireFeature;
module.exports.PLANS = PLANS;
