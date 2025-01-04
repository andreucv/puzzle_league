import type { LayoutServerLoad } from "./$types";

export const load = (({ locals }) => {
    console.log("layout.server.ts loading locals from load function: ", locals.user);
    return { user: locals.user };
}) satisfies LayoutServerLoad;