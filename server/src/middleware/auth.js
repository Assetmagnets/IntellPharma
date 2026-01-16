const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// Verify JWT Token
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                branchAccess: {
                    include: {
                        branch: true
                    }
                }
            }
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Invalid or inactive user.' });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired.' });
        }
        return res.status(401).json({ error: 'Invalid token.' });
    }
};

// Role-Based Access Control
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        // Owner and Superadmin have access to everything
        if (req.user.role === 'OWNER' || req.user.role === 'SUPERADMIN') {
            return next();
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }

        next();
    };
};

// Branch Access Middleware
const requireBranchAccess = async (req, res, next) => {
    try {
        const branchId = req.params.branchId || req.body.branchId || req.query.branchId;

        if (!branchId) {
            return res.status(400).json({ error: 'Branch ID is required.' });
        }

        // Owner and Superadmin have access to all branches
        if (req.user.role === 'OWNER' || req.user.role === 'SUPERADMIN') {
            return next();
        }

        // Check if user has access to this branch
        const hasAccess = req.user.branchAccess.some(ba => ba.branchId === branchId);

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied to this branch.' });
        }

        next();
    } catch (error) {
        return res.status(500).json({ error: 'Error checking branch access.' });
    }
};

// Audit Logger
const logAudit = async (userId, branchId, action, entity, entityId, details, ipAddress) => {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                branchId,
                action,
                entity,
                entityId,
                details: typeof details === 'object' ? JSON.stringify(details) : details,
                ipAddress
            }
        });
    } catch (error) {
        console.error('Audit log error:', error);
    }
};

// Confirmation Required for Sensitive Actions
const requireConfirmation = (req, res, next) => {
    const confirmHeader = req.headers['x-confirm-action'];

    if (confirmHeader !== 'true') {
        return res.status(400).json({
            error: 'Confirmation required.',
            message: 'This is a sensitive action. Please confirm by sending X-Confirm-Action: true header.'
        });
    }

    next();
};

module.exports = {
    authenticate,
    authorize,
    requireBranchAccess,
    logAudit,
    requireConfirmation
};
