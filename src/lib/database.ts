import { CompetitionStatus, PrismaClient, Prisma} from '@prisma/client';
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
        const competitions = await getUserRegisteredCompetitions(userId, CompetitionStatus.UPCOMING);
        return competitions;
    } catch (error) {
        console.error('Error getting upcoming registered competitions:', error);
        throw error;
    }
}

export async function getParticipatedCompetitions(userId: string) {
    try {
        const competitions = await getUserRegisteredCompetitions(userId, CompetitionStatus.COMPLETED);
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
): Promise<Array<Category & { totalRecords: number; finishedRecords: number }>> {
    try {
        // Fetch categories with total records count
        const categories = await prisma.category.findMany({
            where: { competitionId },
            orderBy: { startTime: 'asc' }
        });

        // Count total number of records in category
        const enriched = await Promise.all(
            categories.map(async (category) => {
                const categoryId = category.id;
                const [totalRecords, finishedRecords] = await Promise.all([
                    prisma.record.count({
                        where: { categoryId }
                    }),
                    prisma.record.count({
                        where: { categoryId, finishTime: { not: null } }
                    })
                ]);

                return {
                    ...(category as unknown as Category),
                    totalRecords,
                    finishedRecords
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
            where: { categoryId }
        }),
        prisma.record.count({
            where: { categoryId, finishTime: { not: null } }
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
                    orderBy: { startTime: 'asc' }
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

export async function updateCompetitionStatus(competitionId: number, status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED') {
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
            const createdRegisters = [];

            // Get all category IDs to fetch in one query
            const categoryIds = categorySignups.map(signup => signup.categoryId);

            // Fetch categories with their competition info and existing parties
            const categories = await tx.category.findMany({
                where: { id: { in: categoryIds } },
                include: {
                    competition: true,
                    registers: {
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

            // Check for duplicate registrations
            const alreadyRegistered = categories.filter(cat => cat.registers.length > 0);
            if (alreadyRegistered.length > 0) {
                const categoryNames = alreadyRegistered.map(c => c.name || c.type);
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
                    throw new Error(`Party size (${allPartyUserIds.length}) exceeds maximum for category ${category.name || category.type} (${category.maxPartySize})`);
                }

                // Check if competition registration is still open
                const now = new Date();
                if (category.competition.status !== 'UPCOMING') {
                    throw new Error(`Registration closed for competition: ${category.competition.name}`);
                }

                // Create the party
                const register = await tx.register.create({
                    data: {
                        categoryId: signup.categoryId,
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

                createdRegisters.push(register);
            }

            return createdRegisters;
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
        const result = await prisma.record.deleteMany({
            where: {
                categoryId,
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

export async function createEntries(recordsData: Prisma.EntryCreateInput[]) {
    try {
        if (!recordsData.length) {
            return { success: false, error: 'No records to create' };
        }
        console.log("database.ts: recordsData", recordsData);
        const result = await prisma.$transaction(async (tx) => {
            const createdEntries = [];

            for (const recordData of recordsData) {
                // Validate the entry data
                if (!recordData.category?.connect?.id || !recordData.users?.connect || !recordData.creator.id) {
                    throw new Error('Invalid entry data: missing required fields');
                }

                const categoryId = recordData.category.connect.id;
                const userIds = recordData.users.connect.map(u => u.id);
                const creatorId = recordData.creator.id;

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
                    throw new Error(`One or more users are already registered for category ${category.name || category.type}`);
                }

                // Validate party size
                if (category.maxPartySize && userIds.length != category.maxPartySize) {
                    throw new Error(`Party size (${userIds.length}) exceeds maximum for category ${category.name || category.type} (${category.maxPartySize})`);
                }

                // Check if competition is still accepting registrations
                if (category.competition.status !== 'UPCOMING') {
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
                updatedCompetition = await tx.competition.create({
                    data: competition
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

// Export the prisma client for direct use in other files
export { prisma };
