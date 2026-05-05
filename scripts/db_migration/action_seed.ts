import { prisma } from './create_prisma_client';
import { RegistrationStatus, CategoryType } from '../../src/lib/.prisma/generated/prisma/client';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

interface SeedUser {
    id: string;
    name: string;
    email: string;
    country: string;
    postalCode: string;
}

interface SeedCompetition {
    name: string;
    description: string;
    location: string;
    country: string;
    postalCode: string;
    startDate: string;
    endDate: string;
    creatorIndex: number;
}

interface SeedCategory {
    competitionIndex: number;
    description: string;
    type: string;
    maxPartySize: number;
    maxParties: number;
    startTime: string;
    endTime: string;
}

interface SeedEntry {
    competitionIndex: number;
    categoryIndex: number;
    creatorIndex: number;
    userIndices: number[];
    status: string;
}

interface SeedExternalParticipant {
    name: string;
    creatorIndex: number;
    entryCompetitionIndex: number;
    entryCategoryIndex: number;
}

interface SeedData {
    users: SeedUser[];
    competitions: SeedCompetition[];
    categories: SeedCategory[];
    records: SeedEntry[];
    userIntents?: SeedExternalParticipant[];
}

async function main() {
    const scriptDir = dirname(fileURLToPath(import.meta.url));
    const seedPath = join(scriptDir, 'seed_data.json');

    console.log(`📂 Reading seed data from ${seedPath}...`);
    const seedData: SeedData = JSON.parse(readFileSync(seedPath, 'utf-8'));

    // 1. Upsert users
    console.log(`👥 Upserting ${seedData.users.length} users...`);
    const dbUsers: { id: string; email: string }[] = [];
    for (const u of seedData.users) {
        const user = await prisma.user.upsert({
            where: { email: u.email },
            update: { name: u.name, country: u.country, postalCode: u.postalCode },
            create: {
                id: u.id,
                name: u.name,
                email: u.email,
                emailVerified: true,
                country: u.country,
                postalCode: u.postalCode,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
        dbUsers.push({ id: user.id, email: user.email });
    }
    console.log(`   ✅ ${dbUsers.length} users ready`);

    // 2. Create competitions with nested categories
    console.log(`🏆 Creating ${seedData.competitions.length} competitions...`);

    // Group categories by competition index
    const categoriesByComp = new Map<number, SeedCategory[]>();
    for (const cat of seedData.categories) {
        const list = categoriesByComp.get(cat.competitionIndex) ?? [];
        list.push(cat);
        categoriesByComp.set(cat.competitionIndex, list);
    }

    // Track created competition IDs and category IDs (in insertion order)
    const competitionIds: number[] = [];
    // Map: competitionIndex → array of category DB IDs (in order)
    const categoryIdMap = new Map<number, number[]>();

    for (let ci = 0; ci < seedData.competitions.length; ci++) {
        const comp = seedData.competitions[ci];
        const cats = categoriesByComp.get(ci) ?? [];

        const created = await prisma.competition.create({
            data: {
                name: comp.name,
                description: comp.description,
                location: comp.location,
                country: comp.country,
                postalCode: comp.postalCode,
                startDate: new Date(comp.startDate),
                endDate: new Date(comp.endDate),
                status: 'NOT_STARTED',
                registrationOpen: true,
                creatorId: dbUsers[comp.creatorIndex].id,
                categories: {
                    create: cats.map(cat => ({
                        description: cat.description,
                        type: cat.type as CategoryType,
                        maxPartySize: cat.maxPartySize,
                        maxParties: cat.maxParties,
                        startTime: new Date(cat.startTime),
                        endTime: new Date(cat.endTime),
                    })),
                },
            },
            include: { categories: { orderBy: { id: 'asc' } } },
        });

        competitionIds.push(created.id);
        categoryIdMap.set(ci, created.categories.map(c => c.id));
        console.log(`   ✅ ${created.name} (ID: ${created.id}) — ${created.categories.length} categories`);
    }

    // 3. Create entries (registrations)
    console.log(`📝 Creating ${seedData.records.length} entries...`);
    let entryCount = 0;
    for (const rec of seedData.records) {
        const catIds = categoryIdMap.get(rec.competitionIndex);
        if (!catIds) continue;
        const categoryId = catIds[rec.categoryIndex];
        if (categoryId === undefined) continue;

        const creatorDbId = dbUsers[rec.creatorIndex].id;
        const userConnections = rec.userIndices.map(i => ({ id: dbUsers[i].id }));

        await prisma.entry.create({
            data: {
                categoryId,
                creatorId: creatorDbId,
                status: rec.status as RegistrationStatus,
                users: { connect: userConnections },
            },
        });
        entryCount++;
    }
    console.log(`   ✅ ${entryCount} entries created`);

    // 4. Create external participants (non-registered participants)
    if (seedData.userIntents && seedData.userIntents.length > 0) {
        console.log(`🔗 Creating ${seedData.userIntents.length} external participants...`);
        let epCount = 0;
        for (const intent of seedData.userIntents) {
            const catIds = categoryIdMap.get(intent.entryCompetitionIndex);
            if (!catIds) continue;
            const categoryId = catIds[intent.entryCategoryIndex];
            if (categoryId === undefined) continue;

            const creatorDbId = dbUsers[intent.creatorIndex].id;

            // Find the entry for this category created by this user (or create a new one)
            let entry = await prisma.entry.findFirst({
                where: {
                    categoryId,
                    creatorId: creatorDbId
                }
            });

            if (!entry) {
                // Create an entry for this external participant
                entry = await prisma.entry.create({
                    data: {
                        categoryId,
                        creatorId: creatorDbId,
                        status: 'PENDING_CONFIRMATION' as RegistrationStatus,
                        users: { connect: { id: creatorDbId } }
                    }
                });
            }

            await prisma.externalParticipant.create({
                data: {
                    name: intent.name,
                    createdById: creatorDbId,
                    entries: { connect: { id: entry.id } }
                }
            });
            epCount++;
        }
        console.log(`   ✅ ${epCount} external participants created`);
    }

    console.log('✅ Seed data inserted successfully!');
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
