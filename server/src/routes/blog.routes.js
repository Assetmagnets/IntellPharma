const express = require('express');
const router = express.Router();
const superAdminController = require('../../controllers/superAdmin.controller');
const { authenticate } = require('../middleware/auth');

// Public routes for viewing blogs (requires authentication but any role)
router.get('/', superAdminController.getPublishedBlogPosts);
router.get('/unread-count', authenticate, superAdminController.getUnreadBlogCount);
router.post('/mark-read', authenticate, superAdminController.markBlogPostsAsRead);
router.get('/:id', superAdminController.getBlogPost);

module.exports = router;
