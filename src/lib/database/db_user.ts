import { prisma } from '$lib/database/create_prisma_client';

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
