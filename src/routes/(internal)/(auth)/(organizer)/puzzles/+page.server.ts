import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getPuzzles } from '$lib/database/db_puzzle';

export const load: PageServerLoad = async () => {
    try {
        const puzzles = await getPuzzles();
        return {
            props: { puzzles }
        };
    } catch (err) {
        console.error('Error loading puzzles:', err);
        throw error(500, { message: 'Unable to load puzzles. Please try again later.', code: 'DB_ERROR' });
    }
};
