const cron = require('node-cron');
const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configure email transporter
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const emailService = process.env.EMAIL_SERVICE || 'gmail'; // Default to gmail if not specified

if (!emailUser || !emailPass) {
    console.warn('[Scheduler Warning] EMAIL_USER or EMAIL_PASS is missing in .env. Email notifications will not work.');
}

const transporter = nodemailer.createTransport({
    service: emailService,
    auth: {
        user: emailUser,
        pass: emailPass
    }
});

// Run once a day at 09:00 AM
// Cron syntax: Minute Hour Day Month DayOfWeek
const JOB_SCHEDULE = '0 9 * * *';

// Core notification logic
const checkAndSendNotifications = async () => {
    console.log(`[${new Date().toISOString()}] Running Scheduled Notification Job...`);
    try {
        // 1. Fetch Users with enabled notifications
        const users = await prisma.user.findMany({
            where: {
                isActive: true,
                notificationSettings: {
                    not: null
                }
            }
        });

        for (const user of users) {
            await sendNotificationToUser(user);
        }

    } catch (error) {
        console.error('Error in scheduler:', error);
    }
};



// Logic for a single user (exported for testing)
const sendNotificationToUser = async (user) => {
    console.log(`[Notification Debug] Checking for user: ${user.email}`);
    const settings = user.notificationSettings || {};
    console.log(`[Notification Debug] Settings:`, settings);

    // Skip if Email Alerts are globally disabled for this user
    if (!settings?.emailAlerts) {
        console.log(`[Notification Debug] Email alerts disabled for user.`);
        return false;
    }

    let emailContent = [];

    // 2. Check Low Stock
    if (settings.lowStockAlerts) {
        const lowStockProducts = await prisma.product.findMany({
            where: {
                quantity: { lt: 10 },
                isActive: true
            },
            take: 5
        });

        if (lowStockProducts.length > 0) {
            console.log(`[Notification Debug] Found ${lowStockProducts.length} low stock items.`);
            emailContent.push(`
                <h3>⚠️ Low Stock Alert</h3>
                <ul>
                    ${lowStockProducts.map(p => `<li>${p.name}: Only ${p.quantity} left</li>`).join('')}
                </ul>
                <p>Please restock these items soon.</p>
            `);
        }
    }

    // 3. Check Expiry
    if (settings.expiryAlerts) {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const expiringProducts = await prisma.product.findMany({
            where: {
                expiryDate: {
                    lt: thirtyDaysFromNow,
                    gt: new Date()
                },
                isActive: true
            },
            take: 5
        });

        if (expiringProducts.length > 0) {
            console.log(`[Notification Debug] Found ${expiringProducts.length} expiring items.`);
            emailContent.push(`
                <h3>📅 Expiry Alert (Next 30 Days)</h3>
                <ul>
                    ${expiringProducts.map(p => `<li>${p.name}: Expires on ${p.expiryDate.toLocaleDateString()}</li>`).join('')}
                </ul>
            `);
        }
    }

    // 4. Daily Sales Summary (Simple count for now)
    if (settings.salesSummary) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const salesCount = await prisma.invoice.count({
            where: {
                createdAt: { gte: today }
            }
        });

        emailContent.push(`
            <h3>📊 Daily Summary</h3>
            <p>Total Invoices Generated Today: <strong>${salesCount}</strong></p>
        `);
    }

    // 5. Send Email if there is content
    if (emailContent.length > 0) {
        console.log(`[Notification Debug] Attempting to send email to ${user.email}...`);
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: 'Pharmacy Updates & Alerts',
                html: `
                <h2>Hello ${user.name},</h2>
                <p>Here is your update for ${new Date().toLocaleDateString()}:</p>
                <hr/>
                ${emailContent.join('<hr/>')}
                <p style="font-size: 12px; color: grey;">You can manage these alerts in your Settings.</p>
            `
            };

            await transporter.sendMail(mailOptions);
            console.log(`[Notification Debug] Email sent successfully to ${user.email}`);
            return true;
        } catch (emailError) {
            console.error('[Notification Debug] Email send failed:', emailError);
            throw emailError; // Re-throw to be caught by caller
        }
    } else {
        console.log(`[Notification Debug] No content to send for ${user.email}`);
    }
};

const runScheduler = () => {
    console.log(`Initializing Scheduler: Running job daily at 09:00 AM (${JOB_SCHEDULE})`);
    cron.schedule(JOB_SCHEDULE, checkAndSendNotifications);
};

module.exports = { runScheduler, sendNotificationToUser, checkAndSendNotifications };
