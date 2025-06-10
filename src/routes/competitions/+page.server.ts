import type { PageServerLoad } from "./$types";
export const load: PageServerLoad = async (event) => {

    const upcoming_competitions = [];
    const past_competitions = [];
    console.log("upcoming_competitions", upcoming_competitions);
    console.log("past_competitions", past_competitions);
    return {
        props: {
            upcoming_competitions,
            past_competitions
        }
    }
}
