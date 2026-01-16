const express = require('express');
const router = express.Router();
const superAdminController = require('../../controllers/superAdmin.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Public route (guarded by secret key in body)
router.post('/create', superAdminController.createSuperAdmin);

// Protected Routes (SUPERADMIN only)
router.get('/stats', authenticate, authorize('SUPERADMIN'), superAdminController.getGlobalStats);
router.get('/pharmacies', authenticate, authorize('SUPERADMIN'), superAdminController.getAllPharmacies);
router.patch('/pharmacies/:branchId/status', authenticate, authorize('SUPERADMIN'), superAdminController.updatePharmacyStatus);
router.get('/activity-logs', authenticate, authorize('SUPERADMIN'), superAdminController.getActivityLogs);

// Blog Routes (SUPERADMIN only)
router.post('/blog', authenticate, authorize('SUPERADMIN'), superAdminController.createBlogPost);
router.get('/blog', authenticate, authorize('SUPERADMIN'), superAdminController.getAllBlogPosts);
router.put('/blog/:id', authenticate, authorize('SUPERADMIN'), superAdminController.updateBlogPost);
router.delete('/blog/:id', authenticate, authorize('SUPERADMIN'), superAdminController.deleteBlogPost);

module.exports = router;

