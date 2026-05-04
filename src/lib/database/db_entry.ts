import { prisma } from '$lib/database/create_prisma_client';

// ---------------------------------------------------------------------------
// Entry queries — read-only functions for fetching entries (records) and
// related registration data. Split from the former db_inscription_utils.ts
// to separate query concerns from mutation/orchestration concerns.
// ---------------------------------------------------------------------------

export async function getCategoryEntriesFromCompetition(competitionId: number, userId: string) {
    try {
        const records = await prisma.record.findMany({
            where: {
                category: {
                    competitionId
                },
                OR: [
                    { creatorId: userId },
                    { users: { some: { id: userId } } }
                ]
            },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                },
                userIntents: {
                    select: {
                        id: true,
                        name: true,
                        claimedById: true
                    }
                },
                category: {
                    include: {
                        competition: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });

        return records;
    } catch (error) {
        console.error('Error getting parties from competition:', error);
        throw error;
    }
}

export async function getInscriptionsForCompetition(competitionId: number) {
    try {
        const categories = await prisma.category.findMany({
            where: { competitionId },
            orderBy: { startTime: 'asc' },
            include: {
                records: {
                    orderBy: [
                        { status: 'asc' },
                        { createdAt: 'asc' }
                    ],
                    select: {
                        id: true,
                        createdAt: true,
                        status: true,
                        confirmedAt: true,
                        lastRemindedAt: true,
                        tableNumber: true,
                        creatorId: true,
                        users: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true
                            }
                        },
                        userIntents: {
                            select: {
                                id: true,
                                name: true,
                                claimedById: true
                            }
                        },
                        creator: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });

        return categories;
    } catch (error) {
        console.error('Error getting inscriptions for competition:', error);
        throw error;
    }
}

export async function getInscribedUserIdsByCategory(competitionId: number): Promise<Record<number, string[]>> {
    const records = await prisma.record.findMany({
        where: {
            category: { competitionId },
        },
        select: {
            categoryId: true,
            users: { select: { id: true } }
        }
    });

    const result: Record<number, string[]> = {};
    for (const record of records) {
        if (!result[record.categoryId]) {
            result[record.categoryId] = [];
        }
        for (const user of record.users) {
            if (!result[record.categoryId].includes(user.id)) {
                result[record.categoryId].push(user.id);
            }
        }
    }
    return result;
}
