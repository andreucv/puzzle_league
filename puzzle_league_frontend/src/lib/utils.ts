import { BASE_API_URI_ENV } from "$env/static/private"

export const fetch_get_from_url = async (url: string, token?: string ): Promise<JSON | undefined>=> {
    let fetch_result : Response;
    const fetch_url = `${BASE_API_URI_ENV}/${url}`;
    //console.log("utils.ts fetch_get_from_url fetch_url", fetch_url);
    let authorization_header = {};
    if (token != undefined) {
        authorization_header = {'Authorization' : `Token ${token}`};
    }
    await fetch(fetch_url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...authorization_header
        }
    }).then(result => fetch_result = result);
    if (fetch_result.status > 299) {
        return undefined;
    }
    const json_data = await fetch_result.json();
    return json_data;
}

export const fetch_delete_from_url = async (url: string, token: string): Promise<number | undefined>=> {
    let fetch_result : Response;
    const fetch_url = `${BASE_API_URI_ENV}/${url}`;
    console.log("utils.ts fetch_delete_from_url fetch_url", fetch_url);
    await fetch(fetch_url, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
        }
    }).then(result => fetch_result = result);
    return fetch_result.status;
}

export const fetch_post_from_url = async (url: string, query_body: {}, token: string): Promise<number | undefined>=> {
    let fetch_result : Response;
    const fetch_url = `${BASE_API_URI_ENV}/${url}`;
    console.log("utils.ts fetch_post_from_url fetch_url", fetch_url);
    console.log("QUERYBODY", query_body);
    await fetch(fetch_url, {
        method: 'POST',
        body: JSON.stringify(query_body),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
        }
    }).then(result => fetch_result = result);
    console.log("utils.ts fetch_post_from_url fetch_result", fetch_result);
    return fetch_result;
}

export const fetch_post_no_token_from_url = async (url: string, query_body: {}): Promise<number | undefined>=> {
    let fetch_result : Response;
    const fetch_url = `${BASE_API_URI}/${url}`;
    await fetch(fetch_url, {
        method: 'POST',
        body: JSON.stringify(query_body),
        headers: {
            'Content-Type': 'application/json',
        }
    }).then(result => fetch_result = result);
    console.log('fetch_post_no_token_from_url query ', url, query_body, 'result ', fetch_result);
    return fetch_result;
}

export const fetch_put_from_url = async (url: string, query_body: {}, token: string): Promise<number | undefined>=> {
    let fetch_result : Response;
    const fetch_url = `${BASE_API_URI_ENV}/${url}`;
    console.log("utils.ts fetch_put_from_url fetch_url", fetch_url);
    await fetch(fetch_url, {
        method: 'PUT',
        body: JSON.stringify(query_body),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
        }
    }).then(result => fetch_result = result);
    console.log("utils.ts fetch_put_from_url fetch_result", fetch_result);
    return fetch_result;
}