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

// Diagnostic: List available Gemini models
router.get('/models', authenticate, async (req, res) => {
    try {
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Try to list models
        const models = [];
        for await (const model of genAI.listModels()) {
            models.push({
                name: model.name,
                displayName: model.displayName,
                supportedGenerationMethods: model.supportedGenerationMethods
            });
        }

        res.json({
            apiKeySet: !!process.env.GEMINI_API_KEY,
            apiKeyPrefix: process.env.GEMINI_API_KEY?.substring(0, 10) + '...',
            models
        });
    } catch (error) {
        console.error('List models error:', error);
        res.status(500).json({
            error: error.message,
            apiKeySet: !!process.env.GEMINI_API_KEY,
            hint: 'Your API key may be invalid or not enabled for Generative AI'
        });
    }
});
// ============================================
// FUZZY MATCHING UTILITIES FOR SMART INTENT DETECTION
// ============================================

// Levenshtein distance algorithm for string similarity
const levenshteinDistance = (str1, str2) => {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    const m = s1.length;
    const n = s2.length;

    // Create distance matrix
    const dp = Array.from({ length: m + 1 }, (_, i) =>
        Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
    );

    // Fill the matrix
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (s1[i - 1] === s2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(
                    dp[i - 1][j],     // deletion
                    dp[i][j - 1],     // insertion
                    dp[i - 1][j - 1]  // substitution
                );
            }
        }
    }
    return dp[m][n];
};

// Fuzzy match - checks if any word in text is similar to keyword
const fuzzyMatch = (text, keyword, maxDistance = 2) => {
    // First check exact/partial match (fast path)
    if (text.includes(keyword.toLowerCase())) return true;

    // For multi-word keywords, check if all words are present (fuzzy)
    const keywordWords = keyword.toLowerCase().split(/\s+/);
    if (keywordWords.length > 1) {
        return keywordWords.every(kw => fuzzyMatch(text, kw, maxDistance));
    }

    // Split text into words and check each
    const words = text.split(/\s+/);
    for (const word of words) {
        // Skip very short words
        if (word.length < 3) continue;

        // Calculate similarity
        const distance = levenshteinDistance(word, keyword);

        // Dynamic threshold based on word length
        // Short words (<=4 chars): max 1 error
        // Medium words (5-7 chars): max 2 errors  
        // Long words (8+ chars): max 3 errors
        let threshold;
        if (keyword.length <= 4) threshold = 1;
        else if (keyword.length <= 7) threshold = 2;
        else threshold = 3;

        if (distance <= Math.min(threshold, maxDistance)) {
            return true;
        }
    }
    return false;
};

// Check if text contains any keyword from array (with fuzzy matching)
const containsAnyKeyword = (text, keywords) => {
    return keywords.some(keyword => fuzzyMatch(text, keyword));
};

// Process AI prompt with Gemini - Professional & Comprehensive
router.post('/prompt', authenticate, requireFeature('ai'), async (req, res) => {
    try {
        const { prompt, branchId, context } = req.body;
        const startTime = Date.now();
        const lowerPrompt = prompt.toLowerCase();

        // Initialize Gemini
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Enhanced keyword detection with synonyms and common variations
        const keywords = {
            inventory: ['stock', 'inventory', 'product', 'medicine', 'item', 'quantity', 'available', 'goods', 'drug', 'tablet', 'capsule', 'syrup'],
            lowStock: ['low stock', 'reorder', 'stock alert', 'running out', 'shortage', 'less', 'below', 'out of stock', 'empty', 'need more', 'running low', 'finish', 'finished'],
            expiry: ['expir', 'expire', 'expiry', 'expired', 'expiring', 'expiration', 'shelf life', 'date', 'validity', 'valid till', 'best before'],
            sales: ['sale', 'sales', 'revenue', 'income', 'earning', 'sold', 'billing', 'invoice', 'billed', 'transaction', 'order', 'receipt'],
            topSelling: ['top sell', 'best sell', 'popular', 'most sold', 'trending', 'highest', 'fast moving', 'best seller', 'top product', 'hot selling', 'demand'],
            today: ['today', 'daily', 'this day', 'todays', 'current day'],
            weekly: ['week', 'weekly', 'last 7 days', 'this week', 'past week', '7 days'],
            monthly: ['month', 'monthly', 'last 30 days', 'this month', 'past month', '30 days'],
            customer: ['customer', 'client', 'buyer', 'patient', 'purchaser', 'consumer'],
            profit: ['profit', 'margin', 'earning', 'gain', 'markup', 'net income', 'gross'],
            search: ['find', 'search', 'look for', 'where is', 'do we have', 'check', 'locate', 'show me', 'get', 'fetch', 'display']
        };

        // Smart intent detection with fuzzy matching
        const detectIntent = (text) => {
            const detected = {};
            for (const [key, words] of Object.entries(keywords)) {
                detected[key] = containsAnyKeyword(text, words);
            }
            return detected;
        };

        const intent = detectIntent(lowerPrompt);
        let dataContext = {};

        if (branchId) {
            // Always fetch baseline shop statistics
            const [totalProducts, totalInvoices, branch] = await Promise.all([
                prisma.product.count({ where: { branchId, isActive: true } }).catch(() => 0),
                prisma.invoice.count({ where: { branchId } }).catch(() => 0),
                prisma.branch.findUnique({ where: { id: branchId }, select: { name: true } }).catch(() => null)
            ]);

            dataContext.shopInfo = {
                branchName: branch?.name || 'Unknown',
                totalProducts,
                totalInvoices
            };

            // Low Stock Products
            if (intent.lowStock || intent.inventory) {
                const lowStockProducts = await prisma.product.findMany({
                    where: { branchId, isActive: true, quantity: { lte: 10 } },
                    select: { name: true, genericName: true, quantity: true, minStock: true, mrp: true, manufacturer: true },
                    orderBy: { quantity: 'asc' },
                    take: 15
                });
                if (lowStockProducts.length > 0) {
                    dataContext.lowStockProducts = lowStockProducts;
                    dataContext.lowStockCount = lowStockProducts.length;
                }
            }

            // Expiring Products
            if (intent.expiry) {
                const expiringProducts = await prisma.product.findMany({
                    where: {
                        branchId, isActive: true,
                        expiryDate: { lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), gte: new Date() }
                    },
                    select: { name: true, quantity: true, expiryDate: true, mrp: true, batchNumber: true },
                    orderBy: { expiryDate: 'asc' },
                    take: 15
                });
                if (expiringProducts.length > 0) {
                    dataContext.expiringProducts = expiringProducts;
                }
            }

            // Sales & Invoices
            if (intent.sales || intent.today) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const todayInvoices = await prisma.invoice.findMany({
                    where: { branchId, createdAt: { gte: today } },
                    select: { invoiceNumber: true, totalAmount: true, paymentMethod: true, customerName: true, createdAt: true },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                });

                const totalRevenue = todayInvoices.reduce((sum, inv) => sum + (parseFloat(inv.totalAmount) || 0), 0);
                dataContext.todaySales = {
                    invoiceCount: todayInvoices.length,
                    totalRevenue: `₹${totalRevenue.toFixed(2)}`,
                    recentInvoices: todayInvoices.slice(0, 5)
                };
            }

            // Top Selling Products
            if (intent.topSelling) {
                const topProducts = await prisma.invoiceItem.groupBy({
                    by: ['productId'],
                    where: { invoice: { branchId } },
                    _sum: { quantity: true },
                    orderBy: { _sum: { quantity: 'desc' } },
                    take: 10
                });

                const productIds = topProducts.map(p => p.productId);
                const products = await prisma.product.findMany({
                    where: { id: { in: productIds } },
                    select: { id: true, name: true, mrp: true, manufacturer: true }
                });

                dataContext.topSellingProducts = topProducts.map(tp => {
                    const product = products.find(p => p.id === tp.productId);
                    return { name: product?.name || 'Unknown', totalSold: tp._sum.quantity, price: `₹${product?.mrp || 0}` };
                });
            }

            // Product Search
            if (intent.search) {
                // Extract potential product name from query
                const searchTerms = lowerPrompt.replace(/find|search|look for|where is|do we have|check|the|a|an/gi, '').trim();
                if (searchTerms.length > 2) {
                    const foundProducts = await prisma.product.findMany({
                        where: {
                            branchId, isActive: true,
                            OR: [
                                { name: { contains: searchTerms, mode: 'insensitive' } },
                                { genericName: { contains: searchTerms, mode: 'insensitive' } }
                            ]
                        },
                        select: { name: true, genericName: true, quantity: true, mrp: true, expiryDate: true, manufacturer: true },
                        take: 10
                    });
                    if (foundProducts.length > 0) {
                        dataContext.searchResults = foundProducts;
                    }
                }
            }
        }

        // Professional system prompt - STRICT about using real data only
        const systemContext = `
You are **IntellPharma AI**, a pharmacy management assistant.

⚠️ **CRITICAL RULES - YOU MUST FOLLOW:**
1. ONLY use the EXACT data provided below - DO NOT invent or generate fake product names, quantities, or any data
2. If no data is provided, say "No data found" or ask the user to rephrase
3. NEVER make up medicine names or numbers - only show what's in the database
4. Format the provided data in a readable table or list format

**Shop:** ${dataContext.shopInfo?.branchName || 'Unknown'} 
**Total Products:** ${dataContext.shopInfo?.totalProducts || 0}
**Total Invoices:** ${dataContext.shopInfo?.totalInvoices || 0}

${Object.keys(dataContext).filter(k => k !== 'shopInfo').length > 0 ? `
═══════════════════════════════════════
📊 **ACTUAL DATABASE DATA (USE ONLY THIS):**
═══════════════════════════════════════
${JSON.stringify(dataContext, null, 2)}
═══════════════════════════════════════

Format this data nicely using markdown tables. Show ALL items from the data above.
` : `
No specific data was fetched. The user should ask about:
- "low stock" or "inventory" for stock alerts
- "expiring" for products near expiry
- "sales" or "today" for revenue data  
- "top selling" for popular products
- "find [name]" to search for a specific product

Tell the user what keywords to use to get data.
`}
`;

        const fullPrompt = `${systemContext}\n\n**User Query:** ${prompt}`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const responseText = response.text();

        const executionTime = Date.now() - startTime;

        // Store prompt history
        await prisma.promptHistory.create({
            data: { prompt, response: responseText, executionTime, userId: req.user.id, branchId }
        }).catch(() => { }); // Don't fail if history save fails

        res.json({
            response_text: responseText,
            execution_time: executionTime,
            data_fetched: Object.keys(dataContext).filter(k => k !== 'shopInfo')
        });
    } catch (error) {
        console.error('AI prompt error:', error);

        // Graceful error response
        const fallbackResponse = `I apologize, but I encountered an issue processing your request. 

**Possible reasons:**
- Temporary connection issue
- Invalid query format

**Please try:**
- Rephrasing your question
- Being more specific about what you need

If the issue persists, please contact support.`;

        res.status(500).json({
            response_text: fallbackResponse,
            error: true,
            message: error.message
        });
    }
});

// Parse Bill / Command text to structured JSON
router.post('/parse-bill', authenticate, requireFeature('ai'), async (req, res) => {
    try {
        const { text } = req.body;

        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

// Get smart suggested prompts based on role AND real database data
router.get('/suggested-prompts', authenticate, requireFeature('ai'), async (req, res) => {
    try {
        const role = req.user.role;
        const { branchId } = req.query;

        // Fetch real data to generate smart suggestions
        let smartSuggestions = [];

        if (branchId) {
            // Get real counts from database
            const [lowStockCount, expiringCount, todayInvoices] = await Promise.all([
                prisma.product.count({
                    where: {
                        branchId,
                        isActive: true,
                        quantity: { lte: 10 } // Using fixed threshold as we can't compare columns easily
                    }
                }).catch(() => 0),
                prisma.product.count({
                    where: {
                        branchId,
                        isActive: true,
                        expiryDate: {
                            lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
                            gte: new Date()
                        }
                    }
                }).catch(() => 0),
                prisma.invoice.count({
                    where: {
                        branchId,
                        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                    }
                }).catch(() => 0)
            ]);

            // Generate smart suggestions based on real data
            if (lowStockCount > 0) {
                smartSuggestions.push({
                    prompt: `Show me the ${lowStockCount} low stock items that need reordering`,
                    description: `${lowStockCount} products are below minimum stock`,
                    category: 'Inventory',
                    priority: lowStockCount > 10 ? 'high' : 'medium'
                });
            }

            if (expiringCount > 0) {
                smartSuggestions.push({
                    prompt: `List ${expiringCount} products expiring in the next 60 days`,
                    description: `${expiringCount} products need attention`,
                    category: 'Inventory',
                    priority: 'high'
                });
            }

            if (todayInvoices > 0) {
                smartSuggestions.push({
                    prompt: `Analyze today's ${todayInvoices} invoices and show sales summary`,
                    description: `${todayInvoices} invoices created today`,
                    category: 'Sales',
                    priority: 'medium'
                });
            }
        }

        // Get user's recent prompts for personalized suggestions
        const recentPrompts = await prisma.promptHistory.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 3,
            select: { prompt: true, createdAt: true }
        });

        const recentSuggestions = recentPrompts.map(p => ({
            prompt: p.prompt,
            description: `Asked ${new Date(p.createdAt).toLocaleDateString()}`,
            category: 'Recent',
            priority: 'low'
        }));

        // Get custom prompts from database
        const customPrompts = await prisma.suggestedPrompt.findMany({
            where: {
                isActive: true,
                roles: { has: role }
            }
        }).catch(() => []);

        // Combine all suggestions: Smart (data-driven) > Recent > Custom > Default
        const suggestions = [
            ...smartSuggestions,
            ...recentSuggestions,
            ...customPrompts.map(p => ({
                prompt: p.prompt,
                description: p.description,
                category: p.category,
                priority: 'medium'
            })),
            ...(defaultPrompts[role] || defaultPrompts.BILLING_STAFF)
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
