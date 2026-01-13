const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { authenticate, logAudit } = require('../middleware/auth');

const router = express.Router();

// Register a new user (Owner registration)
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, phone, branchName } = req.body;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user and their first branch in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create the owner user
            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    phone,
                    role: 'OWNER'
                }
            });

            // Create the first branch
            const branch = await tx.branch.create({
                data: {
                    name: branchName || `${name}'s Pharmacy`,
                    ownerId: user.id
                }
            });

            // Create subscription (Basic plan by default)
            await tx.subscription.create({
                data: {
                    branchId: branch.id,
                    plan: 'BASIC',
                    maxBranches: 1
                }
            });

            // Give owner access to the branch
            await tx.branchUser.create({
                data: {
                    userId: user.id,
                    branchId: branch.id,
                    role: 'OWNER'
                }
            });

            return { user, branch };
        });

        // Generate JWT
        const token = jwt.sign(
            { userId: result.user.id, role: result.user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        await logAudit(result.user.id, result.branch.id, 'REGISTER', 'User', result.user.id, 'New owner registration', req.ip);

        res.status(201).json({
            message: 'Registration successful!',
            token,
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                role: result.user.role
            },
            branch: {
                id: result.branch.id,
                name: result.branch.name
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                branchAccess: {
                    include: {
                        branch: true
                    }
                },
                ownedBranches: true
            }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        if (!user.isActive) {
            return res.status(401).json({ error: 'Account is deactivated. Contact administrator.' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Get all accessible branches
        const branches = user.role === 'OWNER'
            ? user.ownedBranches
            : user.branchAccess.map(ba => ba.branch);

        const branchId = branches.length > 0 ? branches[0].id : null;
        if (branchId) {
            await logAudit(user.id, branchId, 'LOGIN', 'User', user.id, 'User login', req.ip);
        }

        res.json({
            message: 'Login successful!',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                phone: user.phone
            },
            branches
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                profileImage: true,
                notificationSettings: true,
                createdAt: true,
                branchAccess: {
                    include: {
                        branch: {
                            select: {
                                id: true,
                                name: true,
                                address: true,
                                subscription: {
                                    select: {
                                        plan: true,
                                        aiEnabled: true,
                                        maxBranches: true
                                    }
                                }
                            }
                        }
                    }
                },
                ownedBranches: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        subscription: {
                            select: {
                                plan: true,
                                aiEnabled: true,
                                maxBranches: true
                            }
                        }
                    }
                }
            }
        });

        const branches = user.role === 'OWNER'
            ? user.ownedBranches
            : user.branchAccess.map(ba => ba.branch);

        console.log(`GET /me - User: ${user.email}, Image Length: ${user.profileImage ? user.profileImage.length : 'null'}`);

        res.json({
            ...user,
            branches,
            branchAccess: undefined,
            ownedBranches: undefined
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile.' });
    }
});

// Update user profile
router.put('/update-profile', authenticate, async (req, res) => {
    try {
        const { name, email, phone, profileImage } = req.body;
        const userId = req.user.id;

        // Check if email is already taken by another user
        if (email) {
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser && existingUser.id !== userId) {
                return res.status(400).json({ error: 'Email is already in use by another account.' });
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                email,
                phone,
                profileImage
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                profileImage: true
            }
        });

        res.json({
            message: 'Profile updated successfully!',
            user: updatedUser
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile.' });
    }
});

// Update user settings
router.put('/update-settings', authenticate, async (req, res) => {
    try {
        const { notificationSettings } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: { notificationSettings },
            select: {
                id: true,
                name: true,
                email: true,
                notificationSettings: true
            }
        });

        res.json({
            message: 'Settings updated successfully!',
            user: updatedUser
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Failed to update settings.' });
    }
});

// Verify password
router.post('/verify-password', authenticate, async (req, res) => {
    try {
        const { password } = req.body;
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(400).json({ valid: false, error: 'Incorrect password.' });
        }

        res.json({ valid: true });
    } catch (error) {
        console.error('Verify password error:', error);
        res.status(500).json({ error: 'Verification failed.' });
    }
});

// Change password
router.post('/change-password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await prisma.user.findUnique({ where: { id: req.user.id } });

        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ error: 'Current password is incorrect.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashedPassword }
        });

        res.json({ message: 'Password changed successfully!' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password.' });
    }
});

// =====================
// FORGOT PASSWORD ROUTES (Email OTP)
// =====================

const nodemailer = require('nodemailer');

// Create email transporter (uses Gmail by default, configure in .env)
const createTransporter = () => {
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Generate 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email
async function sendOTPEmail(email, otp) {
    // If email credentials not configured, just log to console
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log(`\n📧 OTP for ${email}: ${otp}\n`);
        console.log('⚠️  Email not configured. Add EMAIL_USER and EMAIL_PASS to .env to send real emails.\n');
        return true;
    }

    const transporter = createTransporter();

    const mailOptions = {
        from: `"PharmaStock" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset OTP - PharmaStock',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0066e6;">PharmaStock Password Reset</h2>
                <p>You requested to reset your password. Use the OTP below to proceed:</p>
                <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                    <h1 style="color: #0066e6; letter-spacing: 8px; margin: 0;">${otp}</h1>
                </div>
                <p style="color: #666;">This OTP is valid for <strong>5 minutes</strong>.</p>
                <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 OTP email sent to ${email}`);
    return true;
}

// Request OTP for password reset
router.post('/forgot-password/request-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required.' });
        }

        // Find user by email
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: 'No account found with this email.' });
        }

        // Delete any existing OTPs for this email
        await prisma.passwordResetOTP.deleteMany({ where: { email } });

        // Generate OTP with 5 minute expiry
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        await prisma.passwordResetOTP.create({
            data: {
                email,
                otp,
                expiresAt
            }
        });

        // Send OTP via email
        await sendOTPEmail(email, otp);

        res.json({
            message: 'OTP sent successfully to your email address.',
            // Remove in production - for testing only
            debug_otp: process.env.NODE_ENV === 'development' ? otp : undefined
        });
    } catch (error) {
        console.error('Request OTP error:', error);
        res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
    }
});

// Verify OTP
router.post('/forgot-password/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required.' });
        }

        // Find the OTP record
        const otpRecord = await prisma.passwordResetOTP.findFirst({
            where: { email, otp }
        });

        if (!otpRecord) {
            return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
        }

        // Check if OTP is expired
        if (new Date() > otpRecord.expiresAt) {
            await prisma.passwordResetOTP.delete({ where: { id: otpRecord.id } });
            return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
        }

        // Mark OTP as verified
        await prisma.passwordResetOTP.update({
            where: { id: otpRecord.id },
            data: { verified: true }
        });

        res.json({ message: 'OTP verified successfully. You can now reset your password.' });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ error: 'Failed to verify OTP. Please try again.' });
    }
});

// Reset password with verified OTP
router.post('/forgot-password/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ error: 'Email, OTP, and new password are required.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        // Find verified OTP
        const otpRecord = await prisma.passwordResetOTP.findFirst({
            where: { email, otp, verified: true }
        });

        if (!otpRecord) {
            return res.status(400).json({ error: 'Invalid or unverified OTP. Please verify your OTP first.' });
        }

        // Check if OTP is expired
        if (new Date() > otpRecord.expiresAt) {
            await prisma.passwordResetOTP.delete({ where: { id: otpRecord.id } });
            return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
        }

        // Find user and update password
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        // Delete the used OTP
        await prisma.passwordResetOTP.delete({ where: { id: otpRecord.id } });

        res.json({ message: 'Password reset successfully! You can now login with your new password.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password. Please try again.' });
    }
});

// Test Notifications (Trigger manually)
const { sendNotificationToUser } = require('../services/scheduler');

router.post('/test-notifications', authenticate, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        // Ensure user has settings
        if (!user.notificationSettings) {
            return res.status(400).json({ error: 'Please save your notification settings first.' });
        }

        const sent = await sendNotificationToUser(user);

        if (sent) {
            res.json({ message: 'Test email sent successfully! Please check your inbox.' });
        } else {
            res.json({ message: 'No alerts found based on your current settings (No Low Stock or Expiring items found).' });
        }
    } catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({ error: 'Failed to send test email.' });
    }
});

module.exports = router;
