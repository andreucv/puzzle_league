import { prisma } from './create_prisma_client';
import { Role } from '../../prisma/generated/prisma/client';

async function main() {
    const email = process.argv[2];
    if (!email) {
        console.error('❌ Usage: npx tsx action_admin.ts <user_email>');
        process.exit(1);
    }

    console.log(`👑 Granting ADMIN privileges to ${email}...`);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.error(`❌ User not found: ${email}`);
        process.exit(1);
    }

    await prisma.roleAssignment.upsert({
        where: { userId_role: { userId: user.id, role: 'ADMIN' as Role } },
        update: {},
        create: {
            userId: user.id,
            role: 'ADMIN' as Role,
        },
    });

    console.log(`✅ ${user.name} (${email}) is now ADMIN`);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
