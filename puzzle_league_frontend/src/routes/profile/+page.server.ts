import { fetch_get_from_url } from "$lib/api_utils";
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({locals}) => {
    console.log('profile +page.server.ts: locals', locals);
	const token = locals.token;
    const participant_data = await fetch_get_from_url('api/puzzles/participants/get_participant/', token);
	console.log('profile +page.server.ts: participant_data', participant_data);

    return {
		participant: participant_data
	};
};