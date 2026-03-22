import type { PageServerLoad, Actions } from './$types';
import { prisma } from '$lib/database/database';
import { error, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent }) => {

	const { user } = await parent();

    try {
        const account = await prisma.account.findFirst({
            where: { userId: user.id },
            select: { providerId: true }
        });
        console.log('Loaded account for user:', { user: user, account });
        return {
            account: account ? { provider: account.providerId } : { provider: 'credential' }
        };
    } catch (err) {
        console.error('Error loading profile:', err);
        throw error(500, { message: 'Unable to load your profile. Please try again later.', code: 'DB_ERROR' });
    }
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
        } catch (err) {
            console.error('Error updating location:', err);
            return fail(500, { message: 'Unable to save your location. Please try again.' });
        }
    }
};
