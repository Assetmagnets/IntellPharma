
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyUsers() {
    try {
        // Find the first active branch to test with
        const branch = await prisma.branch.findFirst({
            where: { isActive: true }
        });

        if (!branch) {
            console.log('No active branch found.');
            return;
        }

        console.log(`Checking users for Branch ID: ${branch.id}`);

        const users = await prisma.branchUser.findMany({
            where: { branchId: branch.id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        isActive: true,
                        createdAt: true
                    }
                }
            }
        });

        console.log('Raw Database Result (First item):');
        if (users.length > 0) {
            console.log(JSON.stringify(users[0], null, 2));
        } else {
            console.log('No users found in this branch.');
        }

        const mapped = users.map(bu => ({
            id: bu.id,
            role: bu.role,
            joinedAt: bu.createdAt,
            user: bu.user
        }));

        console.log('\nMapped Response (First item):');
        if (mapped.length > 0) {
            console.log(JSON.stringify(mapped[0], null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyUsers();
