const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize, requireBranchAccess, logAudit } = require('../middleware/auth');
const { requireFeature } = require('./subscription.routes');

const router = express.Router();

// Shared helper: try multiple Gemini models with fallback on rate limit
async function callGeminiWithFallback(prompt, imagePart = null, generationConfig = null, systemInstruction = null) {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"];
    let lastError = null;

    for (const modelName of models) {
        try {
            console.log(`Trying model: ${modelName}`);
            
            // Build model options
            const modelOptions = { model: modelName };
            if (systemInstruction) modelOptions.systemInstruction = systemInstruction;
            
            const model = genAI.getGenerativeModel(modelOptions);
            const content = imagePart ? [prompt, imagePart] : prompt;
            
            // Pass generationConfig if provided
            const requestOptions = generationConfig ? { generationConfig } : {};
            
            const result = await model.generateContent(content, requestOptions);
            const response = await result.response;
            return response.text();
        } catch (err) {
            console.warn(`Model ${modelName} failed:`, err.message?.substring(0, 100));
            lastError = err;
            if (err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('404')) {
                continue;
            }
            break;
        }
    }
    throw lastError || new Error('All Gemini models failed');
}

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

        // Gemini is called after building the prompt below

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

        const responseText = await callGeminiWithFallback(fullPrompt);

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

        const billPrompt = `
            Extract medicines/products, quantities, and prices (if available) from the following text.
            Text: "${text}"
            
            CRITICAL EXTRACTION RULES FOR SAAS:
            - "rawQty": The exact number of units purchased (e.g., "5", "10 boxes").
            - "packSize": The exact pack size description (e.g., "10's", "1x15", "15 Tab"). If not mentioned, return empty string "".
            DO NOT perform math. Just return the text strings.
            
            Return ONLY a valid JSON array of objects.
            If no products are found, return empty array [].
        `;

        const SchemaType = require("@google/generative-ai").SchemaType;
        const generationConfig = {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.ARRAY,
                description: "List of products extracted from the text",
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                        name: { type: SchemaType.STRING, description: "Product name" },
                        rawQty: { type: SchemaType.STRING, description: "The exact Quantity text written on the bill (e.g., '10', '5 Boxes')" },
                        packSize: { type: SchemaType.STRING, description: "The exact text from the PACK or PKG column (e.g., '10', '1x15', '15'). CRITICAL: Do NOT miss this column!", nullable: true },
                        price: { type: SchemaType.NUMBER, description: "Price if mentioned", nullable: true },
                        unit: { type: SchemaType.STRING, description: "Packaging unit if mentioned", nullable: true }
                    },
                    required: ["name", "rawQty"]
                }
            }
        };

        let jsonString = await callGeminiWithFallback(billPrompt, null, generationConfig);

        // Cleanup potential markdown code blocks
        jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();

        const products = JSON.parse(jsonString);

        // Helper to parse pack strings like "1x15", "20's", "10 Tab", "100ML"
        // SAFE FOR SaaS: only multiplies explicit AxB patterns, never random numbers
        const parseQuantityString = (str) => {
            if (!str) return 1;
            let s = str.toString().toUpperCase().trim();
            
            // Remove volume/weight parts entirely — these are NOT pack multipliers
            s = s.replace(/\d+\s*(ML|GM|KG|L|LITER|LITRE|MG|MCG|VIAL|AMP|TUBE)S?\b/gi, '').trim();
            if (!s) return 1;
            
            // Remove common packaging unit words (not multipliers)
            s = s.replace(/\b(TAB|TABS|TABLET|TABLETS|STRIP|STRIPS|CAP|CAPS|CAPSULE|CAPSULES|BOX|PCS|PIECES|BOTTLE|BOTTLES|UNIT|UNITS|NOS|'S)\b/gi, '').trim();
            if (!s) return 1;
            
            // Pattern 1: Explicit multiplication like "1x15", "2X10", "1x15x3"
            if (/\d+\s*[xX×]\s*\d+/.test(s)) {
                const parts = s.split(/[xX×]/i).map(p => parseInt(p.trim(), 10)).filter(n => !isNaN(n) && n > 0);
                if (parts.length > 0) {
                    return parts.reduce((acc, n) => acc * n, 1);
                }
            }
            
            // Pattern 2: Single clean number like "10", "15", "20's" (after stripping)
            const singleNum = s.match(/^\s*(\d+)\s*$/);
            if (singleNum) {
                const num = parseInt(singleNum[1], 10);
                return num > 0 ? num : 1;
            }
            
            // Default: unable to parse confidently — return 1 (safe for SaaS)
            return 1;
        };

        const finalProducts = products.map(p => {
            // CRITICAL: Only use rawQty — never fall back to p.quantity which may be pre-multiplied by AI
            let baseQty = 1;
            if (p.rawQty !== undefined && p.rawQty !== null) {
                const parsed = parseFloat(p.rawQty.toString().match(/[\d.]+/)?.[0] || '1');
                if (!isNaN(parsed) && parsed > 0) baseQty = parsed;
            } else {
                console.warn(`[parse-bill] Item "${p.name}" missing rawQty, defaulting to 1`);
            }
            const multiplier = parseQuantityString(p.rawPack || p.packSize);
            const finalQuantity = baseQty * multiplier;
            
            // Sanity check for SaaS: warn if result seems abnormally large
            if (multiplier > 1 && finalQuantity > 5000) {
                console.warn(`[parse-bill] Unusually large quantity for "${p.name}": ${baseQty} × ${multiplier} = ${finalQuantity}`);
            }
            
            return {
                name: p.name,
                baseQty: baseQty,
                packSize: multiplier,
                quantity: finalQuantity,
                price: p.price,
                mrp: p.mrp,
                unit: p.unit,
                batchNumber: p.batchNumber,
                expiryDate: (() => {
                    const d = normalizeExpiryDate(p.expiryDate);
                    return d ? d.toISOString().substring(0, 10) : p.expiryDate || null;
                })(),
                manufacturer: p.manufacturer
            };
        });

        res.json({ products: finalProducts });
    } catch (error) {
        console.error('Bill parsing error:', error);
        res.status(500).json({ error: 'Failed to parse bill text.' });
    }
});

// Parse bill from uploaded file (image/PDF) using Gemini Vision
router.post('/parse-bill-file', authenticate, requireFeature('ai'), async (req, res) => {
    try {
        const { fileData, mimeType, branchId } = req.body;

        console.log('Parse bill file request:', { mimeType, branchId, dataLength: fileData?.length || 0 });

        if (!fileData || !mimeType) {
            return res.status(400).json({ error: 'File data and mime type are required.' });
        }


        // Fetch existing product names from this branch for matching
        let existingProducts = [];
        if (branchId) {
            existingProducts = await prisma.product.findMany({
                where: { branchId, isActive: true },
                select: { name: true, genericName: true, mrp: true, purchasePrice: true }
            });
        }

        const existingNamesList = existingProducts.map(p => p.name).join(', ');

        const prompt = `You are an expert pharmacy data extraction AI. Your job is to extract EVERY row of purchased medicines or items from the provided invoice/bill image into data.

⚠️ ABSOLUTELY CRITICAL — DO NOT DO ANY MATH:
You MUST return the EXACT raw text from each column. DO NOT multiply QTY × PACK yourself.
DO NOT calculate totals. The server handles all arithmetic. Just copy the numbers from the bill.
Example: If QTY column says "4" and PACK column says "10", return rawQty: "4" and packSize: "10".
NEVER return rawQty: "40" in this case — that would be WRONG.

EXISTING INVENTORY MATCHING:
The shop already has these products: ${existingNamesList || 'None yet'}
CRITICAL: If an extracted product name is misspelled or very similar to an existing product (e.g., "Crocin adv" vs "Crocin Advance"), use the EXISTING matching name.

EXTRACTION INSTRUCTIONS:
1. Examine the image carefully. Identify all tables or lists of purchased items.
2. For each distinct product row, extract:
   - name: The product/medicine name. Exclude pack sizes from the name.
   - rawQty: The EXACT number from the QTY/Billed Qty column. DO NOT multiply by pack size.
   - packSize: The EXACT text from the PACK/PKG column (e.g., "10", "15", "1x15").
   - price: The PURCHASE PRICE per unit (what the pharmacy paid the distributor).
   - mrp: The MAXIMUM RETAIL PRICE per unit (what the end customer pays).
   - unit: Packaging unit (Strip, Tablet, Bottle, Box, Tube, Pcs, etc.).
   - batchNumber: Batch or Lot number.
   - expiryDate: The EXACT expiry date text as printed on the bill (e.g., "04/27", "04/2027", "APR-27", "2027-04"). Do NOT try to convert the format — just copy it exactly.
   - manufacturer: Company name (found in the COMP column or header).

UNIVERSAL PRICING PRINCIPLES (apply to ALL bill formats):

PRINCIPLE 1 — Identify the Purchase Price:
The purchase price is what the pharmacy paid for the item. It appears under column headers like: Rate, P.Rate, PTR, PTS, Net Rate, Cost, Supplier Price, Trade Price, Basic Rate, or simply "Price" on a purchase invoice. It is ALWAYS LOWER than MRP per unit.

PRINCIPLE 2 — Identify the MRP:
MRP is the Maximum Retail Price printed on the product packaging. It appears under headers like: MRP, M.R.P, M.R.P., Retail, Retail Price, or Selling Price. It is ALWAYS the HIGHEST per-unit price on the row.

PRINCIPLE 3 — Multiple MRP columns:
Some bills show multiple MRP values (e.g., N_MRP/O_MRP, New MRP/Old MRP, Revised MRP/Previous MRP). In ALL such cases, extract the CURRENT/NEW/REVISED MRP — this is the one currently printed on the product packaging. Ignore the old/previous value.

PRINCIPLE 4 — Single price column:
If there is only ONE price column and it is a PURCHASE bill/invoice, check the header. If labeled as Rate/PTR/PTS/Cost → it is the purchase price ("price"). If labeled as MRP → it is the MRP. If unlabeled → assume purchase price and leave "mrp" as null.

PRINCIPLE 5 — Amount vs Per-Unit:
If you see both a per-unit Rate AND a total Amount, use the per-unit Rate as "price". If only a total Amount is shown, divide by the quantity to get per-unit price.

PRINCIPLE 6 — Free/Bonus quantities:
Some bills show a "Free" or "Bonus" column. Only extract the paid "Qty" as the quantity. Do NOT add the free items to the quantity.

PRINCIPLE 7 — Discount columns:
Ignore discount percentage columns (Disc%, Trade Disc, Cash Disc, Scheme). They are for reference only. Extract the final Rate after discounts if available.

PRINCIPLE 8 — Extract Quantity and Pack Size perfectly (CRITICAL FOR SaaS STABILITY):
Bills ALWAYS list the quantity of items purchased, and MOST bills also list a "PACK" or "PKG" size in a separate column (e.g., 10, 15, 1x15).
1. Identify the column stating the purchased quantity (often "QTY.", "Billed Qty") -> Extract EXACTLY as "rawQty" (e.g. "4").
2. The "PACK" column is usually a narrow column located right between the Product Name/Particulars and the BATCH column.
3. You MUST extract whatever is written in the "PACK" column exactly as "packSize" (e.g., "10", "15", "1", "1x15"). DO NOT skip this column!
4. CRITICAL: If the QTY is "4" and the PACK is "10", you MUST return rawQty: "4" and packSize: "10".
- If there is NO Pack column anywhere, leave "packSize" empty (""). DO NOT guess.
DO NOT do any math. Just return the exact raw text strings from their respective columns.

3. If a value is unreadable, blurred, or missing, omit the field or return null. Do NOT guess prices or numbers.
4. If the bill is completely illegible or not an invoice, return an empty list.`;

        const imagePart = {
            inlineData: {
                data: fileData,
                mimeType: mimeType
            }
        };

        // Enforce strict JSON Schema Output for consistent SaaS parsing
        const SchemaType = require("@google/generative-ai").SchemaType;
        const generationConfig = {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.ARRAY,
                description: "List of products extracted from the bill",
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                        name: { type: SchemaType.STRING, description: "Normalized product name" },
                        rawQty: { type: SchemaType.STRING, description: "The exact Quantity text written on the bill" },
                        packSize: { type: SchemaType.STRING, description: "The exact text from the PACK or PKG column (e.g., '10', '15', '1x15'). CRITICAL: Do NOT miss this column!", nullable: true },
                        price: { type: SchemaType.NUMBER, description: "Purchase price per single unit", nullable: true },
                        mrp: { type: SchemaType.NUMBER, description: "Maximum Retail Price per single unit", nullable: true },
                        unit: { type: SchemaType.STRING, description: "Packaging unit (Strip, Bottle, Box, etc.)", nullable: true },
                        batchNumber: { type: SchemaType.STRING, description: "Batch or Lot number", nullable: true },
                        expiryDate: { type: SchemaType.STRING, description: "Expiry date EXACTLY as printed on the bill (e.g., '04/27', '04/2027', 'APR-27'). Do NOT reformat.", nullable: true },
                        manufacturer: { type: SchemaType.STRING, description: "Pharmaceutical company name", nullable: true }
                    },
                    required: ["name", "rawQty"]
                }
            }
        };

        let jsonString = await callGeminiWithFallback(prompt, imagePart, generationConfig);

        // Cleanup potential markdown code blocks (Gemini sometimes still returns them despite responseMimeType)
        jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();

        // Parse the JSON array output
        const products = JSON.parse(jsonString);
        console.log(`Bill file parsed: ${products.length} products found`);

        // Helper to parse pack strings like "1x15", "20's", "10 Tab"
        // SAFE FOR SaaS: only multiplies explicit AxB patterns, never random numbers
        const parseQuantityString = (str) => {
            if (!str) return 1;
            let s = str.toString().toUpperCase().trim();
            
            // Remove volume/weight parts entirely — these are NOT pack multipliers
            s = s.replace(/\d+\s*(ML|GM|KG|L|LITER|LITRE|MG|MCG|VIAL|AMP|TUBE)S?\b/gi, '').trim();
            if (!s) return 1;
            
            // Remove common packaging unit words (not multipliers)
            s = s.replace(/\b(TAB|TABS|TABLET|TABLETS|STRIP|STRIPS|CAP|CAPS|CAPSULE|CAPSULES|BOX|PCS|PIECES|BOTTLE|BOTTLES|UNIT|UNITS|NOS|'S)\b/gi, '').trim();
            if (!s) return 1;
            
            // Pattern 1: Explicit multiplication like "1x15", "2X10", "1x15x3"
            if (/\d+\s*[xX×]\s*\d+/.test(s)) {
                const parts = s.split(/[xX×]/i).map(p => parseInt(p.trim(), 10)).filter(n => !isNaN(n) && n > 0);
                if (parts.length > 0) {
                    return parts.reduce((acc, n) => acc * n, 1);
                }
            }
            
            // Pattern 2: Single clean number like "10", "15", "20's" (after stripping)
            const singleNum = s.match(/^\s*(\d+)\s*$/);
            if (singleNum) {
                const num = parseInt(singleNum[1], 10);
                return num > 0 ? num : 1;
            }
            
            // Default: unable to parse confidently — return 1 (safe for SaaS)
            return 1;
        };

        const finalProducts = products.map((p, i) => {
            // CRITICAL: Only use rawQty — never fall back to p.quantity which may be pre-multiplied by AI
            let baseQty = 1; 
            if (p.rawQty !== undefined && p.rawQty !== null) {
                const parsed = parseFloat(p.rawQty.toString().match(/[\d.]+/)?.[0] || '1');
                if (!isNaN(parsed) && parsed > 0) baseQty = parsed;
            } else {
                console.warn(`[parse-bill-file] Item "${p.name}" missing rawQty, defaulting to 1`);
            }

            const multiplier = parseQuantityString(p.rawPack || p.packSize);
            const finalQuantity = baseQty * multiplier;

            console.log(`\n[Item ${i + 1}] ${p.name}`);
            console.log(`  -> rawQty: "${p.rawQty}", packSize: "${p.packSize}"`);
            console.log(`  -> parsed baseQty: ${baseQty}, parsed multiplier: ${multiplier}`);
            console.log(`  -> Final Qty: ${finalQuantity}`);
            
            // Sanity check for SaaS: warn if result seems abnormally large
            if (multiplier > 1 && finalQuantity > 5000) {
                console.warn(`[parse-bill-file] Unusually large quantity for "${p.name}": ${baseQty} × ${multiplier} = ${finalQuantity}`);
            }

            return {
                name: p.name,
                baseQty: baseQty,
                packSize: multiplier,
                quantity: finalQuantity,
                price: p.price,
                mrp: p.mrp,
                unit: p.unit,
                batchNumber: p.batchNumber,
                expiryDate: (() => {
                    const d = normalizeExpiryDate(p.expiryDate);
                    return d ? d.toISOString().substring(0, 10) : p.expiryDate || null;
                })(),
                manufacturer: p.manufacturer
            };
        });

        res.json({ products: finalProducts });
    } catch (error) {
        console.error('Bill file parsing error:', error.message || error);
        const isQuota = error.message?.includes('429') || error.message?.includes('quota');
        const msg = isQuota
            ? 'API quota exceeded. Please wait a minute and try again.'
            : `Failed to parse bill file: ${error.message || 'Unknown error'}`;
        res.status(isQuota ? 429 : 500).json({ error: msg });
    }
});

// ============================================
// EXPIRY DATE NORMALIZER — handles all pharmacy bill date formats
// ============================================
// Pharmacy bills use many date formats: 04/27, 04-27, 04/2027, APR-27, 2027-04, 2027-04-01, etc.
// In pharmacy context, "04/27" ALWAYS means April 2027 (MM/YY), never April 27 of some year.
const normalizeExpiryDate = (dateStr) => {
    if (!dateStr) return null;
    const s = dateStr.toString().trim();
    if (!s) return null;

    const MONTH_NAMES = {
        JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
        JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12
    };

    // Helper: expand 2-digit year to 4-digit (always 20xx for pharmacy context)
    const expandYear = (y) => {
        const num = parseInt(y, 10);
        return num < 100 ? 2000 + num : num;
    };

    let month, year;

    // Pattern 1: "MM/YY" or "MM-YY" or "MM/YYYY" or "MM-YYYY" (most common on Indian pharmacy bills)
    const mmYY = s.match(/^(\d{1,2})\s*[\/\-]\s*(\d{2,4})$/);
    if (mmYY) {
        const a = parseInt(mmYY[1], 10);
        const b = parseInt(mmYY[2], 10);
        // If first number is 1-12, treat as MM/YY
        if (a >= 1 && a <= 12) {
            month = a;
            year = expandYear(b);
        } else {
            // Could be YY/MM (rare) — try to detect
            if (b >= 1 && b <= 12) {
                month = b;
                year = expandYear(a);
            }
        }
    }

    // Pattern 2: "YYYY-MM" or "YYYY/MM"
    if (!month) {
        const yyyyMM = s.match(/^(\d{4})\s*[\/\-]\s*(\d{1,2})$/);
        if (yyyyMM) {
            year = parseInt(yyyyMM[1], 10);
            month = parseInt(yyyyMM[2], 10);
        }
    }

    // Pattern 3: "YYYY-MM-DD" (full ISO date)
    if (!month) {
        const iso = s.match(/^(\d{4})\s*[\/\-]\s*(\d{1,2})\s*[\/\-]\s*(\d{1,2})$/);
        if (iso) {
            year = parseInt(iso[1], 10);
            month = parseInt(iso[2], 10);
            // day is ignored — pharmacy expiry is month-level
        }
    }

    // Pattern 4: "APR-27", "APR/27", "APR 2027" (month name formats)
    if (!month) {
        const monthName = s.match(/^([A-Za-z]{3,})\s*[\/\-\s]\s*(\d{2,4})$/);
        if (monthName) {
            const mKey = monthName[1].toUpperCase().substring(0, 3);
            if (MONTH_NAMES[mKey]) {
                month = MONTH_NAMES[mKey];
                year = expandYear(monthName[2]);
            }
        }
    }

    // Pattern 5: "27-APR", "2027/APR" (reversed month name)
    if (!month) {
        const revMonth = s.match(/^(\d{2,4})\s*[\/\-\s]\s*([A-Za-z]{3,})$/);
        if (revMonth) {
            const mKey = revMonth[2].toUpperCase().substring(0, 3);
            if (MONTH_NAMES[mKey]) {
                month = MONTH_NAMES[mKey];
                year = expandYear(revMonth[1]);
            }
        }
    }

    // If we successfully parsed month and year, build the date
    if (month && year && month >= 1 && month <= 12 && year >= 2000) {
        const d = new Date(Date.UTC(year, month - 1, 1));
        if (!isNaN(d.getTime())) return d;
    }

    // Fallback: try native Date parsing as last resort
    const fallback = new Date(s);
    if (!isNaN(fallback.getTime())) {
        // Sanity check: if year < 2020, it's likely a misparse (like 2001 from 04/27)
        if (fallback.getFullYear() < 2020) {
            console.warn(`[normalizeExpiryDate] Native Date parsed "${s}" as ${fallback.toISOString()} — year too old, likely wrong. Ignoring.`);
            return null;
        }
        return fallback;
    }

    console.warn(`[normalizeExpiryDate] Could not parse: "${s}"`);
    return null;
};

// Confirm parsed bill data and update inventory
router.post('/confirm-bill', authenticate, authorize('OWNER', 'MANAGER', 'INVENTORY_STAFF'), requireFeature('ai'), async (req, res) => {
    try {
        const { products, branchId } = req.body;

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'No products to process.' });
        }

        if (!branchId) {
            return res.status(400).json({ error: 'Branch ID is required.' });
        }

        const results = {
            updated: [],
            created: [],
            errors: []
        };

        for (const item of products) {
            try {
                let parsedExpiryDate = null;
                if (item.expiryDate) {
                    try {
                        parsedExpiryDate = normalizeExpiryDate(item.expiryDate);
                    } catch (err) {
                        console.warn(`[confirm-bill] Could not parse expiry date "${item.expiryDate}" for ${item.name}`);
                        parsedExpiryDate = null;
                    }
                }

                // Try to find existing product by name (case-insensitive)
                const existingProduct = await prisma.product.findFirst({
                    where: {
                        branchId,
                        isActive: true,
                        name: { equals: item.name, mode: 'insensitive' }
                    }
                });

                if (existingProduct) {
                    // Calculate quantity to add — use Math.round(parseFloat) to preserve fractional accuracy
                    const qtyToAdd = Math.round(parseFloat(item.quantity) || 0);
                    const newTotalQty = Number(existingProduct.quantity) + qtyToAdd;

                    // Update existing product — add stock
                    const updatedProduct = await prisma.product.update({
                        where: { id: existingProduct.id },
                        data: {
                            quantity: newTotalQty,
                            // Update purchase price and MRP if provided (latest bill takes priority)
                            ...(item.price && { purchasePrice: parseFloat(item.price) }),
                            ...(item.mrp && { mrp: parseFloat(item.mrp) }),
                            ...(item.batchNumber && { batchNumber: item.batchNumber }),
                            ...(parsedExpiryDate && { expiryDate: parsedExpiryDate }),
                            isActive: true
                        }
                    });

                    await logAudit(req.user.id, branchId, 'STOCK_UPDATE', 'Product', updatedProduct.id,
                        `Bill Parser: Added ${qtyToAdd} (${item.baseQty || '?'} × ${item.packSize || '1'}) to stock. New total: ${updatedProduct.quantity}`, req.ip);

                    results.updated.push({
                        name: updatedProduct.name,
                        quantityAdded: qtyToAdd,
                        newTotal: Number(updatedProduct.quantity)
                    });
                } else {
                    // Create new product
                    const newQty = Math.round(parseFloat(item.quantity) || 0);
                    const newProduct = await prisma.product.create({
                        data: {
                            name: item.name.trim(),
                            manufacturer: item.manufacturer?.trim() || null,
                            batchNumber: item.batchNumber?.trim() || null,
                            expiryDate: parsedExpiryDate,
                            mrp: parseFloat(item.mrp) || parseFloat(item.price) || 0,
                            purchasePrice: parseFloat(item.price) || 0,
                            gstRate: 12,
                            quantity: newQty,
                            minStock: 10,
                            unit: item.unit?.trim() || 'Pcs',
                            tabletsPerStrip: 10,
                            branchId
                        }
                    });

                    await logAudit(req.user.id, branchId, 'CREATE', 'Product', newProduct.id,
                        `Bill Parser: Created product "${newProduct.name}" with qty ${newQty} (${item.baseQty || '?'} × ${item.packSize || '1'})`, req.ip);

                    results.created.push({
                        name: newProduct.name,
                        quantity: newQty
                    });
                }
            } catch (itemError) {
                console.error(`Error processing item ${item.name}:`, itemError.message);
                results.errors.push({
                    name: item.name,
                    error: itemError.message
                });
            }
        }

        res.json({
            message: `Processed ${products.length} items: ${results.updated.length} updated, ${results.created.length} created.`,
            ...results
        });
    } catch (error) {
        console.error('Confirm bill error:', error);
        res.status(500).json({ error: 'Failed to process bill confirmation.' });
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
