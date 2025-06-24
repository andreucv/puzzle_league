import type { PageServerLoad } from "./$types";
import { getAllCompetitions } from "$lib/database";
import type { Competition } from "@prisma/client/wasm";
export const load: PageServerLoad = async (event) => {

    const upcoming_competitions : Competition[] = await getAllCompetitions();
    const past_competitions: Competition[] = [];
    console.log("upcoming_competitions", upcoming_competitions);
    console.log("past_competitions", past_competitions);
    return {
        props: {
            upcoming_competitions,
            past_competitions
        }
    }
}
