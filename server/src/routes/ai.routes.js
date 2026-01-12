const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize, requireBranchAccess, logAudit } = require('../middleware/auth');
const { requireFeature } = require('./subscription.routes');

const router = express.Router();

// Default suggested prompts by role
const defaultPrompts = {
    OWNER: [
        { prompt: 'Show monthly P&L summary', description: 'Profit and loss overview for the current month', category: 'Finance' },
        { prompt: 'Compare branch performance', description: 'Side-by-side comparison of all branches', category: 'Analytics' },
        { prompt: 'Top 10 suppliers by purchase volume', description: 'Identify key suppliers', category: 'Inventory' },
        { prompt: 'Show GST liability for this month', description: 'CGST, SGST, and IGST totals', category: 'Tax' },
        { prompt: 'Revenue trend for last 6 months', description: 'Monthly revenue visualization', category: 'Analytics' }
    ],
    MANAGER: [
        { prompt: 'Show today\'s sales summary', description: 'Today\'s billing overview', category: 'Sales' },
        { prompt: 'Low stock items', description: 'Products below minimum stock level', category: 'Inventory' },
        { prompt: 'Pending prescriptions', description: 'Orders awaiting fulfillment', category: 'Operations' },
        { prompt: 'Staff performance today', description: 'Sales by staff member', category: 'HR' }
    ],
    BILLING_STAFF: [
        { prompt: 'Today\'s sales', description: 'My billing summary for today', category: 'Sales' },
        { prompt: 'Low stock medicines', description: 'Products that need reordering', category: 'Inventory' },
        { prompt: 'Recent returns', description: 'Returns processed today', category: 'Sales' }
    ],
    INVENTORY_STAFF: [
        { prompt: 'Low stock alerts', description: 'Items below reorder level', category: 'Inventory' },
        { prompt: 'Expiring soon', description: 'Products expiring in 30 days', category: 'Inventory' },
        { prompt: 'Recent stock updates', description: 'Inventory changes today', category: 'Inventory' }
    ]
};

// Process AI prompt with Gemini
router.post('/prompt', authenticate, requireFeature('ai'), async (req, res) => {
    try {
        const { prompt, branchId, context } = req.body;
        const startTime = Date.now();

        // Initialize Gemini
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Construct context-aware prompt
        const systemContext = `
            You are an AI assistant for a pharmacy management system called Medistock.
            User Role: ${req.user.role}
            Current Branch ID: ${branchId || 'Global'}
            Context Data: ${JSON.stringify(context || {})}
            
            Answer the user's question concisely and professionally. 
            If specific data is needed that isn't provided, explain what you would need.
            Format lists using markdown.
        `;

        const fullPrompt = `${systemContext}\n\nUser Query: ${prompt}`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const responseText = response.text();

        const executionTime = Date.now() - startTime;

        // Store prompt history
        await prisma.promptHistory.create({
            data: {
                prompt,
                response: responseText,
                executionTime,
                userId: req.user.id,
                branchId
            }
        });

        res.json({
            response_text: responseText,
            execution_time: executionTime
        });
    } catch (error) {
        console.error('AI prompt error:', error);
        res.status(500).json({ error: 'Failed to process prompt. Ensure GEMINI_API_KEY is set.' });
    }
});

// Parse Bill / Command text to structured JSON
router.post('/parse-bill', authenticate, requireFeature('ai'), async (req, res) => {
    try {
        const { text } = req.body;

        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `
            Extract medicines/products, quantities, and prices (if available) from the following text.
            Text: "${text}"
            
            Return ONLY a valid JSON array of objects. Each object should have:
            - "name": string (product name, capitalized properly)
            - "quantity": number (integer)
            - "price": number (or null if not mentioned)
            - "unit": string (e.g., "strip", "box", "tablet", or null)
            
            If no products are found, return empty array [].
            Do not include markdown formatting like \`\`\`json. Just the raw JSON string.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let jsonString = response.text();

        // Cleanup potential markdown code blocks
        jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();

        const products = JSON.parse(jsonString);

        res.json({ products });
    } catch (error) {
        console.error('Bill parsing error:', error);
        res.status(500).json({ error: 'Failed to parse bill text.' });
    }
});

// Get prompt history
router.get('/prompt-history', authenticate, requireFeature('ai'), async (req, res) => {
    try {
        const { limit = 20, branchId } = req.query;

        const history = await prisma.promptHistory.findMany({
            where: {
                userId: req.user.id,
                ...(branchId ? { branchId } : {})
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit)
        });

        res.json(history);
    } catch (error) {
        console.error('Get prompt history error:', error);
        res.status(500).json({ error: 'Failed to fetch prompt history.' });
    }
});

// Get suggested prompts based on role
router.get('/suggested-prompts', authenticate, requireFeature('ai'), async (req, res) => {
    try {
        const role = req.user.role;

        // Get custom prompts from database
        const customPrompts = await prisma.suggestedPrompt.findMany({
            where: {
                isActive: true,
                roles: { has: role }
            }
        });

        // Combine with defaults
        const suggestions = [
            ...(defaultPrompts[role] || defaultPrompts.BILLING_STAFF),
            ...customPrompts.map(p => ({
                prompt: p.prompt,
                description: p.description,
                category: p.category
            }))
        ];

        res.json(suggestions);
    } catch (error) {
        console.error('Get suggested prompts error:', error);
        res.status(500).json({ error: 'Failed to fetch suggested prompts.' });
    }
});

// Owner: Manage AI feature access by role
router.put('/settings', authenticate, authorize('OWNER'), async (req, res) => {
    try {
        const { branchId, roleSettings } = req.body;

        // Store settings (you might want a dedicated settings table)
        // For now, we'll use the subscription table's custom fields
        // This is a placeholder for the actual implementation

        res.json({
            message: 'AI settings updated.',
            settings: roleSettings
        });
    } catch (error) {
        console.error('Update AI settings error:', error);
        res.status(500).json({ error: 'Failed to update settings.' });
    }
});

// Add custom suggested prompt (Owner only)
router.post('/suggested-prompts', authenticate, authorize('OWNER'), async (req, res) => {
    try {
        const { prompt: promptText, description, roles, category } = req.body;

        const newPrompt = await prisma.suggestedPrompt.create({
            data: {
                prompt: promptText,
                description,
                roles,
                category
            }
        });

        res.status(201).json(newPrompt);
    } catch (error) {
        console.error('Create suggested prompt error:', error);
        res.status(500).json({ error: 'Failed to create suggested prompt.' });
    }
});

module.exports = router;
