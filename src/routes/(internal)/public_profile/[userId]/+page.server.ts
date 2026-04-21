import type { PageServerLoad } from './$types';
import { prisma } from '$lib/database/create_prisma_client';
import { error } from '@sveltejs/kit';
import { Role } from '$lib/.prisma/generated/prisma/enums';

export const load: PageServerLoad = async ({ params, locals }) => {
    const { userId } = params;

    const profile = await prisma.user.findUnique({
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

    if (!profile) {
        throw error(404, { message: 'User not found' });
    }

    // If profile visibility is off, check if viewer is allowed
    if (!profile.publicProfileVisibility) {
        const viewerId = locals.user?.id;

        // Owner can always see their own profile
        if (viewerId === profile.id) {
            return { profile };
        }

        // Check if viewer is organizer or admin
        if (viewerId) {
            const viewerRoles = await prisma.roleAssignment.findMany({
                where: { userId: viewerId },
                select: { role: true }
            });

            const isPrivileged = viewerRoles.some(
                (r) => r.role === Role.ORGANIZER || r.role === Role.ADMIN
            );

            if (isPrivileged) {
                return { profile };
            }
        }

        throw error(403, { message: 'This profile is private' });
    }

    return { profile };
};
