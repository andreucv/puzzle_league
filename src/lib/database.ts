import { PrismaClient } from '@prisma/client';

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
    leagueId: string,
    categories: {
        type: 'INDIVIDUAL' | 'PAIRS' | 'TEAM' | 'JUNIOR_INDIVIDUAL' | 'JUNIOR_PAIRS' | 'PUZZLE_CHESS',
        startTime: Date,
        endTime: Date,
        startDate: Date,
        endDate: Date
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
                    leagueId,
                    status: 'UPCOMING'
                }
            });

            // Create categories for the competition
            const createdCategories = await Promise.all(
                categories.map(async (category) => {
                    return await tx.category.create({
                        data: {
                            type: category.type as any, // Cast to CategoryType enum
                            startTime: category.startTime,
                            endTime: category.endTime,
                            startDate: category.startDate,
                            endDate: category.endDate,
                            competitionId: competition.id
                        }
                    });
                })
            );

            return {
                competition,
                categories: createdCategories
            };
        });

        return result;
    } catch (error) {
        console.error('Error creating competition:', error);
        throw error;
    }
}

export async function getCompetitionWithCategories(competitionId: string) {
    try {
        const competition = await prisma.competition.findUnique({
            where: { id: competitionId },
            include: {
                categories: true,
                league: true,
                roleAssignments: {
                    include: {
                        user: {
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

export async function updateCompetitionStatus(competitionId: string, status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED') {
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
    competitionId: string,
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

export async function getCategoriesByCompetition(competitionId: string) {
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

// Export the prisma client for direct use in other files
export { prisma };
