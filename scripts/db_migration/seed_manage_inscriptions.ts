import { InscriptionStatus, CategoryType } from '../../src/lib/.prisma/generated/prisma/client';
import { prisma } from './create_prisma_client';

const FAKE_USERS = [
    { name: 'Alice Johnson', email: 'alice@test.local' },
    { name: 'Bob Smith', email: 'bob@test.local' },
    { name: 'Carol Davis', email: 'carol@test.local' },
    { name: 'Dave Wilson', email: 'dave@test.local' },
    { name: 'Eve Martinez', email: 'eve@test.local' },
    { name: 'Frank Brown', email: 'frank@test.local' },
    { name: 'Grace Lee', email: 'grace@test.local' },
    { name: 'Hank Taylor', email: 'hank@test.local' },
    { name: 'Ivy Anderson', email: 'ivy@test.local' },
    { name: 'Jack Thomas', email: 'jack@test.local' },
    { name: 'Karen White', email: 'karen@test.local' },
    { name: 'Leo Harris', email: 'leo@test.local' },
];

async function ensureFakeUsers() {
    const users = [];
    for (const fakeUser of FAKE_USERS) {
        const user = await prisma.user.upsert({
            where: { email: fakeUser.email },
            update: {},
            create: {
                id: crypto.randomUUID(),
                name: fakeUser.name,
                email: fakeUser.email,
                emailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
        users.push(user);
    }
    console.log(`✅ Ensured ${users.length} fake users exist`);
    return users;
}

async function main() {
    // 1. Get the organizer user (competition creator)
    const organizer = await prisma.user.findFirst({
        where: { email: process.env.TEST_ORGANIZER_USER_EMAIL! },
    });
    if (!organizer) {
        console.error('❌ Organizer user not found. Run insert_users_to_db.ts first.');
        return;
    }
    console.log(`Organizer: ${organizer.name} (${organizer.email})`);

    // 2. Ensure fake participant users
    const fakeUsers = await ensureFakeUsers();

    // 3. Create a competition with multiple categories
    const competitionDate = new Date();
    competitionDate.setDate(competitionDate.getDate() + 14); // 2 weeks from now

    const startMorning = new Date(competitionDate);
    startMorning.setHours(10, 0, 0, 0);
    const endMorning = new Date(competitionDate);
    endMorning.setHours(12, 0, 0, 0);
    const startAfternoon = new Date(competitionDate);
    startAfternoon.setHours(13, 0, 0, 0);
    const endAfternoon = new Date(competitionDate);
    endAfternoon.setHours(16, 0, 0, 0);

    const competition = await prisma.competition.create({
        data: {
            name: 'Seeded Inscription Test',
            description: 'Competition with seeded inscriptions for testing manage_inscriptions page',
            location: 'Test Venue',
            country: 'ES',
            postalCode: '08001',
            startDate: competitionDate,
            endDate: competitionDate,
            status: 'NOT_STARTED',
            registrationOpen: true,
            creatorId: organizer.id,
            categories: {
                create: [
                    {
                        description: '500 pcs Ravensburger',
                        type: CategoryType.INDIVIDUAL,
                        maxPartySize: 1,
                        maxParties: 20,
                        startTime: startMorning,
                        endTime: endMorning,
                    },
                    {
                        description: '1000 pcs Educa',
                        type: CategoryType.PAIRS,
                        maxPartySize: 2,
                        maxParties: 10,
                        startTime: startAfternoon,
                        endTime: endAfternoon,
                    },
                    {
                        description: '2000 pcs Clementoni',
                        type: CategoryType.TEAM,
                        maxPartySize: 4,
                        maxParties: 5,
                        startTime: startMorning,
                        endTime: endAfternoon,
                    },
                ],
            },
        },
        include: { categories: true },
    });

    console.log(`✅ Created competition "${competition.name}" (ID: ${competition.id})`);
    console.log(`   Categories: ${competition.categories.map(c => `${c.description} (${c.type})`).join(', ')}`);

    // 4. Create records with varied statuses
    const [individual, pairs, team] = competition.categories;

    // Individual category: 8 inscriptions with mixed statuses
    const individualSignups: { userIndex: number; status: InscriptionStatus }[] = [
        { userIndex: 0, status: InscriptionStatus.ACCEPTED },
        { userIndex: 1, status: InscriptionStatus.ACCEPTED },
        { userIndex: 2, status: InscriptionStatus.ACCEPTED },
        { userIndex: 3, status: InscriptionStatus.PENDING },
        { userIndex: 4, status: InscriptionStatus.PENDING },
        { userIndex: 5, status: InscriptionStatus.PENDING },
        { userIndex: 6, status: InscriptionStatus.WAITLISTED },
        { userIndex: 7, status: InscriptionStatus.WAITLISTED },
    ];

    for (const signup of individualSignups) {
        const user = fakeUsers[signup.userIndex];
        await prisma.record.create({
            data: {
                categoryId: individual.id,
                creatorId: user.id,
                status: signup.status,
                users: { connect: [{ id: user.id }] },
            },
        });
    }
    console.log(`   ✅ Individual: ${individualSignups.length} inscriptions`);

    // Pairs category: 4 pair inscriptions with mixed statuses
    const pairsSignups: { userIndices: number[]; status: InscriptionStatus }[] = [
        { userIndices: [0, 1], status: InscriptionStatus.ACCEPTED },
        { userIndices: [2, 3], status: InscriptionStatus.ACCEPTED },
        { userIndices: [4, 5], status: InscriptionStatus.PENDING },
        { userIndices: [6, 7], status: InscriptionStatus.WAITLISTED },
    ];

    for (const signup of pairsSignups) {
        const users = signup.userIndices.map(i => fakeUsers[i]);
        await prisma.record.create({
            data: {
                categoryId: pairs.id,
                creatorId: users[0].id,
                status: signup.status,
                users: { connect: users.map(u => ({ id: u.id })) },
            },
        });
    }
    console.log(`   ✅ Pairs: ${pairsSignups.length} inscriptions`);

    // Team category: 3 team inscriptions with mixed statuses
    const teamSignups: { userIndices: number[]; status: InscriptionStatus }[] = [
        { userIndices: [0, 1, 2, 3], status: InscriptionStatus.ACCEPTED },
        { userIndices: [4, 5, 6, 7], status: InscriptionStatus.PENDING },
        { userIndices: [8, 9, 10, 11], status: InscriptionStatus.WAITLISTED },
    ];

    for (const signup of teamSignups) {
        const users = signup.userIndices.map(i => fakeUsers[i]);
        await prisma.record.create({
            data: {
                categoryId: team.id,
                creatorId: users[0].id,
                status: signup.status,
                users: { connect: users.map(u => ({ id: u.id })) },
            },
        });
    }
    console.log(`   ✅ Team: ${teamSignups.length} inscriptions`);

    console.log(`\n🎉 Done! Visit /competition/${competition.id}/manage_inscriptions to test.`);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
