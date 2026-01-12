// Seed script to add sample pharmacy products
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sampleProducts = [
    {
        name: 'Paracetamol 500mg',
        genericName: 'Paracetamol',
        manufacturer: 'Cipla Ltd',
        barcode: '8901234567890',
        batchNumber: 'PCM2024A',
        expiryDate: new Date('2026-06-30'),
        mrp: 25.00,
        purchasePrice: 18.00,
        gstRate: 12,
        hsnCode: '30049099',
        quantity: 500,
        minStock: 50,
        unit: 'Strip'
    },
    {
        name: 'Amoxicillin 500mg',
        genericName: 'Amoxicillin',
        manufacturer: 'Sun Pharma',
        barcode: '8901234567891',
        batchNumber: 'AMX2024B',
        expiryDate: new Date('2025-12-31'),
        mrp: 85.00,
        purchasePrice: 60.00,
        gstRate: 12,
        hsnCode: '30041099',
        quantity: 200,
        minStock: 30,
        unit: 'Strip'
    },
    {
        name: 'Cetirizine 10mg',
        genericName: 'Cetirizine',
        manufacturer: 'Dr Reddy\'s',
        barcode: '8901234567892',
        batchNumber: 'CTZ2024C',
        expiryDate: new Date('2026-03-15'),
        mrp: 35.00,
        purchasePrice: 22.00,
        gstRate: 12,
        hsnCode: '30049099',
        quantity: 350,
        minStock: 40,
        unit: 'Strip'
    },
    {
        name: 'Azithromycin 500mg',
        genericName: 'Azithromycin',
        manufacturer: 'Zydus Cadila',
        barcode: '8901234567893',
        batchNumber: 'AZI2024D',
        expiryDate: new Date('2025-09-20'),
        mrp: 120.00,
        purchasePrice: 85.00,
        gstRate: 12,
        hsnCode: '30041099',
        quantity: 150,
        minStock: 25,
        unit: 'Strip'
    },
    {
        name: 'Omeprazole 20mg',
        genericName: 'Omeprazole',
        manufacturer: 'Lupin Ltd',
        barcode: '8901234567894',
        batchNumber: 'OMP2024E',
        expiryDate: new Date('2026-08-10'),
        mrp: 45.00,
        purchasePrice: 30.00,
        gstRate: 12,
        hsnCode: '30049099',
        quantity: 400,
        minStock: 50,
        unit: 'Strip'
    },
    {
        name: 'Metformin 500mg',
        genericName: 'Metformin',
        manufacturer: 'USV Ltd',
        barcode: '8901234567895',
        batchNumber: 'MTF2024F',
        expiryDate: new Date('2026-04-25'),
        mrp: 55.00,
        purchasePrice: 38.00,
        gstRate: 12,
        hsnCode: '30049099',
        quantity: 600,
        minStock: 100,
        unit: 'Strip'
    },
    {
        name: 'Pantoprazole 40mg',
        genericName: 'Pantoprazole',
        manufacturer: 'Alkem Labs',
        barcode: '8901234567896',
        batchNumber: 'PAN2024G',
        expiryDate: new Date('2026-01-30'),
        mrp: 75.00,
        purchasePrice: 50.00,
        gstRate: 12,
        hsnCode: '30049099',
        quantity: 300,
        minStock: 40,
        unit: 'Strip'
    },
    {
        name: 'Dolo 650',
        genericName: 'Paracetamol 650mg',
        manufacturer: 'Micro Labs',
        barcode: '8901234567897',
        batchNumber: 'DOL2024H',
        expiryDate: new Date('2026-07-15'),
        mrp: 32.00,
        purchasePrice: 22.00,
        gstRate: 12,
        hsnCode: '30049099',
        quantity: 800,
        minStock: 100,
        unit: 'Strip'
    },
    {
        name: 'Vitamin D3 60000 IU',
        genericName: 'Cholecalciferol',
        manufacturer: 'Mankind Pharma',
        barcode: '8901234567898',
        batchNumber: 'VTD2024I',
        expiryDate: new Date('2027-02-28'),
        mrp: 150.00,
        purchasePrice: 100.00,
        gstRate: 5,
        hsnCode: '29362990',
        quantity: 250,
        minStock: 30,
        unit: 'Sachet'
    },
    {
        name: 'Crocin Advance',
        genericName: 'Paracetamol 500mg',
        manufacturer: 'GSK',
        barcode: '8901234567899',
        batchNumber: 'CRC2024J',
        expiryDate: new Date('2025-11-30'),
        mrp: 28.00,
        purchasePrice: 19.00,
        gstRate: 12,
        hsnCode: '30049099',
        quantity: 450,
        minStock: 60,
        unit: 'Strip'
    },
    {
        name: 'Ibuprofen 400mg',
        genericName: 'Ibuprofen',
        manufacturer: 'Abbott',
        barcode: '8901234567900',
        batchNumber: 'IBU2024K',
        expiryDate: new Date('2026-05-20'),
        mrp: 40.00,
        purchasePrice: 28.00,
        gstRate: 12,
        hsnCode: '30049099',
        quantity: 320,
        minStock: 40,
        unit: 'Strip'
    },
    {
        name: 'Aspirin 75mg',
        genericName: 'Aspirin',
        manufacturer: 'Bayer',
        barcode: '8901234567901',
        batchNumber: 'ASP2024L',
        expiryDate: new Date('2026-09-15'),
        mrp: 22.00,
        purchasePrice: 15.00,
        gstRate: 12,
        hsnCode: '30049099',
        quantity: 550,
        minStock: 80,
        unit: 'Strip'
    },
    {
        name: 'Betadine Solution 100ml',
        genericName: 'Povidone Iodine',
        manufacturer: 'Win Medicare',
        barcode: '8901234567902',
        batchNumber: 'BTD2024M',
        expiryDate: new Date('2027-01-10'),
        mrp: 95.00,
        purchasePrice: 70.00,
        gstRate: 18,
        hsnCode: '38089490',
        quantity: 120,
        minStock: 20,
        unit: 'Bottle'
    },
    {
        name: 'ORS Powder',
        genericName: 'Oral Rehydration Salts',
        manufacturer: 'Electral',
        barcode: '8901234567903',
        batchNumber: 'ORS2024N',
        expiryDate: new Date('2026-12-31'),
        mrp: 25.00,
        purchasePrice: 18.00,
        gstRate: 5,
        hsnCode: '30049099',
        quantity: 700,
        minStock: 100,
        unit: 'Sachet'
    },
    {
        name: 'Atorvastatin 10mg',
        genericName: 'Atorvastatin',
        manufacturer: 'Ranbaxy',
        barcode: '8901234567904',
        batchNumber: 'ATV2024O',
        expiryDate: new Date('2025-08-25'),
        mrp: 65.00,
        purchasePrice: 45.00,
        gstRate: 12,
        hsnCode: '30049099',
        quantity: 280,
        minStock: 35,
        unit: 'Strip'
    }
];

async function seed() {
    try {
        // Find the first branch in the database
        const branch = await prisma.branch.findFirst();

        if (!branch) {
            console.log('❌ No branch found! Please create a branch first by registering and logging in.');
            return;
        }

        console.log(`📍 Found branch: ${branch.name} (${branch.id})`);
        console.log('🔄 Adding sample products...\n');

        let added = 0;
        for (const product of sampleProducts) {
            // Check if product already exists
            const existing = await prisma.product.findFirst({
                where: {
                    barcode: product.barcode,
                    branchId: branch.id
                }
            });

            if (existing) {
                console.log(`⏭️  Skipping: ${product.name} (already exists)`);
                continue;
            }

            await prisma.product.create({
                data: {
                    ...product,
                    branchId: branch.id
                }
            });
            console.log(`✅ Added: ${product.name}`);
            added++;
        }

        console.log(`\n🎉 Done! Added ${added} new products to ${branch.name}`);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
