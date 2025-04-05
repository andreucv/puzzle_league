import type { PageServerLoad } from './$types';
import { updateUserProfile } from '$lib/database';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
    const user = locals.user;

    if (!user) {
        throw error(401, 'Unauthorized - Please log in');
    }

    try {
        // User data is already loaded in the locals, including the profile
        return {
            profile: user.profile,
            user
        };
    } catch (err) {
        console.error('Error loading profile:', err);
        throw error(500, 'Failed to load profile data');
    }
};

// Handle profile updates
export const actions = {
    updateProfile: async ({ request, locals }) => {
        const user = locals.user;

        if (!user) {
            throw error(401, 'Unauthorized');
        }

        const formData = await request.formData();
        const displayName = formData.get('displayName')?.toString();
        const bio = formData.get('bio')?.toString();
        const country = formData.get('country')?.toString() || null;
        const publicProfile = formData.get('publicProfile') === 'on';
        const publicRanking = formData.get('publicRanking') === 'on';
        const publicPoints = formData.get('publicPoints') === 'on';

        try {
            const profileData = {
                displayName,
                bio,
                country,
                publicProfile,
                publicRanking,
                publicPoints
            };

            await updateUserProfile(user.id, profileData);

            return { success: true };
        } catch (err) {
            console.error('Error updating profile:', err);
            return {
                success: false,
                error: 'Failed to update profile'
            };
        }
    }
};
