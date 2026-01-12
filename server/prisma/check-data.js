const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    const branches = await prisma.branch.findMany({
        select: { id: true, name: true }
    });
    console.log('All branches:');
    branches.forEach(b => console.log(`  ${b.id} - ${b.name}`));

    console.log('\nProducts per branch:');
    for (const branch of branches) {
        const count = await prisma.product.count({ where: { branchId: branch.id } });
        console.log(`  ${branch.name}: ${count} products`);
    }

    await prisma.$disconnect();
}

checkData();
