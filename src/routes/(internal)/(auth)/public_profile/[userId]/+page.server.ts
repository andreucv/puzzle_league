import type { PageServerLoad } from './$types';
import { prisma } from '$lib/database/create_prisma_client';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
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
            createdAt: true
        }
    });

    if (!profile) {
        throw error(404, { message: 'User not found' });
    }

    return { profile };
};
