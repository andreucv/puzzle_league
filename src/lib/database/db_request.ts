import { prisma } from '$lib/database/create_prisma_client';

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
