import { prisma } from './create_prisma_client';
import { Role } from '../../prisma/generated/prisma/client';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

interface RealSeedUser {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    country: string | null;
    postalCode: string | null;
    createdAt: string;
    updatedAt: string;
    roleAssignments: { role: string }[];
}

interface RealSeedData {
    capturedAt: string;
    users: RealSeedUser[];
}

async function main() {
    const scriptDir = dirname(fileURLToPath(import.meta.url));
    const dataPath = join(scriptDir, 'real_seed_data.json');

    if (!existsSync(dataPath)) {
        console.error(`❌ real_seed_data.json not found at ${dataPath}`);
        console.error('   Run capture_real_users.ts first to create it:');
        console.error('   npx tsx scripts/db_migration/capture_real_users.ts email@example.com');
        process.exit(1);
    }

    const data: RealSeedData = JSON.parse(readFileSync(dataPath, 'utf-8'));
    console.log(`📂 Reading real_seed_data.json (captured at ${data.capturedAt})`);
    console.log(`👥 Restoring ${data.users.length} user(s)...`);

    for (const u of data.users) {
        const user = await prisma.user.upsert({
            where: { email: u.email },
            update: {
                name: u.name,
                image: u.image,
                country: u.country,
                postalCode: u.postalCode,
                updatedAt: new Date(),
            },
            create: {
                id: u.id,
                name: u.name,
                email: u.email,
                emailVerified: u.emailVerified,
                image: u.image,
                country: u.country,
                postalCode: u.postalCode,
                createdAt: new Date(u.createdAt),
                updatedAt: new Date(u.updatedAt),
            },
        });

        for (const ra of u.roleAssignments) {
            await prisma.roleAssignment.upsert({
                where: { userId_role: { userId: user.id, role: ra.role as Role } },
                update: {},
                create: { userId: user.id, role: ra.role as Role },
            });
        }

        const roles = u.roleAssignments.map((r) => r.role).join(', ') || 'none';
        console.log(`   ✅ ${u.name} (${u.email}) — roles: ${roles}`);
    }

    console.log('✅ Custom users restored successfully!');
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
