const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Use your active branch ID
const YOUR_BRANCH_ID = 'e4a6249d-7498-4847-a760-7c364eb0ed61';

async function addProducts() {
    try {
        const products = [
            {
                name: 'Digene Gel 200ml',
                genericName: 'Antacid',
                manufacturer: 'Abbott',
                barcode: '8901234567910',
                batchNumber: 'DIG2024A',
                expiryDate: new Date('2026-08-15'),
                mrp: 145.00,
                purchasePrice: 105.00,
                gstRate: 12,
                quantity: 85,
                minStock: 15,
                unit: 'Bottle'
            },
            {
                name: 'Combiflam',
                genericName: 'Ibuprofen + Paracetamol',
                manufacturer: 'Sanofi',
                barcode: '8901234567911',
                batchNumber: 'CMB2024B',
                expiryDate: new Date('2026-05-20'),
                mrp: 42.00,
                purchasePrice: 28.00,
                gstRate: 12,
                quantity: 320,
                minStock: 50,
                unit: 'Strip'
            },
            {
                name: 'Vicks VapoRub 50g',
                genericName: 'Menthol Ointment',
                manufacturer: 'P&G',
                barcode: '8901234567912',
                batchNumber: 'VVR2024C',
                expiryDate: new Date('2027-01-10'),
                mrp: 175.00,
                purchasePrice: 125.00,
                gstRate: 18,
                quantity: 65,
                minStock: 10,
                unit: 'Jar'
            },
            {
                name: 'Liv 52 Tablets',
                genericName: 'Liver Tonic',
                manufacturer: 'Himalaya',
                barcode: '8901234567913',
                batchNumber: 'LIV2024D',
                expiryDate: new Date('2027-03-25'),
                mrp: 165.00,
                purchasePrice: 120.00,
                gstRate: 12,
                quantity: 180,
                minStock: 25,
                unit: 'Bottle'
            },
            {
                name: 'Zincovit Tablets',
                genericName: 'Multivitamin',
                manufacturer: 'Apex Labs',
                barcode: '8901234567914',
                batchNumber: 'ZNC2024E',
                expiryDate: new Date('2026-11-30'),
                mrp: 135.00,
                purchasePrice: 95.00,
                gstRate: 5,
                quantity: 220,
                minStock: 30,
                unit: 'Strip'
            }
        ];

        console.log(`Adding 5 products to your branch (${YOUR_BRANCH_ID})...\n`);

        for (const p of products) {
            await prisma.product.create({
                data: { ...p, branchId: YOUR_BRANCH_ID }
            });
            console.log(`✅ Added: ${p.name}`);
        }

        console.log('\n🎉 Done! Added 5 new products to YOUR branch.');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

addProducts();
