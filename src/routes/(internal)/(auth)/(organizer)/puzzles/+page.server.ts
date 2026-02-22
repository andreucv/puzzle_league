import type { PageServerLoad } from './$types';
import { getPuzzles } from '$lib/database/database';

export const load: PageServerLoad = async () => {
    const puzzles = await getPuzzles();
    return {
        props: { puzzles }
    };
};
