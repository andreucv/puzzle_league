import { getMonthCompetitions } from '$lib/database/db_competition';

export const load = async () => {
    const date = new Date();
    const month = date.getMonth();
    const year = date.getFullYear();
    const competitions = await getMonthCompetitions(month, year);

    return {
        competitions
    };
};
