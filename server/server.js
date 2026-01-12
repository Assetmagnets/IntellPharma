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

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

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
