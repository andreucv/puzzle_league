import { fail, redirect } from '@sveltejs/kit';
import type { Action, Actions, PageServerLoad } from './$types';

import { v2 as cloudinary } from "cloudinary";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from '$env/static/private'
//import { fetch_post_from_url } from '$lib/api_utils';

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: false
});


export const load: PageServerLoad = async ( event ) => {
    const token = event.locals.token;
    // we will create here all the necessary data for the client page to render
    // a competition creation page
}

const create_competition: Action = async ({ locals, request, url }) => {
    const token = locals.token;
    const formData = await request.formData();
    const data = {};

    for (const [name, value] of formData.entries()) {
        if (value instanceof File) {
            data[name] = value;
        } else if (name == 'categories') {
            data[name] = JSON.parse(value);
        } else {
            data[name] = value.toString();
        }
    }

    console.log('data', data);
    console.log('user', locals.user);

    let image_id = undefined;
    if (data.competition_image.size != 0) {
        const buffer = Buffer.from(await (data.competition_image as File).arrayBuffer());
        let upload_image_promise = new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({}, function (error, result) {
                if(error) {
                    reject(error);
                    return;
                }
                console.log('result', result);
                resolve(result);
            }).end(buffer);
        });
        let upload_image_promise_result = await upload_image_promise;
        if (upload_image_promise_result.error) {
            return fail(400, { error_message: "An error occurred while uploading the image. Image upload failed" })
        }
        console.log('upload_image_promise_result', upload_image_promise_result)
        image_id = upload_image_promise_result.public_id;
    }

    let end_date = undefined;
    if (!data.bool_same_day) {
        end_date = data.start_date;
    } else {
        end_date = data.end_date;
    }
    const competition_post_body = {
        name: data.competition_name,
        start_date: new Date(data.start_date).toISOString().split('T')[0],
        end_date: new Date(end_date).toISOString().split('T')[0],
        location: data.location,
        image: image_id,
        created_by: locals.user.pk
    };

    console.log('competition_post_body', competition_post_body);
    const api_post_result = await fetch_post_from_url('api/competitions/', competition_post_body, token);
    const api_post_result_json = await api_post_result.json();
    console.log('api_post_result_json', api_post_result_json)
    if (api_post_result.status != 201) {
        console.log('Submition failed');
        return fail(400, { error_message: "An error occurred while submitting the competition." })
    }
    else {
        console.log('Competition created successfully in backend.');
    }

    // now we create the categories here
    const competition_id = api_post_result_json.pk;
    let count = 0;
    data.categories.forEach(async (category) => {
        console.log('category'+count, category)
        count++;
        const category_post_body = {
            category_type: category.category_type,
            competition: competition_id,
            date: category.date ? category.date : competition_post_body.start_date,
            start_time: category.start_time,
            end_time: category.end_time,
            participation_fee: category.participation_fee,
        }
        console.log('category_post_body', category_post_body);
        const category_post_result = {}; // wait fetch_post_from_url('api/categories/', category_post_body, token);
        const category_post_result_json = await category_post_result.json();
        if (category_post_result.status != 201) {
            console.log('Submition failed');
            return fail(400, { error_message: "An error occurred while submitting the category." })
        }
    });
}

export const actions: Actions = { create_competition }
