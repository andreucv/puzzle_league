import { BASE_API_URI_ENV } from "$env/static/private";
import { json } from '@sveltejs/kit';

export async function POST(event) {
    const { token } = await event.request.json();
    const response = await fetch(`${BASE_API_URI_ENV}/api/auth/login/`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
    });

    const body = await response.json();
    console.log('send_token_to_backend response', body);
    return json(body)
}