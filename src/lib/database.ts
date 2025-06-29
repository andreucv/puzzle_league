import { CompetitionStatus, PrismaClient } from '@prisma/client';

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
                parties: {
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
                include: {
                    parties: {
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
                                    image: true
                                }
                            }
                        }
                    }
                }
            },
            league: true
        },
        orderBy: {
            startDate: 'desc'
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

// Competition related functions
export async function createCompetition(
    name: string,
    description: string | null,
    startDate: Date,
    endDate: Date,
    leagueId: string | null,
    categories: {
        name: string,
        type: string,
        startTime: Date,
        endTime: Date,
        startDate: Date,
        endDate: Date,
        participationFee: number,
        maxPartySize: number,
    }[]
) {
    try {
        // Use a transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
            // Create the competition
            const competition = await tx.competition.create({
                data: {
                    name,
                    description,
                    startDate,
                    endDate,
                    status: 'UPCOMING',
                    leagueId: leagueId || null,
                }
            });

            // Create categories for the competition
            const createdCategories = await Promise.all(
                categories.map(async (category) => {
                    return await tx.category.create({
                        data: {
                            name: category.name || category.type,
                            type: category.type as any, // Cast to CategoryType enum
                            startTime: category.startTime,
                            endTime: category.endTime,
                            startDate: category.startDate,
                            endDate: category.endDate,
                            competitionId: competition.id,
                            maxPartySize: category.maxPartySize,
                        }
                    });
                })
            );

            console.log("database.ts: createdCategories", createdCategories);

            return {
                competition,
                categories: createdCategories
            };
        });
        return {
            success: true,
            data: result,
            message: 'Competition and categories created successfully'
        };
    } catch (error) {
        console.error('Error creating competition:', error);
        return {
            success: false,
            data: null,
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function getCompetitionWithCategories(competitionId: number) {
    try {
        const competition = await prisma.competition.findUnique({
            where: { id: competitionId },
            include: {
                categories: true,
                league: true,
            }
        });

        return competition;
    } catch (error) {
        console.error('Error getting competition with categories:', error);
        throw error;
    }
}

export async function getAllCompetitions() {
    try {
        const competitions = await prisma.competition.findMany({
            include: {
                categories: true,
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

// Category related functions
export async function createCategory(
    competitionId: number,
    type: 'INDIVIDUAL' | 'PAIRS' | 'TEAM' | 'JUNIOR_INDIVIDUAL' | 'JUNIOR_PAIRS' | 'PUZZLE_CHESS',
    startTime: Date,
    endTime: Date,
    startDate: Date,
    endDate: Date
) {
    try {
        const category = await prisma.category.create({
            data: {
                type: type as any, // Cast to CategoryType enum
                startTime,
                endTime,
                startDate,
                endDate,
                competitionId
            }
        });

        return category;
    } catch (error) {
        console.error('Error creating category:', error);
        throw error;
    }
}

export async function getCategoriesByCompetition(competitionId: number) {
    try {
        const categories = await prisma.category.findMany({
            where: { competitionId },
            include: {
                parties: {
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
            },
            orderBy: {
                startDate: 'asc'
            }
        });

        return categories;
    } catch (error) {
        console.error('Error getting categories by competition:', error);
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
                        categories: true
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
            const createdParties = [];

            // Get all category IDs to fetch in one query
            const categoryIds = categorySignups.map(signup => signup.categoryId);

            // Fetch categories with their competition info and existing parties
            const categories = await tx.category.findMany({
                where: { id: { in: categoryIds } },
                include: {
                    competition: true,
                    parties: {
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
            const alreadyRegistered = categories.filter(cat => cat.parties.length > 0);
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
                const party = await tx.party.create({
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

                createdParties.push(party);
            }

            return createdParties;
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

// Export the prisma client for direct use in other files
export { prisma };
