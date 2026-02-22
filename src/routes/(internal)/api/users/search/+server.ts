import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUsers } from '$lib/database/database';
import { requireAuth } from '$lib/utils/api_auth';

export const GET: RequestHandler = async (event) => {
    const query = event.url.searchParams.get('q');
    console.log('search users query:', query);

    const auth = await requireAuth(event);
    if (!auth.authorized) return auth.response;

    if (!query || query.length < 2) {
        return json({ users: [] });
    }

    try {
        // Search users by name or email (case-insensitive)
        const users = await getUsers();

        const filteredUsers = users.filter(user => {
            const searchTerm = query.toLowerCase();
            return user.name.toLowerCase().includes(searchTerm) ||
                   user.email.toLowerCase().includes(searchTerm);
        });
        console.log('search users results:', filteredUsers);
        return json({ users: filteredUsers });
    } catch (error) {
        console.error('Error searching users:', error);
        return json({ users: [], error: 'Failed to search users' }, { status: 500 });
    }
};
