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

const EXTRA_BRANCH_PRICE = 499;

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

        // If subscription has stripeSubscriptionId but no stripeCurrentPeriodEnd, fetch from Stripe
        let stripeCurrentPeriodEnd = subscription.stripeCurrentPeriodEnd;
        let stripeSubscriptionId = subscription.stripeSubscriptionId;
        let autoRenew = subscription.autoRenew;

        // Case 1: Has stripeSubscriptionId but no period end - fetch directly
        if (stripeSubscriptionId && !stripeCurrentPeriodEnd) {
            try {
                const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
                const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
                if (stripeSub.current_period_end) {
                    stripeCurrentPeriodEnd = new Date(stripeSub.current_period_end * 1000);
                    autoRenew = !stripeSub.cancel_at_period_end;
                    await prisma.subscription.update({
                        where: { id: subscription.id },
                        data: { stripeCurrentPeriodEnd, autoRenew }
                    });
                    console.log('✅ subscription/current: Updated stripeCurrentPeriodEnd from Stripe');
                }
            } catch (stripeError) {
                console.error('Failed to fetch billing date from Stripe:', stripeError.message);
            }
        }

        // Case 2: No stripeSubscriptionId but has extraBranches - look up via customer
        if (!stripeSubscriptionId && subscription.extraBranches > 0) {
            try {
                const user = await prisma.user.findUnique({ where: { id: req.user.id } });
                if (user?.stripeCustomerId) {
                    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
                    const subscriptions = await stripe.subscriptions.list({
                        customer: user.stripeCustomerId,
                        status: 'active',
                        limit: 1
                    });
                    if (subscriptions.data.length > 0) {
                        const stripeSub = subscriptions.data[0];
                        stripeSubscriptionId = stripeSub.id;
                        stripeCurrentPeriodEnd = new Date(stripeSub.current_period_end * 1000);
                        autoRenew = !stripeSub.cancel_at_period_end;

                        // Update database
                        await prisma.subscription.update({
                            where: { id: subscription.id },
                            data: {
                                stripeSubscriptionId,
                                stripeCurrentPeriodEnd,
                                autoRenew
                            }
                        });
                        console.log('✅ subscription/current: Found and saved Stripe subscription via customer lookup');
                    }
                }
            } catch (stripeError) {
                console.error('Failed to lookup Stripe subscription:', stripeError.message);
            }
        }

        console.log('🔍 subscription/current: Returning subscription data');
        console.log('🔍 subscription/current: maxBranches:', subscription.maxBranches);
        console.log('🔍 subscription/current: extraBranches:', subscription.extraBranches);
        console.log('🔍 subscription/current: total:', subscription.maxBranches + subscription.extraBranches);

        res.json({
            ...subscription,
            stripeSubscriptionId, // Override with fetched value
            stripeCurrentPeriodEnd, // Override with fetched value
            autoRenew, // Override with fetched value
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

// Cancel auto-renewal (stops future charges but keeps subscription active until period end)
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

        // If there's a Stripe subscription, cancel it at period end
        if (subscription.stripeSubscriptionId) {
            try {
                const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

                // Set cancel_at_period_end to true - subscription stays active but won't renew
                const updatedStripeSub = await stripe.subscriptions.update(
                    subscription.stripeSubscriptionId,
                    { cancel_at_period_end: true }
                );

                console.log(`✅ Stripe subscription ${subscription.stripeSubscriptionId} set to cancel at period end`);
                console.log(`📅 Will cancel on: ${new Date(updatedStripeSub.current_period_end * 1000).toISOString()}`);

                // Update local database
                await prisma.subscription.update({
                    where: { id: subscription.id },
                    data: {
                        autoRenew: false,
                        endDate: new Date(updatedStripeSub.current_period_end * 1000)
                    }
                });

                return res.json({
                    success: true,
                    message: 'Auto-renewal cancelled. Your subscription will remain active until the end of the billing period.',
                    endDate: new Date(updatedStripeSub.current_period_end * 1000),
                    cancelAtPeriodEnd: true
                });
            } catch (stripeError) {
                console.error('Stripe cancellation error:', stripeError);
                // If Stripe call fails, still update local DB
            }
        }

        // Fallback: Update local database only (for non-Stripe subscriptions)
        await prisma.subscription.update({
            where: { id: subscription.id },
            data: { autoRenew: false }
        });

        res.json({
            success: true,
            message: 'Auto-renewal cancelled. Your subscription will remain active until the end date.',
            endDate: subscription.endDate
        });
    } catch (error) {
        console.error('Cancel renewal error:', error);
        res.status(500).json({ error: 'Failed to cancel renewal.' });
    }
});

// Reactivate auto-renewal (if user changes their mind before subscription ends)
router.post('/reactivate-renewal', authenticate, authorize('OWNER'), async (req, res) => {
    try {
        const subscription = await prisma.subscription.findFirst({
            where: {
                branch: { ownerId: req.user.id }
            }
        });

        if (!subscription) {
            return res.status(404).json({ error: 'No subscription found.' });
        }

        // If there's a Stripe subscription, reactivate it
        if (subscription.stripeSubscriptionId) {
            try {
                const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

                // Set cancel_at_period_end to false - subscription will continue renewing
                const updatedStripeSub = await stripe.subscriptions.update(
                    subscription.stripeSubscriptionId,
                    { cancel_at_period_end: false }
                );

                console.log(`✅ Stripe subscription ${subscription.stripeSubscriptionId} reactivated`);

                // Update local database
                await prisma.subscription.update({
                    where: { id: subscription.id },
                    data: {
                        autoRenew: true,
                        endDate: null // Clear end date since subscription will continue
                    }
                });

                return res.json({
                    success: true,
                    message: 'Auto-renewal reactivated! Your subscription will continue automatically.',
                    autoRenew: true
                });
            } catch (stripeError) {
                console.error('Stripe reactivation error:', stripeError);
                return res.status(500).json({ error: 'Failed to reactivate with payment provider.' });
            }
        }

        // Fallback: Update local database only (for non-Stripe subscriptions)
        await prisma.subscription.update({
            where: { id: subscription.id },
            data: { autoRenew: true }
        });

        res.json({
            success: true,
            message: 'Auto-renewal reactivated!',
            autoRenew: true
        });
    } catch (error) {
        console.error('Reactivate renewal error:', error);
        res.status(500).json({ error: 'Failed to reactivate renewal.' });
    }
});

// Get billing history from Stripe
router.get('/billing-history', authenticate, authorize('OWNER'), async (req, res) => {
    try {
        // Get user's Stripe customer ID
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { stripeCustomerId: true }
        });

        if (!user?.stripeCustomerId) {
            return res.json([]);
        }

        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

        // Fetch invoices from Stripe
        const invoices = await stripe.invoices.list({
            customer: user.stripeCustomerId,
            limit: 10
        });

        // Transform to simpler format
        const billingHistory = invoices.data.map(invoice => ({
            id: invoice.id,
            date: invoice.created ? new Date(invoice.created * 1000).toISOString() : null,
            amount: invoice.amount_paid / 100, // Convert from paise to rupees
            description: invoice.lines.data.length > 0
                ? invoice.lines.data.map(line => line.description).join(', ')
                : 'Subscription Payment',
            status: invoice.status,
            invoiceUrl: invoice.hosted_invoice_url,
            pdfUrl: invoice.invoice_pdf
        }));

        res.json(billingHistory);
    } catch (error) {
        console.error('Billing history error:', error);
        // Return empty array on error instead of 500
        res.json([]);
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
