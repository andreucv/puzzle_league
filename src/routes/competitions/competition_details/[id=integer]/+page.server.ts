import type { PageServerLoad } from "../$types";
import { getCompetitionWithCategories } from "$lib/database";
let competition_details = undefined;

// import { v2 as cloudinary } from "cloudinary";
// import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from '$env/static/private'

// cloudinary.config({
//     cloud_name: CLOUDINARY_CLOUD_NAME,
//     api_key: CLOUDINARY_API_KEY,
//     api_secret: CLOUDINARY_API_SECRET,
//     secure: false
// });

export const load: PageServerLoad = async ( event ) => {
    const competition_id = event.url.pathname.split('/')[3];
    const competition_and_categories = await getCompetitionWithCategories(parseInt(competition_id));
    const image_url = undefined; //await cloudinary.url(competition_and_categories.image);
    console.log(`competitions/competition_details/${competition_id} competition_categories`, competition_and_categories);
    return {
        props:
        {
            competition_and_categories,
            image_url,
        }
    }
}
