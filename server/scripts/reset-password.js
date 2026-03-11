const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const email = 'mohantydebasis976@gmail.com';
    const newPassword = 'password123';

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });

        console.log(`Password for ${email} has been reset to: ${newPassword}`);
    } catch (e) {
        console.error('Error resetting password:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
