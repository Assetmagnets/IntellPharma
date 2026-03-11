/**
 * One-time backfill script:
 * Finds all products that are NOT assigned to any rack
 * and auto-assigns them (creating a "General Rack" if needed).
 */
require('dotenv').config();
const prisma = require('./src/lib/prisma');

async function backfill() {
    // Get all branches
    const branches = await prisma.branch.findMany({ select: { id: true, name: true } });
    console.log(`Found ${branches.length} branch(es)\n`);

    for (const branch of branches) {
        console.log(`--- Branch: ${branch.name} (${branch.id}) ---`);

        // Find products with NO location entry
        const unassigned = await prisma.product.findMany({
            where: {
                branchId: branch.id,
                isActive: true,
                locations: { none: {} }
            }
        });

        if (unassigned.length === 0) {
            console.log('  All products already assigned. Skipping.\n');
            continue;
        }

        console.log(`  Found ${unassigned.length} unassigned product(s)`);

        // Find or create a GENERAL rack for this branch
        let rack = await prisma.rack.findFirst({
            where: { branchId: branch.id, isActive: true, type: 'GENERAL' },
            include: {
                shelves: {
                    orderBy: { priority: 'desc' },
                    include: { _count: { select: { locations: true } } }
                }
            }
        });

        if (!rack) {
            console.log('  No rack found — creating "General Rack"...');
            const shelfCount = 5;
            rack = await prisma.$transaction(async (tx) => {
                const newRack = await tx.rack.create({
                    data: {
                        branchId: branch.id,
                        name: 'General Rack',
                        type: 'GENERAL',
                        description: 'Auto-created default rack',
                        totalShelves: shelfCount,
                        categoryTags: [],
                        maxCapacity: shelfCount * 20
                    }
                });

                const shelvesData = [];
                for (let i = 1; i <= shelfCount; i++) {
                    const mid = Math.ceil(shelfCount / 2);
                    const priority = Math.max(0, 10 - Math.abs(i - mid));
                    shelvesData.push({
                        rackId: newRack.id,
                        name: `Shelf ${i}`,
                        levelNumber: i,
                        priority
                    });
                }
                await tx.shelf.createMany({ data: shelvesData });

                return tx.rack.findUnique({
                    where: { id: newRack.id },
                    include: {
                        shelves: {
                            orderBy: { priority: 'desc' },
                            include: { _count: { select: { locations: true } } }
                        }
                    }
                });
            });
            console.log(`  Created rack: ${rack.name} with ${rack.shelves.length} shelves`);
        } else {
            console.log(`  Using existing rack: ${rack.name}`);
        }

        // Assign each product to the least-occupied shelf
        for (const product of unassigned) {
            // Re-fetch shelf counts for accuracy
            const freshShelves = await prisma.shelf.findMany({
                where: { rackId: rack.id },
                orderBy: { priority: 'desc' },
                include: { _count: { select: { locations: true } } }
            });

            const bestShelf = freshShelves.reduce((best, shelf) => {
                if (shelf._count.locations < best._count.locations) return shelf;
                if (shelf._count.locations === best._count.locations && shelf.priority > best.priority) return shelf;
                return best;
            }, freshShelves[0]);

            const existingInShelf = bestShelf._count.locations;
            const binLabel = `${String.fromCharCode(65 + (existingInShelf % 26))}${Math.floor(existingInShelf / 26) + 1}`;

            await prisma.productLocation.create({
                data: {
                    productId: product.id,
                    branchId: branch.id,
                    rackId: rack.id,
                    shelfId: bestShelf.id,
                    binLabel,
                    quantity: parseFloat(product.quantity) || 0
                }
            });

            console.log(`  ✓ ${product.name} → ${rack.name} > ${bestShelf.name} [${binLabel}]`);
        }

        console.log(`  Done! Assigned ${unassigned.length} product(s)\n`);
    }

    console.log('Backfill complete!');
    await prisma.$disconnect();
    process.exit(0);
}

backfill().catch(err => {
    console.error('Backfill failed:', err);
    process.exit(1);
});
