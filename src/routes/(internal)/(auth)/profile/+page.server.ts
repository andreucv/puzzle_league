import type { PageServerLoad, Actions } from './$types';
import { prisma } from '$lib/database/database';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        return { user: null, account: null };
    }

    const user = await prisma.user.findUnique({
        where: { id: locals.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
            image: true,
            country: true,
            postalCode: true,
            createdAt: true,
            updatedAt: true
        }
    });

    const account = await prisma.account.findFirst({
        where: { userId: locals.user.id },
        select: { providerId: true }
    });

    return {
        user,
        account: account ? { provider: account.providerId } : { provider: 'credential' }
    };
};

export const actions: Actions = {
    updateLocation: async ({ request, locals }) => {
        const user = locals.user;
        if (!user) {
            return fail(401, { message: 'Unauthorized' });
        }

        const formData = await request.formData();
        const country = formData.get('country')?.toString().trim() || null;
        const postalCode = formData.get('postalCode')?.toString().trim() || null;

        try {
            await prisma.user.update({
                where: { id: user.id },
                data: { country, postalCode, updatedAt: new Date() }
            });

            return { success: true };
        } catch (error) {
            console.error('Error updating location:', error);
            return fail(500, { message: 'Failed to update location' });
        }
    }
};
