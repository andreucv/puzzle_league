import type { PageServerLoad } from './$types';
import { getPublicProfile, isPrivilegedViewer } from '$lib/database/db_user';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
    // GDPR: anonymous users must not access public profiles
    if (!locals.user) {
        throw redirect(302, '/login');
    }

    const { userId } = params;

    const profile = await getPublicProfile(userId);

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
            const isPrivileged = await isPrivilegedViewer(viewerId);

            if (isPrivileged) {
                return { profile };
            }
        }

        throw error(403, { message: 'This profile is private' });
    }

    return { profile };
};
