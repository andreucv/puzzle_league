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

        return { ...authUser, country: null, postalCode: null, phonePrefix: null, phoneNumber: null, phonePromptLastChecked: null, locale: null, localePromptLastChecked: null, publicProfileVisibility: true, publicResultsVisibility: true, roleAssignments: [] };
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

export async function updateUserVisibility(userId: string, field: 'publicProfileVisibility' | 'publicResultsVisibility', value: boolean) {
    return prisma.user.update({
        where: { id: userId },
        data: { [field]: value, updatedAt: new Date() }
    });
}

export async function updateUserLocale(userId: string, locale: string) {
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
        select: {
            userIntentsLastChecked: true,
            name: true,
            createdAt: true,
            emailVerified: true,
            emailVerificationPromptLastChecked: true,
            accounts: {
                where: { providerId: 'credential' },
                select: { id: true },
                take: 1,
            },
        },
    });
}

export async function getUnclaimedIntentsMatchingName(userName: string) {
    const allUnclaimed = await prisma.userIntent.findMany({
        where: { claimedById: null },
        include: {
            createdBy: { select: { id: true, name: true } },
            records: {
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
        const intentNameLower = ui.name.toLowerCase();
        return intentNameLower.includes(userNameLower) || userNameLower.includes(intentNameLower);
    });
}

export async function hasMatchingUnclaimedIntents(userName: string): Promise<boolean> {
    const unclaimed = await prisma.userIntent.findMany({
        where: { claimedById: null },
        select: { name: true },
        take: 100,
    });
    const userNameLower = userName.toLowerCase();
    return unclaimed.some((ui) => {
        const intentNameLower = ui.name.toLowerCase();
        return intentNameLower.includes(userNameLower) || userNameLower.includes(intentNameLower);
    });
}

export async function markUserIntentsChecked(userId: string) {
    return prisma.user.update({
        where: { id: userId },
        data: { userIntentsLastChecked: new Date() },
    });
}

export async function markEmailVerificationSkipped(userId: string) {
    return prisma.user.update({
        where: { id: userId },
        data: { emailVerificationPromptLastChecked: new Date() },
    });
}

export async function claimUserIntents(userId: string, userIntentIds: string[]) {
    return prisma.$transaction(async (tx) => {
        const intents = await tx.userIntent.findMany({
            where: { id: { in: userIntentIds }, claimedById: null },
            include: {
                records: true,
                createdBy: { select: { id: true, name: true } },
            },
        });

        if (intents.length !== userIntentIds.length) {
            throw new Error('Some participations are already claimed or not found.');
        }

        for (const intent of intents) {
            await tx.userIntent.update({
                where: { id: intent.id },
                data: { claimedById: userId },
            });

            for (const record of intent.records) {
                await tx.record.update({
                    where: { id: record.id },
                    data: {
                        users: { connect: { id: userId } },
                        userIntents: { disconnect: { id: intent.id } },
                    },
                });
            }
        }

        return intents;
    });
}
