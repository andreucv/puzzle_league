import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchUsers } from '$lib/database/db_user';

export const GET: RequestHandler = async (event) => {
    const query = event.url.searchParams.get('q');

    if (!query || query.length < 2) {
        return json({ users: [] });
    }

    try {
        const users = await searchUsers(query, 20);
        return json({ users });
    } catch (error) {
        console.error('Error searching users:', error);
        return json({ users: [], error: 'Failed to search users' }, { status: 500 });
    }
};
