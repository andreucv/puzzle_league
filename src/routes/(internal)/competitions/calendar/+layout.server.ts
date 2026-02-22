import { getMonthCompetitions } from '$lib/database/database';

export const load = async () => {
    const date = new Date();
    const month = date.getMonth();
    const year = date.getFullYear();
    const competitions = await getMonthCompetitions(month, year);

    return {
        competitions
    };
};
