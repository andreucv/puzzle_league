import type { PageServerLoad, Actions } from "./$types";
import { getCompetitionWithCategories, getPartiesFromCompetition, removeUserFromCategory } from "$lib/database";
import { auth } from "$lib/auth";

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
    const session = await auth.api.getSession(event.request);
    let signedup_categories = undefined;
    if (session?.user && competition_and_categories) {
        const user_id = session.user.id;
        signedup_categories = await getPartiesFromCompetition(parseInt(competition_id), user_id);
    }
    const image_url = undefined; //await cloudinary.url(competition_and_categories.image);
    console.log(`competitions/competition_details/${competition_id} competition_categories`, competition_and_categories);
    return {
        props:
        {
            competition_and_categories,
            signedup_categories,
            image_url,
        }
    }
}

export const actions: Actions = {
    remove_party: async ({ request }) => {
        const data = await request.formData();
        const category_id = data.get('category_id')?.toString();
        const user_id = data.get('user_id')?.toString();

        if (!category_id || !user_id) {
            return {
                success: false,
                message: 'Missing required fields'
            }
        }

        const result = await removeUserFromCategory(parseInt(category_id), user_id);
        if (result) {
            return {
                success: true,
                message: 'Party removed successfully'
            }
        } else {
            return {
                success: false,
                message: 'Failed to remove party'
            }
        }
    }
}
