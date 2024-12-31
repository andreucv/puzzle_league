import type { PageServerLoad } from "../$types";
import { fetch_get_from_url } from '$lib/utils';

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
    const competition_id = event.url.pathname.split('/')[2];
    const competition_and_categories = await fetch_get_from_url(`api/puzzles/competitions/${competition_id}/get_categories/`);
    const image_url = undefined; //await cloudinary.url(competition_and_categories.image);
    console.log('competition_categories', competition_and_categories);
    console.log('image_url', image_url);
    return {
        props:
        {
            competition_and_categories,
            image_url,
        }
    }
}