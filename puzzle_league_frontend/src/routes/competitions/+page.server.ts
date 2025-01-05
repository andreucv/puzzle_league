import type { PageServerLoad } from "./$types";
import { fetch_get_from_url } from "$lib/api_utils";

export const load: PageServerLoad = async (event) => {

    const upcoming_competitions = await fetch_get_from_url('api/puzzles/competitions/get_competitions_and_categories_upcoming/');
    const past_competitions = await fetch_get_from_url('api/puzzles/competitions/get_competitions_and_categories_past/');
    console.log("upcoming_competitions", upcoming_competitions);
    console.log("past_competitions", past_competitions);
    return {
        props: {
            upcoming_competitions,
            past_competitions
        }
    }
}