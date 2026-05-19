import { prisma } from '$lib/database/create_prisma_client';
import { Role } from '$lib/.prisma/generated/prisma/enums';

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

export async function getUserWithRoles(authUser: { id: string }) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: authUser.id },
            select: {
                country: true,
                postalCode: true,
                locationPromptLastChecked: true,
                phonePrefix: true,
                phoneNumber: true,
                phonePromptLastChecked: true,
                locale: true,
                localePromptLastChecked: true,
                publicProfileVisibility: true,
                publicResultsVisibility: true,
                roleAssignments: true
            }
        });

        // Hydrate the auth user with additional data from the database
        if (user) {
            return {
                ...authUser,
                country: user.country,
                postalCode: user.postalCode,
                locationPromptLastChecked: user.locationPromptLastChecked,
                phonePrefix: user.phonePrefix,
                phoneNumber: user.phoneNumber,
                phonePromptLastChecked: user.phonePromptLastChecked,
                locale: user.locale,
                localePromptLastChecked: user.localePromptLastChecked,
                publicProfileVisibility: user.publicProfileVisibility,
                publicResultsVisibility: user.publicResultsVisibility,
                roleAssignments: user.roleAssignments
            };
        }

        return { ...authUser, country: null, postalCode: null, locationPromptLastChecked: null, phonePrefix: null, phoneNumber: null, phonePromptLastChecked: null, locale: null, localePromptLastChecked: null, publicProfileVisibility: true, publicResultsVisibility: true, roleAssignments: [] };
    }
    catch (error) {
        console.error('Error getting user with roles:', error);
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

// ---------------------------------------------------------------------------
// User search (DB-backed, bounded)
// ---------------------------------------------------------------------------

export async function searchUsers(query: string, limit: number = 20) {
    return prisma.user.findMany({
        where: {
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } }
            ]
        },
        select: {
            id: true,
            name: true,
            email: true,
            image: true
        },
        take: limit
    });
}

// ---------------------------------------------------------------------------
// Public profile
// ---------------------------------------------------------------------------

export async function getPublicProfile(userId: string) {
    return prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            country: true,
            phonePrefix: true,
            phoneNumber: true,
            createdAt: true,
            publicProfileVisibility: true
        }
    });
}

export async function isPrivilegedViewer(viewerId: string): Promise<boolean> {
    const viewerRoles = await prisma.roleAssignment.findMany({
        where: { userId: viewerId },
        select: { role: true }
    });

    return viewerRoles.some(
        (r) => r.role === Role.ORGANIZER || r.role === Role.ADMIN
    );
}

// ---------------------------------------------------------------------------
// Profile account & mutations
// ---------------------------------------------------------------------------

export async function getUserAccountProvider(userId: string) {
    const account = await prisma.account.findFirst({
        where: { userId },
        select: { providerId: true }
    });
    return account ? { provider: account.providerId } : { provider: 'credential' };
}

export async function updateUserLocation(userId: string, country: string | null, postalCode: string | null) {
    return prisma.user.update({
        where: { id: userId },
        data: { country, postalCode, updatedAt: new Date() }
    });
}

export async function updateUserName(userId: string, name: string) {
    return prisma.user.update({
        where: { id: userId },
        data: { name, updatedAt: new Date() }
    });
}

export async function updateUserVisibility(userId: string, field: 'publicProfileVisibility' | 'publicResultsVisibility', value: boolean) {
    return prisma.user.update({
        where: { id: userId },
        data: { [field]: value, updatedAt: new Date() }
    });
}

export async function updateUserLocale(userId: string, locale: string | null) {
    return prisma.user.update({
        where: { id: userId },
        data: { locale, updatedAt: new Date() }
    });
}

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------

export async function getOnboardingFlags(userId: string) {
    return prisma.user.findUnique({
        where: { id: userId },
        include: {
            accounts: {
                where: { providerId: 'credential' },
                select: { id: true },
                take: 1,
            },
        },
    });
}

export async function getUnclaimedExternalParticipantsMatchingName(userName: string) {
    const allUnclaimed = await prisma.externalParticipant.findMany({
        where: { claimedById: null },
        include: {
            createdBy: { select: { id: true, name: true } },
            entries: {
                include: {
                    category: {
                        include: {
                            competition: { select: { id: true, name: true } },
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    const userNameLower = userName.toLowerCase();
    return allUnclaimed.filter((ui) => {
        const nameLower = ui.name.toLowerCase();
        return nameLower.includes(userNameLower) || userNameLower.includes(nameLower);
    });
}

export async function hasMatchingUnclaimedExternalParticipants(userName: string): Promise<boolean> {
    const unclaimed = await prisma.externalParticipant.findMany({
        where: { claimedById: null },
        select: { name: true },
        take: 100,
    });
    const userNameLower = userName.toLowerCase();
    return unclaimed.some((ui) => {
        const nameLower = ui.name.toLowerCase();
        return nameLower.includes(userNameLower) || userNameLower.includes(nameLower);
    });
}

export async function markExternalParticipantsChecked(userId: string) {
    return prisma.user.update({
        where: { id: userId },
        data: { externalParticipantsLastChecked: new Date() },
    });
}

export async function markEmailVerificationSkipped(userId: string) {
    return prisma.user.update({
        where: { id: userId },
        data: { emailVerificationPromptLastChecked: new Date() },
    });
}

export async function saveLocationForUser(userId: string, country: string | null, postalCode: string | null) {
    return prisma.user.update({
        where: { id: userId },
        data: {
            country: country || null,
            postalCode: postalCode || null,
            locationPromptLastChecked: new Date(),
            updatedAt: new Date(),
        },
    });
}

export async function skipLocationPrompt(userId: string) {
    return prisma.user.update({
        where: { id: userId },
        data: { locationPromptLastChecked: new Date() },
    });
}

export async function claimExternalParticipants(userId: string, externalParticipantIds: string[]) {
    return prisma.$transaction(async (tx) => {
        const externalParticipants = await tx.externalParticipant.findMany({
            where: { id: { in: externalParticipantIds }, claimedById: null },
            include: {
                entries: true,
                createdBy: { select: { id: true, name: true } },
            },
        });

        if (externalParticipants.length !== externalParticipantIds.length) {
            throw new Error('Some participations are already claimed or not found.');
        }

        for (const externalParticipant of externalParticipants) {
            await tx.externalParticipant.update({
                where: { id: externalParticipant.id },
                data: { claimedById: userId },
            });

            for (const record of externalParticipant.entries) {
                await tx.entry.update({
                    where: { id: record.id },
                    data: {
                        users: { connect: { id: userId } },
                        externalParticipants: { disconnect: { id: externalParticipant.id } },
                    },
                });
            }
        }

        return externalParticipants;
    });
}
