import { BASE_API_URI_ENV } from "$env/static/private";
import { fetch_get_from_url } from "$lib/utils";
import { authStore } from "../../stores/authStore";
import { get } from 'svelte/store';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({locals}) => {
    // This is the backend token that we will use
    // console.log('profile +page.server.ts: locals', locals);
	// const backend_token = get(authStore).backend_token;
    // console.log('profile +page.server.ts: backend_token', backend_token);
    // const participant_data = fetch_get_from_url('api/puzzles/participants/get_participant', backend_token);
	
    // return {
	// 	participant: participant_data
	// };
};