require('dotenv').config();
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
const PORT = process.env.PORT || 5000;
const { runScheduler } = require('./src/services/scheduler');

// Start Scheduler
runScheduler();

// Middleware - CORS configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
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

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/branches', branchRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/subscription', subscriptionRoutes);
app.use('/api/v1/stripe', stripeRoutes);
app.use('/api/v1/super-admin', require('./src/routes/superAdmin.routes'));
app.use('/api/v1/blog', require('./src/routes/blog.routes'));


// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

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
    console.log('📡 Server is running. Press Ctrl+C to stop.');

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
