const prisma = require('../src/lib/prisma');
const bcrypt = require('bcryptjs');

// Create the first Super Super Admin (Secret Route)
exports.createSuperAdmin = async (req, res) => {
    try {
        const { name, email, password, secretKey } = req.body;

        // Hardcoded secret for safety - in production use env var
        const REQUIRED_SECRET = process.env.SUPER_ADMIN_SECRET || 'IntellPharmaSuperSecret2026';

        if (secretKey !== REQUIRED_SECRET) {
            return res.status(403).json({ error: 'Invalid secret key' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'SUPERADMIN',
                isActive: true
            }
        });

        res.status(201).json({ message: 'Super Admin created successfully', user: { id: user.id, email: user.email, role: user.role } });

    } catch (error) {
        console.error('Create Super Admin error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get Global Platform Stats
exports.getGlobalStats = async (req, res) => {
    try {
        const [totalPharmacies, totalUsers, activeSubscriptions, totalInvoices] = await Promise.all([
            prisma.branch.count(),
            prisma.user.count(),
            prisma.subscription.count({
                where: {
                    endDate: {
                        gt: new Date() // Active if endDate is in future
                    }
                }
            }),
            prisma.invoice.count()
        ]);

        res.json({
            totalPharmacies,
            totalUsers,
            activeSubscriptions,
            totalInvoices
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get All Pharmacies (Branches) with Owner info
exports.getAllPharmacies = async (req, res) => {
    try {
        const pharmacies = await prisma.branch.findMany({
            include: {
                owner: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                subscription: {
                    select: {
                        plan: true,
                        endDate: true
                    }
                },
                _count: {
                    select: {
                        users: true,
                        invoices: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(pharmacies);
    } catch (error) {
        console.error('Get pharmacies error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Suspend/Activate a Pharmacy
exports.updatePharmacyStatus = async (req, res) => {
    try {
        const { branchId } = req.params;
        const { isActive } = req.body;

        const branch = await prisma.branch.update({
            where: { id: branchId },
            data: { isActive }
        });

        res.json({ message: `Pharmacy ${isActive ? 'activated' : 'suspended'} successfully`, branch });
    } catch (error) {
        console.error('Update pharmacy status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get Activity Logs (Last 24 hours only for frontend, all data stays in DB)
exports.getActivityLogs = async (req, res) => {
    try {
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const logs = await prisma.auditLog.findMany({
            where: {
                createdAt: {
                    gte: twentyFourHoursAgo
                }
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        role: true
                    }
                },
                branch: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 100 // Limit to 100 most recent entries
        });

        res.json(logs);
    } catch (error) {
        console.error('Get activity logs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// =====================
// BLOG MANAGEMENT
// =====================

// Create Blog Post
exports.createBlogPost = async (req, res) => {
    try {
        const { title, content, excerpt, image, isPublished } = req.body;
        const authorId = req.user.id;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const post = await prisma.blogPost.create({
            data: {
                title,
                content,
                excerpt: excerpt || content.substring(0, 150) + '...',
                image,
                isPublished: isPublished !== false,
                authorId
            },
            include: {
                author: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });

        res.status(201).json(post);
    } catch (error) {
        console.error('Create blog post error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get All Blog Posts (Admin view - includes unpublished)
exports.getAllBlogPosts = async (req, res) => {
    try {
        const posts = await prisma.blogPost.findMany({
            include: {
                author: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(posts);
    } catch (error) {
        console.error('Get all blog posts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update Blog Post
exports.updateBlogPost = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, excerpt, image, isPublished } = req.body;

        const existingPost = await prisma.blogPost.findUnique({ where: { id } });
        if (!existingPost) {
            return res.status(404).json({ error: 'Blog post not found' });
        }

        const post = await prisma.blogPost.update({
            where: { id },
            data: {
                title,
                content,
                excerpt,
                image,
                isPublished
            },
            include: {
                author: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });

        res.json(post);
    } catch (error) {
        console.error('Update blog post error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete Blog Post
exports.deleteBlogPost = async (req, res) => {
    try {
        const { id } = req.params;

        const existingPost = await prisma.blogPost.findUnique({ where: { id } });
        if (!existingPost) {
            return res.status(404).json({ error: 'Blog post not found' });
        }

        await prisma.blogPost.delete({ where: { id } });

        res.json({ message: 'Blog post deleted successfully' });
    } catch (error) {
        console.error('Delete blog post error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get Published Blog Posts (Public)
exports.getPublishedBlogPosts = async (req, res) => {
    try {
        const posts = await prisma.blogPost.findMany({
            where: {
                isPublished: true
            },
            include: {
                author: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(posts);
    } catch (error) {
        console.error('Get published blog posts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get Single Blog Post (Public)
exports.getBlogPost = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await prisma.blogPost.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        name: true
                    }
                }
            }
        });

        if (!post) {
            return res.status(404).json({ error: 'Blog post not found' });
        }

        if (!post.isPublished) {
            return res.status(404).json({ error: 'Blog post not found' });
        }

        res.json(post);
    } catch (error) {
        console.error('Get blog post error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get Unread Blog Posts Count for a User
exports.getUnreadBlogCount = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get all published post IDs
        const publishedPosts = await prisma.blogPost.findMany({
            where: { isPublished: true },
            select: { id: true }
        });

        // Get posts the user has read
        const readPosts = await prisma.blogPostRead.findMany({
            where: { userId },
            select: { postId: true }
        });

        const readPostIds = readPosts.map(r => r.postId);
        const unreadCount = publishedPosts.filter(p => !readPostIds.includes(p.id)).length;

        res.json({ unreadCount });
    } catch (error) {
        console.error('Get unread blog count error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Mark All Blog Posts as Read for a User
exports.markBlogPostsAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get all published posts
        const publishedPosts = await prisma.blogPost.findMany({
            where: { isPublished: true },
            select: { id: true }
        });

        // Get already read posts
        const readPosts = await prisma.blogPostRead.findMany({
            where: { userId },
            select: { postId: true }
        });

        const readPostIds = readPosts.map(r => r.postId);
        const unreadPostIds = publishedPosts.filter(p => !readPostIds.includes(p.id)).map(p => p.id);

        // Mark unread posts as read
        if (unreadPostIds.length > 0) {
            await prisma.blogPostRead.createMany({
                data: unreadPostIds.map(postId => ({
                    userId,
                    postId
                })),
                skipDuplicates: true
            });
        }

        res.json({ message: 'All posts marked as read', markedCount: unreadPostIds.length });
    } catch (error) {
        console.error('Mark blog posts as read error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
