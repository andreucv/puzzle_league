import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchPuzzles } from '$lib/database/db_puzzle';

export const GET: RequestHandler = async ({ url }) => {
    try {
        const query = url.searchParams.get('q') || '';
        if (query.length < 1) {
            return json([]);
        }

        const puzzles = await searchPuzzles(query);
        return json(puzzles);
    } catch (error) {
        console.error('Error searching puzzles:', error);
        return json({ error: 'Failed to search puzzles' }, { status: 500 });
    }
};
