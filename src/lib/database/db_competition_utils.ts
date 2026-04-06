import type { Competition, Category } from '$lib/.prisma/generated/prisma/client';
import { CompetitionStatus, InscriptionStatus, Role } from '$lib/.prisma/generated/prisma/enums';
import { prisma } from '$lib/database/database';

/**
 * Returns whether a user can access the During Competition page for a given competition.
 * Allowed: the competition's creator, admins, and judges assigned to a category in this competition.
 */
export async function getDuringCompetitionAccess(
    competitionId: number,
    userId: string
): Promise<{ isOrganizer: boolean; isJudge: boolean; judgedCategoryIds: number[] }> {
    const [isCreator, isAdmin, judgedCategories] = await Promise.all([
        prisma.competition.findFirst({
            where: { id: competitionId, creatorId: userId },
            select: { id: true }
        }),
        prisma.roleAssignment.findFirst({
            where: { userId, role: Role.ADMIN }
        }),
        prisma.category.findMany({
            where: {
                competitionId,
                judges: { some: { id: userId } }
            },
            select: { id: true }
        })
    ]);

    return {
        isOrganizer: !!(isCreator || isAdmin),
        isJudge: judgedCategories.length > 0,
        judgedCategoryIds: judgedCategories.map((c) => c.id)
    };
}

export async function getUpcomingCompetitions(n_objects: number, offset: number) {
    return prisma.competition.findMany({
        take: n_objects,
        skip: offset,
        where: {
            status: {
                in: [CompetitionStatus.NOT_STARTED, CompetitionStatus.STARTED]
            },
            startDate: {
                gte: new Date()
            }
        },
        include: {
            categories: true
        },
        orderBy: {
            startDate: 'asc'
        },
    });
}

export async function getNearCompetitions(n_objects: number, country?: string, postalCode?: string, includeInscribed?: boolean, userId?: string) {

    if (country == undefined || postalCode == undefined) {
        // If no location info, return empty list
        console.warn('No country or postal code provided for getNearCompetitions, returning empty list');
        return [];
    }

    const whereClause: any = {
        status: {
            in: [CompetitionStatus.NOT_STARTED, CompetitionStatus.STARTED]
        },
        startDate: {
            gte: new Date()
        }
    };

    if (country) {
        whereClause.country = country;
    }

    if (postalCode) {
        whereClause.postalCode = {
            startsWith: postalCode.slice(0, 2)
        };
    }

    if (!includeInscribed && userId) {
        whereClause.NOT = {
            categories: {
                some: {
                    records: {
                        some: {
                            OR: [
                                { users: { some: { id: userId } } },
                                { creatorId: userId }
                            ]
                        }
                    }
                }
            }
        };
    }

    return prisma.competition.findMany({
        take: n_objects,
        where: whereClause,
        include: {
            categories: true
        },
        orderBy: {
            startDate: 'asc'
        },
    });
}

export async function getPastCompetitions(n_objects: number, offset: number) {
    return prisma.competition.findMany({
        take: n_objects,
        skip: offset,
        where: {
            status: {
                in: [CompetitionStatus.FINISHED, CompetitionStatus.CANCELLED]
            },
        },
        orderBy: {
            startDate: 'desc'
        },
    });
}

/**
 * Returns the user's latest finished records across completed categories,
 * including all sibling records in each category (for position computation),
 * teammates, user intents, puzzle info, and competition details.
 */
export async function getLastUserResults(userId: string, limit: number = 5) {
    // First, find the user's records in completed categories
    const userRecords = await prisma.record.findMany({
        where: {
            users: { some: { id: userId } },
            status: InscriptionStatus.CONFIRMED,
            category: {
                status: 'completed',
                competition: {
                    status: CompetitionStatus.FINISHED
                }
            }
        },
        take: limit,
        orderBy: {
            category: {
                competition: {
                    startDate: 'desc'
                }
            }
        },
        select: {
            id: true,
            finishTime: true,
            nPiecesCompleted: true,
            categoryId: true,
            users: {
                select: { id: true, name: true, image: true }
            },
            userIntents: {
                select: { id: true, name: true }
            },
            category: {
                select: {
                    id: true,
                    description: true,
                    type: true,
                    realStartTime: true,
                    realEndTime: true,
                    competitionId: true,
                    puzzles: {
                        select: { pieces: true, brand: true, name: true }
                    },
                    competition: {
                        select: {
                            id: true,
                            name: true,
                            startDate: true,
                            image_cld_id: true
                        }
                    },
                    // Include all confirmed records for position computation
                    records: {
                        where: { status: InscriptionStatus.CONFIRMED },
                        orderBy: [
                            { finishTime: 'asc' },
                            { tableNumber: 'asc' }
                        ],
                        select: {
                            id: true,
                            finishTime: true
                        }
                    }
                }
            }
        }
    });

    // Compute position for each of the user's records
    return userRecords.map((record) => {
        const allRecords = record.category.records;
        const finishedRecords = allRecords.filter((r) => r.finishTime != null);
        const position = record.finishTime
            ? finishedRecords.findIndex((r) => r.id === record.id) + 1
            : null; // DNF

        return {
            id: record.id,
            finishTime: record.finishTime,
            nPiecesCompleted: record.nPiecesCompleted,
            position,
            totalFinished: finishedRecords.length,
            totalRecords: allRecords.length,
            users: record.users,
            userIntents: record.userIntents,
            category: {
                id: record.category.id,
                description: record.category.description,
                type: record.category.type,
                realStartTime: record.category.realStartTime,
                puzzles: record.category.puzzles
            },
            competition: record.category.competition
        };
    });
}

export async function getUserInscriptionStatuses(userId: string) {
    const competitions = await prisma.competition.findMany({
        where: {
            status: { in: [CompetitionStatus.NOT_STARTED, CompetitionStatus.STARTED] },
            startDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
            categories: {
                some: {
                    records: { some: { users: { some: { id: userId } } } }
                }
            }
        },
        select: {
            id: true,
            name: true,
            startDate: true,
            registrationOpen: true,
            status: true,
            categories: {
                orderBy: { startTime: 'asc' },
                select: {
                    type: true,
                    records: {
                        where: { users: { some: { id: userId } } },
                        select: { status: true }
                    }
                }
            }
        },
        orderBy: { startDate: 'asc' }
    });

    return competitions.map((competition) => ({
        id: competition.id,
        name: competition.name,
        startDate: competition.startDate,
        registrationOpen: competition.registrationOpen,
        status: competition.status,
        categories: competition.categories.map((category) => ({
            type: category.type,
            recordStatus: category.records[0]?.status ?? null
        }))
    }));
}
