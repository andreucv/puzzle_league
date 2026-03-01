import { prisma } from './create_prisma_client';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

/**
 * Captures specific users (by email) from the database and saves them to
 * real_seed_data.json, including their role assignments.
 *
 * Usage:
 *   npx tsx scripts/db_migration/capture_real_users.ts email1@example.com email2@example.com
 */
async function main() {
    const emails = process.argv.slice(2);
    if (emails.length === 0) {
        console.error('❌ Usage: npx tsx capture_real_users.ts <email1> [email2] ...');
        process.exit(1);
    }

    console.log(`🔍 Capturing ${emails.length} user(s) from database...`);

    const captured = [];
    for (const email of emails) {
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                roleAssignments: {
                    select: { role: true },
                },
            },
        });

        if (!user) {
            console.warn(`⚠️  User not found: ${email}`);
            continue;
        }

        captured.push({
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            image: user.image ?? null,
            country: user.country ?? null,
            postalCode: user.postalCode ?? null,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
            roleAssignments: user.roleAssignments.map((r) => ({ role: r.role })),
        });

        const roles = user.roleAssignments.map((r) => r.role).join(', ') || 'none';
        console.log(`   ✅ ${user.name} (${email}) — roles: ${roles}`);
    }

    if (captured.length === 0) {
        console.error('❌ No users captured. Aborting.');
        process.exit(1);
    }

    const scriptDir = dirname(fileURLToPath(import.meta.url));
    const outPath = join(scriptDir, 'real_seed_data.json');

    writeFileSync(
        outPath,
        JSON.stringify({ capturedAt: new Date().toISOString(), users: captured }, null, 2),
        'utf-8',
    );

    console.log(`\n✅ Captured ${captured.length} user(s) → ${outPath}`);
    console.log('   ⚠️  This file is gitignored — it stays local only.');
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
