const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');
const { PLANS } = require('./subscription.routes');

const router = express.Router();

// Initialize Stripe with secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe = null;

if (stripeSecretKey) {
    stripe = require('stripe')(stripeSecretKey);
} else {
    console.warn('⚠️  STRIPE_SECRET_KEY not set. Stripe payment features will not work.');
}

// Middleware to check if Stripe is configured
const requireStripe = (req, res, next) => {
    if (!stripe) {
        return res.status(503).json({
            error: 'Payment service not configured. Please add STRIPE_SECRET_KEY to your .env file.'
        });
    }
    next();
};

// Price IDs - You'll need to create these in Stripe Dashboard
// For now, we'll create prices dynamically or use lookup keys
const STRIPE_PRICES = {
    PRO: process.env.STRIPE_PRO_PRICE_ID || null,
    PREMIUM: process.env.STRIPE_PREMIUM_PRICE_ID || null,
};

// Plan configuration with monthly prices (in paise/cents for Stripe)
const PLAN_PRICES = {
    BASIC: { price: 0, currency: 'inr', name: 'Basic Plan' },
    PRO: { price: 99900, currency: 'inr', name: 'Pro Plan' },  // ₹999
    PREMIUM: { price: 199900, currency: 'inr', name: 'Premium Plan' },  // ₹1999
    ENTERPRISE: { price: null, currency: 'inr', name: 'Enterprise Plan' }  // Custom
};

// Create or get Stripe customer for user
async function getOrCreateStripeCustomer(user) {
    // Check if user already has a Stripe customer ID
    if (user.stripeCustomerId) {
        try {
            const customer = await stripe.customers.retrieve(user.stripeCustomerId);
            if (!customer.deleted) {
                return customer;
            }
        } catch (error) {
            console.log('Customer not found, creating new one...');
        }
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
            userId: user.id
        }
    });

    // Save customer ID to user
    await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customer.id }
    });

    return customer;
}

// Create Checkout Session for subscription
router.post('/create-checkout-session', requireStripe, authenticate, authorize('OWNER'), async (req, res) => {
    try {
        const { planId } = req.body;

        if (!planId || !PLAN_PRICES[planId]) {
            return res.status(400).json({ error: 'Invalid plan selected.' });
        }

        if (planId === 'BASIC') {
            return res.status(400).json({ error: 'Basic plan is free. No payment required.' });
        }

        if (planId === 'ENTERPRISE') {
            return res.status(400).json({ error: 'Please contact sales for Enterprise plan.' });
        }

        const planConfig = PLAN_PRICES[planId];

        // Get user with current subscription
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                ownedBranches: {
                    include: {
                        subscription: true
                    }
                }
            }
        });

        // Get or create Stripe customer
        const customer = await getOrCreateStripeCustomer(user);

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer: customer.id,
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [
                {
                    price_data: {
                        currency: planConfig.currency,
                        product_data: {
                            name: planConfig.name,
                            description: `PharmaStock ${planConfig.name} - Monthly Subscription`,
                        },
                        recurring: {
                            interval: 'month',
                        },
                        unit_amount: planConfig.price,
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                userId: user.id,
                planId: planId,
            },
            success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment-cancel`,
            subscription_data: {
                metadata: {
                    userId: user.id,
                    planId: planId,
                }
            }
        });

        res.json({
            sessionId: session.id,
            url: session.url
        });

    } catch (error) {
        console.error('Create checkout session error:', error);
        res.status(500).json({ error: 'Failed to create checkout session.' });
    }
});

// Get current subscription status from Stripe AND sync to local DB
router.get('/subscription-status', requireStripe, authenticate, authorize('OWNER'), async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                ownedBranches: {
                    include: {
                        subscription: true
                    }
                }
            }
        });

        if (!user.stripeCustomerId) {
            return res.json({
                hasSubscription: false,
                plan: 'BASIC',
                status: 'free'
            });
        }

        // Get subscriptions from Stripe
        const subscriptions = await stripe.subscriptions.list({
            customer: user.stripeCustomerId,
            status: 'active',
            limit: 1
        });

        if (subscriptions.data.length === 0) {
            return res.json({
                hasSubscription: false,
                plan: 'BASIC',
                status: 'free'
            });
        }

        const subscription = subscriptions.data[0];
        const planId = subscription.metadata.planId || 'PRO';

        // SYNC: Update local database if Stripe has active subscription
        if (user.ownedBranches.length > 0) {
            const branch = user.ownedBranches[0];
            const localSub = branch.subscription;
            const planConfig = PLANS[planId] || PLANS.BASIC;

            // Safely parse the period end date
            const periodEndTimestamp = subscription.current_period_end;
            const periodEndDate = periodEndTimestamp
                ? new Date(periodEndTimestamp * 1000)
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days from now

            // Check if local DB is out of sync with Stripe
            const needsSync = !localSub ||
                localSub.plan !== planId ||
                localSub.stripeSubscriptionId !== subscription.id;

            if (needsSync) {
                console.log(`🔄 Syncing subscription for user ${user.id}: ${localSub?.plan || 'NONE'} -> ${planId}`);

                await prisma.subscription.upsert({
                    where: { branchId: branch.id },
                    update: {
                        plan: planId,
                        maxBranches: planConfig.maxBranches,
                        aiEnabled: planConfig.aiEnabled,
                        analyticsEnabled: planConfig.analyticsEnabled,
                        stripeSubscriptionId: subscription.id,
                        stripePriceId: subscription.items?.data?.[0]?.price?.id || null,
                        stripeCurrentPeriodEnd: periodEndDate,
                        autoRenew: !subscription.cancel_at_period_end,
                        endDate: periodEndDate
                    },
                    create: {
                        branchId: branch.id,
                        plan: planId,
                        maxBranches: planConfig.maxBranches,
                        aiEnabled: planConfig.aiEnabled,
                        analyticsEnabled: planConfig.analyticsEnabled,
                        stripeSubscriptionId: subscription.id,
                        stripePriceId: subscription.items?.data?.[0]?.price?.id || null,
                        stripeCurrentPeriodEnd: periodEndDate,
                        autoRenew: !subscription.cancel_at_period_end,
                        endDate: periodEndDate
                    }
                });

                console.log(`✅ Subscription synced successfully to ${planId}`);
            }
        }

        res.json({
            hasSubscription: true,
            plan: planId,
            status: subscription.status,
            currentPeriodEnd: periodEndDate, // Use the safely parsed date
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            stripeSubscriptionId: subscription.id
        });

    } catch (error) {
        console.error('Get subscription status error:', error);
        res.status(500).json({ error: 'Failed to get subscription status.' });
    }
});

// Create Customer Portal session for managing billing
router.post('/create-portal-session', requireStripe, authenticate, authorize('OWNER'), async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        if (!user.stripeCustomerId) {
            return res.status(400).json({ error: 'No billing account found. Please subscribe first.' });
        }

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/subscription`,
        });

        res.json({ url: portalSession.url });

    } catch (error) {
        console.error('Create portal session error:', error);
        res.status(500).json({ error: 'Failed to create billing portal session.' });
    }
});

// Verify checkout session (called from success page)
router.get('/verify-session/:sessionId', requireStripe, authenticate, async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['subscription']
        });

        if (session.payment_status === 'paid' && session.subscription) {
            const subscription = session.subscription;
            const planId = session.metadata.planId || 'PRO';

            // Update user's subscription in database
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                include: {
                    ownedBranches: {
                        include: {
                            subscription: true
                        }
                    }
                }
            });

            if (user.ownedBranches.length > 0) {
                const branch = user.ownedBranches[0];

                // Get plan configuration from shared PLANS config
                const planConfig = PLANS[planId] || PLANS.BASIC;

                // Update or create subscription
                await prisma.subscription.upsert({
                    where: { branchId: branch.id },
                    update: {
                        plan: planId,
                        maxBranches: planConfig.maxBranches,
                        aiEnabled: planConfig.aiEnabled,
                        analyticsEnabled: planConfig.analyticsEnabled,
                        stripeSubscriptionId: subscription.id,
                        stripePriceId: subscription.items.data[0]?.price?.id,
                        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                        autoRenew: !subscription.cancel_at_period_end,
                        endDate: new Date(subscription.current_period_end * 1000)
                    },
                    create: {
                        branchId: branch.id,
                        plan: planId,
                        maxBranches: planConfig.maxBranches,
                        aiEnabled: planConfig.aiEnabled,
                        analyticsEnabled: planConfig.analyticsEnabled,
                        stripeSubscriptionId: subscription.id,
                        stripePriceId: subscription.items.data[0]?.price?.id,
                        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                        autoRenew: !subscription.cancel_at_period_end,
                        endDate: new Date(subscription.current_period_end * 1000)
                    }
                });
            }

            res.json({
                success: true,
                plan: planId,
                message: `Successfully subscribed to ${planId} plan!`
            });
        } else {
            res.json({
                success: false,
                message: 'Payment not completed or subscription not found.'
            });
        }

    } catch (error) {
        console.error('Verify session error:', error);
        res.status(500).json({ error: 'Failed to verify session.' });
    }
});

// Stripe Webhook handler (raw body required)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        if (webhookSecret) {
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } else {
            // For testing without webhook signature verification
            event = JSON.parse(req.body);
            console.warn('⚠️  Webhook signature verification skipped (no STRIPE_WEBHOOK_SECRET set)');
        }
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;
            console.log('✅ Checkout session completed:', session.id);

            // The subscription is created, but we'll update via verify-session endpoint
            // or handle it here for webhook-first approach
            break;
        }

        case 'customer.subscription.updated': {
            const subscription = event.data.object;
            console.log('📝 Subscription updated:', subscription.id);

            // Update subscription in database
            await prisma.subscription.updateMany({
                where: { stripeSubscriptionId: subscription.id },
                data: {
                    autoRenew: !subscription.cancel_at_period_end,
                    stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                    endDate: new Date(subscription.current_period_end * 1000)
                }
            });
            break;
        }

        case 'customer.subscription.deleted': {
            const subscription = event.data.object;
            console.log('❌ Subscription cancelled:', subscription.id);

            // Downgrade to BASIC plan
            await prisma.subscription.updateMany({
                where: { stripeSubscriptionId: subscription.id },
                data: {
                    plan: 'BASIC',
                    maxBranches: 1,
                    aiEnabled: false,
                    analyticsEnabled: false,
                    stripeSubscriptionId: null,
                    stripePriceId: null,
                    stripeCurrentPeriodEnd: null,
                    autoRenew: false
                }
            });
            break;
        }

        case 'invoice.payment_succeeded': {
            const invoice = event.data.object;
            console.log('💰 Payment succeeded for invoice:', invoice.id);
            break;
        }

        case 'invoice.payment_failed': {
            const invoice = event.data.object;
            console.log('⚠️  Payment failed for invoice:', invoice.id);
            // Could send email notification here
            break;
        }

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
});

module.exports = router;
