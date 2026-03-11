require('dotenv').config();
// Production Fallbacks
process.env.CLIENT_URL = process.env.CLIENT_URL || 'https://www.intellpharma.in';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'https://d23mmdhappc6a5.cloudfront.net,https://www.intellpharma.in,https://intellpharma.in';

// Database URL Debug (Masked)
const dbUrl = process.env.DATABASE_URL || '';
const maskedDbUrl = dbUrl.replace(/\/\/.*:.*@/, '//****:****@');
console.log(`🔌 Database URL: ${maskedDbUrl || 'MISSING'}`);
if (dbUrl && !dbUrl.includes('sslmode=')) {
    console.warn('⚠️  DATABASE_URL might be missing sslmode=require. RDS/Neon usually require it.');
}
const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/auth.routes');
const branchRoutes = require('./src/routes/branch.routes');
const inventoryRoutes = require('./src/routes/inventory.routes');
const billingRoutes = require('./src/routes/billing.routes');
const aiRoutes = require('./src/routes/ai.routes');
const subscriptionRoutes = require('./src/routes/subscription.routes');
const stripeRoutes = require('./src/routes/stripe.routes');

const app = express();
const PORT = process.env.PORT || 8080;
const { runScheduler } = require('./src/services/scheduler');

// Start Scheduler
// Start Scheduler
runScheduler();

// DB Check
app.get('/db-check', async (req, res) => {
    try {
        const prisma = require('./src/lib/prisma');
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).send('DATABASE_CONNECTED_SUCCESSFULLY');
    } catch (error) {
        console.error('DB check error:', error);
        res.status(500).send('DATABASE_CONNECTION_ERROR: ' + error.message);
    }
});

// Check Env Vars
app.get('/check-vars', (req, res) => {
    res.json({
        NODE_ENV: process.env.NODE_ENV || 'not set',
        HAS_DATABASE_URL: !!process.env.DATABASE_URL,
        HAS_JWT_SECRET: !!process.env.JWT_SECRET,
        HAS_STRIPE_KEY: !!process.env.STRIPE_SECRET_KEY,
        CORS_ORIGIN: process.env.CORS_ORIGIN,
        PORT: process.env.PORT
    });
});

// Emergency DB Sync (Run this once to create tables)
app.get('/sync-db', (req, res) => {
    const { exec } = require('child_process');
    console.log('🔄 Starting Emergency DB Sync...');

    // Using --accept-data-loss because this is the first-time setup on RDS
    exec('npx prisma db push --accept-data-loss', (error, stdout, stderr) => {
        if (error) {
            console.error('❌ Sync Error:', error);
            return res.status(500).send(`Sync Failed: ${error.message}\n\nStderr: ${stderr}`);
        }
        console.log('✅ Sync Success:', stdout);
        res.send(`<h1>Database synced successfully!</h1><pre>${stdout}</pre>`);
    });
});

// Middleware - CORS configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
    // 'https://www.intellpharma.in',
    // 'https://intellpharma.in',
    // Add production origins from environment variable (comma-separated)
    ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : [])
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, or same-origin)
        if (!origin) return callback(null, true);

        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // In production, also allow any Vercel/Netlify preview deployments
        if (origin.includes('.vercel.app') || origin.includes('.netlify.app')) {
            return callback(null, true);
        }

        // Allow AWS S3 static website hosting and CloudFront, and Elastic Beanstalk
        if (origin.includes('.s3.') || origin.includes('.s3-website') ||
            origin.includes('.amazonaws.com') || origin.includes('.cloudfront.net') ||
            origin.includes('.elasticbeanstalk.com')) {
            return callback(null, true);
        }

        console.warn(`CORS blocked origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root route for EB health check / verify
app.get('/', (req, res) => {
    res.status(200).send('IntellPharma Backend is Running!');
});

const { authenticate, requireActiveSubscription } = require('./src/middleware/auth');

// API Routes (unprotected - user must access these to login/subscribe)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/subscription', subscriptionRoutes);
app.use('/api/v1/stripe', stripeRoutes);
app.use('/api/v1/super-admin', require('./src/routes/superAdmin.routes'));
app.use('/api/v1/blog', require('./src/routes/blog.routes'));

// API Routes (protected - require active subscription or trial)
// authenticate sets req.user, requireActiveSubscription checks trial/subscription
app.use('/api/v1/branches', authenticate, requireActiveSubscription, branchRoutes);
app.use('/api/v1/inventory', authenticate, requireActiveSubscription, inventoryRoutes);
app.use('/api/v1/racking', authenticate, requireActiveSubscription, require('./src/routes/racking.routes'));
app.use('/api/v1/billing', authenticate, requireActiveSubscription, billingRoutes);
app.use('/api/v1/ai', authenticate, requireActiveSubscription, aiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Serve static assets ONLY in production (disabled for local dev to prevent stale builds)
// To re-enable for production deployment, uncomment the block below
// const publicPath = path.join(__dirname, 'public');
// if (fs.existsSync(path.join(publicPath, 'index.html'))) {
//     app.use(express.static(publicPath));
//     app.get(/(.*)/, (req, res) => {
//         res.sendFile(path.join(publicPath, 'index.html'));
//     });
// } else if (process.env.NODE_ENV === 'production') {
//     console.warn('Production mode but no public/index.html found!');
// }

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Create HTTP server explicitly (more stable than app.listen)
const server = http.createServer(app);

// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use!`);
        console.error('   Run: npx kill-port 5000\n');
    } else {
        console.error('Server error:', error);
    }
    process.exit(1);
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`📡 Server is running on port ${PORT}. Press Ctrl+C to stop.`);
    console.log('🚀 Deployed Version: 2026-02-24-VERIFY-LOGIN-V2');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down...');
    server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down...');
    server.close(() => process.exit(0));
});

// Catch unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});

// Catch uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

module.exports = app;
