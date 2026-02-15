import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchPuzzles } from '$lib/database';
import { auth } from '$lib/auth';

export const GET: RequestHandler = async ({ url, request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const query = url.searchParams.get('q') || '';
    if (query.length < 1) {
        return json([]);
    }

    const puzzles = await searchPuzzles(query);
    return json(puzzles);
};
