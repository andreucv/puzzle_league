import "dotenv/config";
import { prisma } from './create_prisma_client';
import { Role } from '../../prisma/generated/prisma/client';
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

// Only allow this script to run against a local database
const databaseUrl = process.env.DATABASE_URL ?? '';
if (databaseUrl.startsWith('prisma+postgres://')) {
    console.error('❌ This script is intended for LOCAL databases only.');
    console.error('   DATABASE_URL points to a remote Prisma Accelerate instance.');
    process.exit(1);
}
if (!databaseUrl.includes('localhost') && !databaseUrl.includes('127.0.0.1')) {
    console.error('❌ This script is intended for LOCAL databases only.');
    console.error(`   DATABASE_URL does not point to localhost: ${databaseUrl}`);
    process.exit(1);
}

const auth = betterAuth({
    baseURL: 'http://localhost',
    secret: process.env.BETTER_AUTH_SECRET!,
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    emailAndPassword: { enabled: true },
});

interface TestUser {
    email: string;
    password: string;
    name: string;
    role: Role;
}

const testUsers: TestUser[] = [
    {
        email: process.env.TEST_PARTICIPANT_USER_EMAIL!,
        password: process.env.TEST_PARTICIPANT_USER_PASSWORD!,
        name: 'Participant',
        role: 'PARTICIPANT' as Role
    },
    {
        email: process.env.TEST_ORGANIZER_USER_EMAIL!,
        password: process.env.TEST_ORGANIZER_USER_PASSWORD!,
        name: 'Organizer',
        role: 'ORGANIZER' as Role,
    },
    {
        email: process.env.TEST_ADMIN_USER_EMAIL!,
        password: process.env.TEST_ADMIN_USER_PASSWORD!,
        name: 'Admin',
        role: 'ADMIN' as Role
    },
];

async function main() {
    console.log('🏠 Seeding local test users from .env...\n');

    for (const tu of testUsers) {
        if (!tu.email || !tu.password) {
            console.error(`❌ Missing env var for ${tu.name}. Skipping.`);
            continue;
        }

        // Check if user already exists
        const existing = await prisma.user.findUnique({ where: { email: tu.email } });
        if (existing) {
            console.log(`   ⏭️  ${tu.name} (${tu.email}) already exists — skipping creation.`);
        } else {
            // Create user via Better-Auth (handles password hashing + account creation)
            const res = await auth.api.signUpEmail({
                body: { email: tu.email, password: tu.password, name: tu.name },
            });
            if (!res?.user) {
                console.error(`❌ Failed to create ${tu.name} (${tu.email})`);
                continue;
            }
            console.log(`   ✅ Created ${tu.name} (${tu.email})`);
        }

        // Ensure the user has the correct role
        const user = await prisma.user.findUnique({ where: { email: tu.email } });
        if (!user) continue;

        await prisma.roleAssignment.upsert({
            where: { userId_role: { userId: user.id, role: tu.role } },
            update: {},
            create: { userId: user.id, role: tu.role },
        });
        console.log(`   👤 Role ${tu.role} assigned to ${tu.email}`);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                phonePrefix: '+99',
                phoneNumber: '99999',
                phonePromptLastChecked: new Date(),
                locale: 'en',
                localePromptLastChecked: new Date(),
                externalParticipantsLastChecked: new Date(),
                emailVerified: true,
                emailVerificationPromptLastChecked: new Date(),
                country: 'ES',
                postalCode: '99999',
                locationPromptLastChecked: new Date(),
            },
        });
        console.log(`   📱 Phone set for ${tu.email}`);
    }

    console.log('\n✅ Local test users seeded successfully!');
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
