import { CompetitionStatus, InscriptionStatus, PrismaClient, Prisma} from '@prisma/client';
import type { Competition, Category } from '@prisma/client';

// Initialize Prisma client
const prisma = new PrismaClient();

// User related functions
export async function getRoleAssignments(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { roleAssignments: true }
        });

        return user?.roleAssignments;
    }
    catch (error) {
        console.error('Error getting user role assignments:', error);
        throw error;
    }
}

// Helper function to get competitions where user is registered
async function getUserRegisteredCompetitions(userId: string, statusFilter?: CompetitionStatus) {
    const whereClause: any = {
        categories: {
            some: {
                records: {
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
                    records: {
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

export async function getParticipatedCompetitions(userId: string) {
    try {
        const competitions = await getUserRegisteredCompetitions(userId, CompetitionStatus.FINISHED);
        return competitions;
    } catch (error) {
        console.error('Error getting participated competitions:', error);
        throw error;
    }
}

export async function createRequest(userId: string, role: string, reason: string, additionalInfo: string) {
    try {
        const roleRequest = await prisma.request.create({
            data: {
                userId,
                role: role as any, // Cast to UserRole enum
                reason,
                additionalInfo,
                status: 'PENDING'
            }
        });

        return roleRequest;
    }
    catch (error) {
        console.error('Error creating role request:', error);
        throw error;
    }
}

export async function getRequestsByUserId(userId: string) {
    try {
        const requests = await prisma.request.findMany({
            where: { userId }
        });

        return requests;
    }
    catch (error) {
        console.error('Error getting user requests:', error);
        throw error;
    }
}

export async function getPendingRequests() {
    try {
        const requests = await prisma.request.findMany({
            where: { status: 'PENDING' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                },
                competition: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return requests;
    }
    catch (error) {
        console.error('Error getting pending requests:', error);
        throw error;
    }
}

export async function acceptRequest(requestId: string, adminId: string) {
    try {
        // Use a transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
            // Get the request details
            const request = await tx.request.findUnique({
                where: { id: requestId }
            });

            if (!request) {
                throw new Error('Request not found');
            }

            if (request.status !== 'PENDING') {
                throw new Error('Request is not pending');
            }

            // Update the request status
            const updatedRequest = await tx.request.update({
                where: { id: requestId },
                data: {
                    status: 'APPROVED'
                }
            });

            // Create the role assignment
            const roleAssignment = await tx.roleAssignment.create({
                data: {
                    userId: request.userId,
                    role: request.role,
                }
            });

            return { updatedRequest, roleAssignment };
        });

        return result;
    } catch (error) {
        console.error('Error accepting request:', error);
        throw error;
    }
}

export async function rejectRequest(requestId: string, adminId: string, rejectionReason?: string) {
    try {
        const updatedRequest = await prisma.request.update({
            where: { id: requestId },
            data: {
                status: 'REJECTED'
            }
        });

        return updatedRequest;
    } catch (error) {
        console.error('Error rejecting request:', error);
        throw error;
    }
}

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

export async function getCompetitionCategories(
    competitionId: number
): Promise<Array<Category & { totalRecords: number; finishedRecords: number; pendingRecords: number; acceptedRecords: number }>> {
    try {
        // Fetch categories with total records count
        const categories = await prisma.category.findMany({
            where: { competitionId },
            orderBy: { startTime: 'asc' }
        });

        // Count records in category by status
        const enriched = await Promise.all(
            categories.map(async (category) => {
                const categoryId = category.id;
                const [totalRecords, finishedRecords, pendingRecords, acceptedRecords] = await Promise.all([
                    prisma.record.count({
                        where: { categoryId, status: InscriptionStatus.ACCEPTED }
                    }),
                    prisma.record.count({
                        where: { categoryId, finishTime: { not: null }, status: InscriptionStatus.ACCEPTED }
                    }),
                    prisma.record.count({
                        where: { categoryId, status: InscriptionStatus.PENDING }
                    }),
                    prisma.record.count({
                        where: { categoryId, status: InscriptionStatus.ACCEPTED }
                    })
                ]);

                return {
                    ...(category as unknown as Category),
                    totalRecords,
                    finishedRecords,
                    pendingRecords,
                    acceptedRecords
                };
            })
        );

        return enriched;
    } catch (error) {
        console.error('Error getting competition categories:', error);
        throw error;
    }
}

export async function startCategory(categoryId: number) {
    const [totalRecords, finishedRecords] = await Promise.all([
        prisma.record.count({
            where: { categoryId, status: InscriptionStatus.ACCEPTED }
        }),
        prisma.record.count({
            where: { categoryId, finishTime: { not: null }, status: InscriptionStatus.ACCEPTED }
        })
    ]);

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        realStartTime: new Date(),
        status: 'in_progress'
      }
    });

    return {
        ...(updatedCategory as unknown as Category),
        totalRecords,
        finishedRecords
    };

}

export async function getCompetitionWithCategories(competitionId: number) {
    try {
        const competition = await prisma.competition.findUnique({
            where: { id: competitionId },
            include: {
                categories: {
                    orderBy: { startTime: 'asc' },
                    include: {
                        puzzles: true
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
                        categories: true,
                        roleAssignments: true
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
                        categories: true,
                        roleAssignments: true
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

// League related functions
export async function createLeague(name: string, description?: string) {
    try {
        const league = await prisma.league.create({
            data: {
                name,
                description
            }
        });

        return league;
    } catch (error) {
        console.error('Error creating league:', error);
        throw error;
    }
}

export async function getAllLeagues() {
    try {
        const leagues = await prisma.league.findMany({
            include: {
                competitions: {
                    include: {
                        categories: {
                            orderBy: { startTime: 'asc' }
                        }
                    }
                },
                _count: {
                    select: {
                        competitions: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return leagues;
    } catch (error) {
        console.error('Error getting all leagues:', error);
        throw error;
    }
}

export async function getUsersNameAndEmail() {
    try {
        const users = await prisma.user.findMany({
            select: {
                name: true,
                email: true
            }
        });

        return users;
    } catch (error) {
        console.error('Error getting all users:', error);
        throw error;
    }
}

export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                image: true
            }
        });

        return users;
    } catch (error) {
        console.error('Error getting all users:', error);
        throw error;
    }
}

// Better type definition
interface CategorySignup {
  categoryId: number;
  teammateIds: string[];
}

export async function signUpUsersToCompetition(
    categorySignups: CategorySignup[],
    currentUserId: string
) {
    try {
        // Input validation
        if (!categorySignups.length) {
            return { success: false, error: 'No categories selected for signup' };
        }

        const result = await prisma.$transaction(async (tx) => {
            const createdRecords = [];

            // Get all category IDs to fetch in one query
            const categoryIds = categorySignups.map(signup => signup.categoryId);

            // Fetch categories with their competition info and existing parties
            const categories = await tx.category.findMany({
                where: { id: { in: categoryIds } },
                include: {
                    competition: true,
                    records: {
                        where: {
                            users: {
                                some: { id: currentUserId }
                            }
                        }
                    }
                }
            });

            // Validate all categories exist
            if (categories.length !== categoryIds.length) {
                const foundIds = categories.map(c => c.id);
                const missingIds = categoryIds.filter(id => !foundIds.includes(id));
                throw new Error(`Categories not found: ${missingIds.join(', ')}`);
            }

            // Check for duplicate registrations (only block if PENDING or ACCEPTED exists)
            const alreadyRegistered = categories.filter(cat =>
                cat.records.some(r => r.status === InscriptionStatus.PENDING || r.status === InscriptionStatus.ACCEPTED)
            );
            if (alreadyRegistered.length > 0) {
                const categoryNames = alreadyRegistered.map(c => c.description || c.type);
                throw new Error(`Already registered for categories: ${categoryNames.join(', ')}`);
            }

            // Validate all users exist (including current user and teammates)
            const allUserIds = new Set([currentUserId]);
            categorySignups.forEach(signup => {
                signup.teammateIds.forEach(id => allUserIds.add(id));
            });

            const existingUsers = await tx.user.findMany({
                where: { id: { in: Array.from(allUserIds) } },
                select: { id: true }
            });

            if (existingUsers.length !== allUserIds.size) {
                const foundUserIds = existingUsers.map(u => u.id);
                const missingUserIds = Array.from(allUserIds).filter(id => !foundUserIds.includes(id));
                throw new Error(`Users not found: ${missingUserIds.join(', ')}`);
            }

            // Create parties for each category
            for (const signup of categorySignups) {
                const category = categories.find(c => c.id === signup.categoryId)!;
                const allPartyUserIds = [currentUserId, ...signup.teammateIds];

                // Validate party size against category limits
                if (category.maxPartySize && allPartyUserIds.length > category.maxPartySize) {
                    throw new Error(`Party size (${allPartyUserIds.length}) exceeds maximum for category ${category.description || category.type} (${category.maxPartySize})`);
                }

                // Check if competition registration is still open
                const now = new Date();
                if (category.competition.status !== 'NOT_STARTED') {
                    throw new Error(`Registration closed for competition: ${category.competition.name}`);
                }

                // Create the party
                const record = await tx.record.create({
                    data: {
                        categoryId: signup.categoryId,
                        creatorId: currentUserId,
                        users: {
                            connect: allPartyUserIds.map(id => ({ id }))
                        }
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

                createdRecords.push(record);
            }

            return createdRecords;
        });

        return {
            success: true,
            data: result,
            message: `Successfully registered for ${result.length} categories`
        };
    } catch (error) {
        console.error('Error signing up users to competition:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            data: null
        };
    }
}

export async function getCategoryEntriesFromCompetition(competitionId: number, userId: string) {
    try {
        const records = await prisma.record.findMany({
            where: {
                category: {
                    competitionId
                },
                users: {
                    some: {
                        id: userId
                    }
                }
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

export async function removeUserFromCategory(categoryId: number, userId: string) {
    try {
        // Only allow unregistering from PENDING or ACCEPTED inscriptions
        const result = await prisma.record.deleteMany({
            where: {
                categoryId,
                status: { in: [InscriptionStatus.PENDING, InscriptionStatus.ACCEPTED] },
                users: {
                    some: {
                        id: userId
                    }
                }
            }
        });

        return result;
    } catch (error) {
        console.error('Error removing user from category:', error);
        throw error;
    }
}

export async function createEntries(recordsData: Prisma.RecordCreateInput[]) {
    try {
        if (!recordsData.length) {
            return { success: false, error: 'No records to create' };
        }
        console.log("database.ts: recordsData", recordsData);
        const result = await prisma.$transaction(async (tx) => {
            const createdEntries = [];

            for (const recordData of recordsData) {
                // Validate the entry data
                if (!recordData.category?.connect?.id || !recordData.users?.connect || !recordData.creator) {
                    throw new Error('Invalid entry data: missing required fields');
                }

                const categoryId = recordData.category.connect.id;
                const userIds = (recordData.users.connect as Prisma.UserWhereUniqueInput[]).map(u => u.id!);
                const creatorId = (recordData.creator as Prisma.UserCreateNestedOneWithoutCreatedRecordsInput).connect?.id;

                if (!creatorId) {
                    throw new Error('Creator ID not found');
                }

                // Check if category exists and get its constraints
                const category = await tx.category.findUnique({
                    where: { id: categoryId },
                    include: { competition: true }
                });

                if (!category) {
                    throw new Error(`Category with id ${categoryId} not found`);
                }

                // Check if users already registered for this category
                const existingEntry = await tx.record.findFirst({
                    where: {
                        categoryId: categoryId,
                        users: {
                            some: {
                                id: { in: userIds }
                            }
                        }
                    }
                });

                if (existingEntry) {
                    throw new Error(`One or more users are already registered for category ${category.description || category.type}`);
                }

                // Validate party size
                if (category.maxPartySize && userIds.length != category.maxPartySize) {
                    throw new Error(`Party size (${userIds.length}) exceeds maximum for category ${category.description || category.type} (${category.maxPartySize})`);
                }

                // Check if competition is still accepting registrations
                if (category.competition.status !== 'NOT_STARTED') {
                    throw new Error(`Registration closed for competition: ${category.competition.name}`);
                }

                // Check if competition registration is not complete
                // if (category.maxParties && category.records.length >= category.maxParties) {
                //     throw new Error(`Maximum number of parties reached for category ${category.name || category.type}`);
                // }

                // Validate all users exist
                const existingUsers = await tx.user.findMany({
                    where: { id: { in: userIds } },
                    select: { id: true }
                });

                if (existingUsers.length !== userIds.length) {
                    const foundUserIds = existingUsers.map(u => u.id);
                    const missingUserIds = userIds.filter(id => !foundUserIds.includes(id));
                    throw new Error(`Users not found: ${missingUserIds.join(', ')}`);
                }
                // Create the entry
                const record = await tx.record.create({
                    data: {
                        categoryId: categoryId,
                        creatorId: creatorId,
                        users: {
                            connect: userIds.map((id: string) => ({ id }))
                        }
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
                        category: true,
                    }
                });

                createdEntries.push(record);
            }

            return createdEntries;
        });

        return {
            success: true,
            data: result,
            message: `Successfully created ${result.length} records`
        };
    } catch (error) {
        console.error('Error creating records:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            data: null
        };
    }
}

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

        console.log("database.ts: result", result);
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

export async function getCompetitionWithCategoriesAndEntries(competitionId: number) {
    try {
        const competition = await prisma.competition.findUnique({
            where: { id: competitionId },
            include: {
                categories: {
                    orderBy: { startTime: 'asc' },
                    include: {
                        puzzles: true,
                        records: {
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

// Puzzle related functions
export async function getPuzzles() {
    try {
        return await prisma.puzzle.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { categories: true } }
            }
        });
    } catch (error) {
        console.error('Error getting puzzles:', error);
        throw error;
    }
}

export async function getPuzzleById(id: string) {
    try {
        return await prisma.puzzle.findUnique({
            where: { id },
            include: {
                categories: {
                    select: { id: true, description: true, type: true }
                }
            }
        });
    } catch (error) {
        console.error('Error getting puzzle:', error);
        throw error;
    }
}

export async function createPuzzle(data: Prisma.PuzzleCreateInput) {
    try {
        const puzzle = await prisma.puzzle.create({ data });
        return { success: true, data: puzzle, message: 'Puzzle created successfully' };
    } catch (error) {
        console.error('Error creating puzzle:', error);
        return {
            success: false, data: null,
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function updatePuzzle(id: string, data: Prisma.PuzzleUpdateInput) {
    try {
        const puzzle = await prisma.puzzle.update({ where: { id }, data });
        return { success: true, data: puzzle, message: 'Puzzle updated successfully' };
    } catch (error) {
        console.error('Error updating puzzle:', error);
        return {
            success: false, data: null,
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function deletePuzzle(id: string) {
    try {
        await prisma.puzzle.delete({ where: { id } });
        return { success: true, message: 'Puzzle deleted successfully' };
    } catch (error) {
        console.error('Error deleting puzzle:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function searchPuzzles(query: string) {
    try {
        return await prisma.puzzle.findMany({
            where: {
                OR: [
                    { barcode: { contains: query, mode: 'insensitive' } },
                    { name: { contains: query, mode: 'insensitive' } },
                    { brand: { contains: query, mode: 'insensitive' } },
                ]
            },
            take: 20,
            orderBy: { createdAt: 'desc' }
        });
    } catch (error) {
        console.error('Error searching puzzles:', error);
        throw error;
    }
}

// Inscription management functions

export async function getInscriptionsForCompetition(competitionId: number) {
    try {
        const categories = await prisma.category.findMany({
            where: { competitionId },
            orderBy: { startTime: 'asc' },
            include: {
                records: {
                    orderBy: [
                        { status: 'asc' },  // PENDING first (alphabetically before ACCEPTED/REFUSED)
                        { createdAt: 'asc' }
                    ],
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
                }
            }
        });

        return categories;
    } catch (error) {
        console.error('Error getting inscriptions for competition:', error);
        throw error;
    }
}

export async function acceptInscription(recordId: string) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const record = await tx.record.findUnique({
                where: { id: recordId },
                include: {
                    category: {
                        include: { competition: true }
                    }
                }
            });

            if (!record) {
                throw new Error('Record not found');
            }

            if (record.status !== InscriptionStatus.PENDING) {
                throw new Error('Only pending inscriptions can be accepted');
            }

            // Check maxParties limit against ACCEPTED records count
            if (record.category.maxParties) {
                const acceptedCount = await tx.record.count({
                    where: {
                        categoryId: record.categoryId,
                        status: InscriptionStatus.ACCEPTED
                    }
                });

                if (acceptedCount >= record.category.maxParties) {
                    throw new Error('Category is full — maximum number of accepted inscriptions reached');
                }
            }

            const updatedRecord = await tx.record.update({
                where: { id: recordId },
                data: { status: InscriptionStatus.ACCEPTED },
                include: {
                    users: {
                        select: { id: true, name: true, email: true, image: true }
                    }
                }
            });

            return updatedRecord;
        });

        return { success: true, data: result };
    } catch (error) {
        console.error('Error accepting inscription:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function refuseInscription(recordId: string) {
    try {
        const record = await prisma.record.findUnique({
            where: { id: recordId }
        });

        if (!record) {
            throw new Error('Record not found');
        }

        if (record.status !== InscriptionStatus.PENDING) {
            throw new Error('Only pending inscriptions can be refused');
        }

        const updatedRecord = await prisma.record.update({
            where: { id: recordId },
            data: { status: InscriptionStatus.REFUSED },
            include: {
                users: {
                    select: { id: true, name: true, email: true, image: true }
                }
            }
        });

        return { success: true, data: updatedRecord };
    } catch (error) {
        console.error('Error refusing inscription:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

// Export the prisma client for direct use in other files
export { prisma };
