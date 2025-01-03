import type { LayoutServerLoad } from "./$types";

export const load = (({ locals }) => {
    console.log(locals);
    return { userSession: locals.user };
}) satisfies LayoutServerLoad;