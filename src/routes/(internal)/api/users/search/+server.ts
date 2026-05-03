import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUsers } from '$lib/database/db_user';

export const GET: RequestHandler = async (event) => {
    const query = event.url.searchParams.get('q');

    if (!query || query.length < 2) {
        return json({ users: [] });
    }

    try {
        const users = await getUsers();

        const filteredUsers = users.filter(user => {
            const searchTerm = query.toLowerCase();
            return user.name.toLowerCase().includes(searchTerm) ||
                   user.email.toLowerCase().includes(searchTerm);
        });
        return json({ users: filteredUsers });
    } catch (error) {
        console.error('Error searching users:', error);
        return json({ users: [], error: 'Failed to search users' }, { status: 500 });
    }
};
