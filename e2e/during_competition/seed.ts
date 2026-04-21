import "dotenv/config";
import { prisma } from '../../scripts/db_migration/create_prisma_client';
import { InscriptionStatus, CategoryType } from '../../src/lib/.prisma/generated/prisma/client';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, 'test-data.json');

const DUMMY_USERS = Array.from({ length: 5 }, (_, i) => ({
    id: randomUUID(),
    name: `DC User ${i + 1}`,
    email: `dc-user-${i + 1}@test.local`,
}));

async function main() {
    const organizerEmail = process.env.TEST_ORGANIZER_USER_EMAIL;
    if (!organizerEmail) {
        throw new Error('TEST_ORGANIZER_USER_EMAIL is not set');
    }

    const organizer = await prisma.user.findUnique({ where: { email: organizerEmail } });
    if (!organizer) {
        throw new Error(`Organizer user not found: ${organizerEmail}`);
    }

    console.log(`👤 Organizer: ${organizer.name} (${organizer.email})`);

    // Create competition
    const now = new Date();
    const startTime = new Date(now);
    startTime.setHours(10, 0, 0, 0);
    const endTime = new Date(now);
    endTime.setHours(18, 0, 0, 0);

    const competition = await prisma.competition.create({
        data: {
            name: 'E2E During Competition',
            description: 'Competition for during_competition e2e tests',
            location: 'Test Arena',
            country: 'ES',
            postalCode: '08001',
            startDate: now,
            endDate: now,
            status: 'NOT_STARTED',
            registrationOpen: false,
            creatorId: organizer.id,
            categories: {
                create: {
                    description: '500 pcs Individual',
                    type: CategoryType.INDIVIDUAL,
                    maxPartySize: 1,
                    maxParties: 50,
                    startTime,
                    endTime,
                    status: 'NOT_STARTED',
                },
            },
        },
        include: { categories: true },
    });

    const category = competition.categories[0];
    console.log(`🏆 Competition: ${competition.name} (ID: ${competition.id})`);
    console.log(`📋 Category: ${category.description} (ID: ${category.id})`);

    // Create dummy users
    console.log(`👥 Creating ${DUMMY_USERS.length} dummy users...`);
    for (const u of DUMMY_USERS) {
        await prisma.user.upsert({
            where: { email: u.email },
            update: { name: u.name },
            create: {
                id: u.id,
                name: u.name,
                email: u.email,
                emailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
    }

    // Re-fetch users to get their actual IDs (in case they existed already)
    const dbUsers = await Promise.all(
        DUMMY_USERS.map(u => prisma.user.findUniqueOrThrow({ where: { email: u.email } }))
    );

    // Create 5 confirmed records
    console.log(`📝 Creating 5 confirmed records...`);
    const recordIds: string[] = [];
    for (const user of dbUsers) {
        const record = await prisma.record.create({
            data: {
                categoryId: category.id,
                creatorId: user.id,
                status: InscriptionStatus.CONFIRMED,
                users: { connect: { id: user.id } },
            },
        });
        recordIds.push(record.id);
    }

    // Write test data JSON
    const testData = {
        competitionId: competition.id,
        categoryId: category.id,
        recordIds,
        userNames: dbUsers.map(u => u.name),
    };

    writeFileSync(OUTPUT_PATH, JSON.stringify(testData, null, 2), 'utf-8');
    console.log(`✅ Test data written to ${OUTPUT_PATH}`);
    console.log(`   📝 ${recordIds.length} records: ${recordIds.join(', ')}`);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
