import { BASE_API_URI_ENV } from "$env/static/private";
import { fetch_get_from_url } from "$lib/utils";
import { authStore } from "../../stores/authStore";
import { get } from 'svelte/store';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({locals}) => {
    console.log('profile +page.server.ts: locals', locals);
	const token = locals.token;
    const participant_data = fetch_get_from_url('api/puzzles/participants/get_participant', token);
	
    return {
		participant: participant_data
	};
};