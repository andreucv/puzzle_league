import { CategoryStatus, CompetitionStatus, EntryTagStatus, RegistrationStatus } from '$lib/.prisma/generated/prisma/enums';
import type { Prisma } from '$lib/.prisma/generated/prisma/client';
import type { Competition, Category } from '$lib/.prisma/generated/prisma/browser';
import { prisma } from '$lib/database/create_prisma_client';

// ---------------------------------------------------------------------------
// Single competition queries
// ---------------------------------------------------------------------------

export async function getCompetition(competitionId: number) {
    try {
        const competition = await prisma.competition.findUnique({
            where: { id: competitionId },
            include: {
                creator: true
            }
        });
        return competition;
    } catch (error) {
        console.error('Error getting competition:', error);
        throw error;
    }
}

export async function getCompetitionWithCategories(competitionId: number) {
    try {
        const competition = await prisma.competition.findUnique({
            where: { id: competitionId },
            include: {
                categories: {
                    orderBy: { startTime: 'asc' },
                    include: {
                        puzzles: true,
                        tagCategories: {
                            select: { tag: true, priceOverride: true }
                        }
                    }
                },
                creator: true
            }
        });

        return competition;
    } catch (error) {
        console.error('Error getting competition with categories:', error);
        throw error;
    }
}

export async function getCompetitionWithCategoriesAndEntries(competitionId: number) {
    try {
        const competition = await prisma.competition.findUnique({
            where: { id: competitionId },
            include: {
                categories: {
                    orderBy: { startTime: 'asc' },
                    include: {
                        puzzles: true,
                        entries: {
                            include: {
                                users: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        image: true
                                    }
                                }
                            }
                        },
                    }
                },
                league: true,
                creator: true
            }
        });

        return competition;
    } catch (error) {
        console.error('Error getting competition with categories:', error);
        throw error;
    }
}

export async function getCompetitionResults(competitionId: number) {
    try {
        const competition = await prisma.competition.findUnique({
            where: { id: competitionId },
            select: {
                id: true,
                name: true,
                status: true,
                image_cld_id: true,
                startDate: true,
                categories: {
                    where: { status: { not: CategoryStatus.CANCELED } },
                    orderBy: { startTime: 'asc' },
                    select: {
                        id: true,
                        description: true,
                        subname: true,
                        type: true,
                        status: true,
                        startTime: true,
                        realStartTime: true,
                        realEndTime: true,
                        puzzles: {
                            select: {
                                id: true,
                                name: true,
                                pieces: true,
                                brand: true,
                                image_cld_id: true
                            }
                        },
                        entries: {
                            where: { status: RegistrationStatus.CONFIRMED },
                            orderBy: [
                                { finishTime: 'asc' },
                                { nPiecesCompleted: 'desc' }
                            ],
                            include: {
                                users: {
                                    select: {
                                        id: true,
                                        name: true,
                                        image: true,
                                        publicResultsVisibility: true
                                    }
                                },
                                externalParticipants: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                },
                                entryTag: {
                                    select: {
                                        status: true,
                                        tag: true
                                    }
                                }
                            }
                        },
                        tagCategories: {
                            select: { tag: true }
                        },
                        _count: {
                            select: { entries: { where: { status: RegistrationStatus.CONFIRMED } } }
                        }
                    }
                }
            }
        });

        if (!competition) return competition;

        // Only CONFIRMED tags are surfaced publicly; PENDING/REJECTED are stripped.
        // `availableTags` per category drives the sub-prize filter toggle.
        return {
            ...competition,
            categories: competition.categories.map(({ tagCategories, ...category }) => ({
                ...category,
                availableTags: [...new Set(tagCategories.map((tc) => tc.tag))],
                entries: category.entries.map(({ entryTag, ...entry }) => ({
                    ...entry,
                    confirmedTag: entryTag?.status === EntryTagStatus.CONFIRMED ? entryTag.tag : null,
                })),
            })),
        };
    } catch (error) {
        console.error('Error getting competition results:', error);
        throw error;
    }
}

export async function getCompetitionCategories(
    competitionId: number
): Promise<Array<Category & { totalEntries: number; finishedEntries: number; pendingEntries: number; confirmedEntries: number; reservedSlots: number }>> {
    try {
        // Fetch categories and all record counts in parallel (2 queries instead of 4N+1)
        const [categories, statusCounts, finishedCounts] = await Promise.all([
            prisma.category.findMany({
                where: { competitionId },
                orderBy: { startTime: 'asc' },
                include: { puzzles: { select: { pieces: true } } }
            }),
            // Group record counts by categoryId and status in a single query
            prisma.entry.groupBy({
                by: ['categoryId', 'status'],
                _count: true,
                where: { category: { competitionId } }
            }),
            // Count finished (confirmed + has finishTime) per category
            prisma.entry.groupBy({
                by: ['categoryId'],
                _count: true,
                where: {
                    category: { competitionId },
                    status: RegistrationStatus.CONFIRMED,
                    finishTime: { not: null }
                }
            })
        ]);

        // Build lookup maps for O(1) access
        const finishedMap = new Map(finishedCounts.map(r => [r.categoryId, r._count]));

        const statusMap = new Map<number, { confirmed: number; pending: number }>();
        for (const row of statusCounts) {
            const entry = statusMap.get(row.categoryId) ?? { confirmed: 0, pending: 0 };
            if (row.status === RegistrationStatus.CONFIRMED) entry.confirmed = row._count;
            if (row.status === RegistrationStatus.PENDING_CONFIRMATION) entry.pending = row._count;
            statusMap.set(row.categoryId, entry);
        }

        return categories.map((category) => {
            const counts = statusMap.get(category.id) ?? { confirmed: 0, pending: 0 };
            return {
                ...(category as unknown as Category),
                totalEntries: counts.confirmed,
                finishedEntries: finishedMap.get(category.id) ?? 0,
                pendingEntries: counts.pending,
                confirmedEntries: counts.confirmed,
                reservedSlots: counts.confirmed + counts.pending,
            };
        });
    } catch (error) {
        console.error('Error getting competition categories:', error);
        throw error;
    }
}

// ---------------------------------------------------------------------------
// Competition list queries
// ---------------------------------------------------------------------------

export async function getAllCompetitions() {
    try {
        const competitions = await prisma.competition.findMany({
            include: {
                categories: {
                    orderBy: { startTime: 'asc' }
                },
                league: true,
                _count: {
                    select: {
                        categories: true
                    }
                }
            },
            orderBy: {
                startDate: 'desc'
            }
        });

        return competitions;
    } catch (error) {
        console.error('Error getting all competitions:', error);
        throw error;
    }
}

export async function getMonthCompetitions(month: number, year: number) {
    try {
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 1);

        const competitions = await prisma.competition.findMany({
            where: {
                startDate: {
                    gte: startOfMonth,
                    lt: endOfMonth
                }
            },
            include: {
                categories: {
                    orderBy: { startTime: 'asc' }
                },
                _count: {
                    select: {
                        categories: true
                    }
                }
            },
            orderBy: {
                startDate: 'asc'
            }
        });

        return competitions;
    } catch (error) {
        console.error('Error getting current month competitions:', error);
        throw error;
    }
}

export async function getOrganisedCompetitions(creatorId: string) {
    try {
        const competitions = await prisma.competition.findMany({
            where: { creatorId },
            orderBy: {
                startDate: 'desc'
            }
        });

        return competitions;
    } catch (error) {
        console.error('Error getting organised competitions:', error);
        throw error;
    }
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

export async function getNearCompetitions(n_objects: number, country?: string, postalCode?: string, includeInscribed?: boolean, userId?: string) {

    if (country == undefined || postalCode == undefined) {
        // If no location info, return empty list
        // console.warn('No country or postal code provided for getNearCompetitions, returning empty list');
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
                    entries: {
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

/**
 * Returns a page of live or future competitions where the given Participant
 * has no Entry in any Category (regardless of registration status).
 * Used by the authenticated landing page "Other Upcoming Competitions" feed.
 */
export async function getOtherUpcomingCompetitions(userId: string, limit: number, offset: number) {
    return prisma.competition.findMany({
        take: limit,
        skip: offset,
        where: {
            status: {
                in: [CompetitionStatus.NOT_STARTED, CompetitionStatus.STARTED]
            },
            // Exclude competitions where the user appears on any Entry
            NOT: {
                categories: {
                    some: {
                        entries: {
                            some: {
                                users: { some: { id: userId } }
                            }
                        }
                    }
                }
            }
        },
        include: {
            categories: true
        },
        orderBy: [
            { startDate: 'asc' },
            { id: 'asc' }  // deterministic tie-breaker for stable pagination
        ],
    });
}

// ---------------------------------------------------------------------------
// User-scoped competition queries
// ---------------------------------------------------------------------------

// Helper function to get competitions where user is registered
async function getUserRegisteredCompetitions(userId: string, statusFilter?: CompetitionStatus) {
    const whereClause: any = {
        categories: {
            some: {
                entries: {
                    some: {
                        users: {
                            some: {
                                id: userId
                            }
                        }
                    }
                }
            }
        }
    };

    if (statusFilter) {
        whereClause.status = statusFilter;
    }

    return await prisma.competition.findMany({
        where: whereClause,
        include: {
            categories: {
                orderBy: { startTime: 'asc' },
                include: {
                    entries: {
                        where: {
                            users: {
                                some: {
                                    id: userId
                                }
                            }
                        },
                        include: {
                            users: {
                                select: {
                                    name: true,
                                    email: true,
                                    image: true,
                                    id: true
                                }
                            }
                        }
                    }
                }
            },
            league: true
        },
        orderBy: {
            startDate: 'asc'
        }
    });
}

export async function getUpcomingRegisteredCompetitions(userId: string) {
    try {
        const competitions = await getUserRegisteredCompetitions(userId, CompetitionStatus.NOT_STARTED);
        return competitions;
    } catch (error) {
        console.error('Error getting upcoming registered competitions:', error);
        throw error;
    }
}

export async function getStartedRegisteredCompetitions(userId: string) {
    try {
        const competitions = await getUserRegisteredCompetitions(userId, CompetitionStatus.STARTED);
        return competitions;
    } catch (error) {
        console.error('Error getting started registered competitions:', error);
        throw error;
    }
}

export async function getParticipatedCompetitions(userId: string) {
    try {
        const competitions = await getUserRegisteredCompetitions(userId, CompetitionStatus.FINISHED);
        return competitions;
    } catch (error) {
        console.error('Error getting participated competitions:', error);
        throw error;
    }
}

/**
 * Fetches all home dashboard data for an authenticated user in fewer DB trips.
 * Combines the three getUserRegisteredCompetitions calls (NOT_STARTED, STARTED, FINISHED)
 * into a single query and splits by status, then runs the remaining queries in parallel.
 */
export async function getHomeDashboardData(userId: string) {
    // Single query for all user-registered competitions (instead of 3 separate status queries)
    const allRegisteredPromise = getUserRegisteredCompetitions(userId);

    // Run remaining independent queries in parallel alongside the combined one
    const [allRegistered, otherUpcoming, lastResults, registrationStatuses] = await Promise.all([
        allRegisteredPromise,
        getOtherUpcomingCompetitions(userId, 10, 0),
        getLastUserResults(userId, 5),
        getUserRegistrationStatuses(userId)
    ]);

    // Split by status client-side
    const upcomingRegisteredCompetitions = allRegistered.filter(
        c => c.status === CompetitionStatus.NOT_STARTED
    );
    const startedCompetitions = allRegistered.filter(
        c => c.status === CompetitionStatus.STARTED
    );
    const participatedCompetitions = allRegistered.filter(
        c => c.status === CompetitionStatus.FINISHED
    );

    return {
        upcomingRegisteredCompetitions,
        participatedCompetitions,
        otherUpcomingCompetitions: otherUpcoming,
        lastResults,
        startedCompetitions,
        registrationStatuses,
    };
}

export async function getUserRegistrationStatuses(userId: string) {
    const competitions = await prisma.competition.findMany({
        where: {
            status: { in: [CompetitionStatus.NOT_STARTED, CompetitionStatus.STARTED] },
            startDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
            categories: {
                some: {
                    entries: { some: { users: { some: { id: userId } } } }
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
                    entries: {
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
            entryStatus: category.entries[0]?.status ?? null
        }))
    }));
}

/**
 * Returns the user's latest finished records across completed categories,
 * including all sibling records in each category (for position computation),
 * teammates, user intents, puzzle info, and competition details.
 */
export async function getLastUserResults(userId: string, limit: number = 5) {
    // First, find the user's records in completed categories
    const userEntries = await prisma.entry.findMany({
        where: {
            users: { some: { id: userId } },
            status: RegistrationStatus.CONFIRMED,
            category: {
                status: CategoryStatus.COMPLETE,
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
            externalParticipants: {
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
                    entries: {
                        where: { status: RegistrationStatus.CONFIRMED },
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

    // Compute position for each of the user's entries
    return userEntries.map((entry) => {
        const allEntries = entry.category.entries;
        const finishedEntries = allEntries.filter((r) => r.finishTime != null);
        const position = entry.finishTime
            ? finishedEntries.findIndex((r) => r.id === entry.id) + 1
            : null; // DNF

        return {
            id: entry.id,
            finishTime: entry.finishTime,
            nPiecesCompleted: entry.nPiecesCompleted,
            position,
            totalFinished: finishedEntries.length,
            totalEntries: allEntries.length,
            users: entry.users,
            externalParticipants: entry.externalParticipants,
            category: {
                id: entry.category.id,
                description: entry.category.description,
                type: entry.category.type,
                realStartTime: entry.category.realStartTime,
                puzzles: entry.category.puzzles
            },
            competition: entry.category.competition
        };
    });
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Competition mutations
// ---------------------------------------------------------------------------

export async function createCompetition(competition: Prisma.CompetitionUpdateInput) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            let updatedCompetition: Competition;

            updatedCompetition = await tx.competition.create({
                data: competition as Prisma.CompetitionCreateInput
            });

            return updatedCompetition;
        });

        return {
            success: true,
            data: result,
            message: 'Competition updated successfully'
        };
    } catch (error) {
        console.error('Error updating competition:', error);
        return {
            success: false,
            data: null,
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function updateCompetition(
    competitionId: number,
    competition: Prisma.CompetitionUpdateInput,
) {
    try {
        // Use a transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
            // Update the competition
            let updatedCompetition: Competition;
            if (competitionId) {
                updatedCompetition = await tx.competition.update({
                    where: { id: competitionId },
                    data: competition
                });
            } else {
                // For create, strip update/delete from categories and remove undefined values
                const createData = { ...competition } as any;
                if (createData.categories) {
                    createData.categories = { create: createData.categories.create || [] };
                }
                // Remove undefined values that Prisma doesn't accept on create
                Object.keys(createData).forEach(key => {
                    if (createData[key] === undefined) {
                        delete createData[key];
                    }
                });
                updatedCompetition = await tx.competition.create({
                    data: createData as Prisma.CompetitionUncheckedCreateInput
                });
            }

            return {
                competition: updatedCompetition,
            };
        });

        console.log("db_competition.ts: result", result);
        return {
            success: true,
            data: result,
            message: 'Competition and categories updated successfully'
        };
    } catch (error) {
        console.error('Error updating competition:', error);
        return {
            success: false,
            data: null,
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function updateCompetitionStatus(competitionId: number, status: 'NOT_STARTED' | 'STARTED' | 'FINISHED' | 'CANCELLED') {
    try {
        const updatedCompetition = await prisma.competition.update({
            where: { id: competitionId },
            data: { status: status as any }
        });

        return updatedCompetition;
    } catch (error) {
        console.error('Error updating competition status:', error);
        throw error;
    }
}

// ---------------------------------------------------------------------------
// Landing page stats (pre-computed, served from DB)
// ---------------------------------------------------------------------------

export async function getLandingStats() {
    return prisma.landingStats.findUnique({ where: { id: 1 } });
}

export async function upsertLandingStats(data: {
    upcomingCount: number;
    cityCount: number;
    participantCount: number;
}) {
    return prisma.landingStats.upsert({
        where: { id: 1 },
        create: { id: 1, ...data },
        update: data,
    });
}

// ---------------------------------------------------------------------------
// Explore competitions (with per-category registration data)
// ---------------------------------------------------------------------------

export async function getExploreCompetitionsData(userId?: string) {
    const [competitions, registeredCategoryIds] = await Promise.all([
        prisma.competition.findMany({
            include: {
                categories: {
                    orderBy: { startTime: 'asc' },
                    include: {
                        entries: {
                            include: {
                                users: {
                                    select: {
                                        id: true,
                                        name: true,
                                        image: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                startDate: 'asc'
            },
        }),
        userId
            ? prisma.entry.findMany({
                where: { users: { some: { id: userId } } },
                select: { categoryId: true },
            }).then(entries => entries.map(r => r.categoryId))
            : Promise.resolve([] as number[]),
    ]);

    return { competitions, registeredCategoryIds };
}

// ---------------------------------------------------------------------------
// Competition with judges (for manage judges page)
// ---------------------------------------------------------------------------

export async function getCompetitionWithJudges(competitionId: number) {
    const competition = await prisma.competition.findUnique({
        where: { id: competitionId },
        include: {
            categories: {
                include: {
                    judgeAssignments: {
                        select: { user: { select: { id: true, name: true, email: true } } }
                    }
                },
                orderBy: { startTime: 'asc' }
            }
        }
    });

    if (!competition) return null;

    return {
        competition: {
            id: competition.id,
            name: competition.name,
            creatorId: competition.creatorId,
        },
        categoriesWithJudges: competition.categories.map((cat) => ({
            id: cat.id,
            description: cat.description,
            subname: cat.subname,
            type: cat.type,
            judges: cat.judgeAssignments.map((a) => a.user)
        }))
    };
}
