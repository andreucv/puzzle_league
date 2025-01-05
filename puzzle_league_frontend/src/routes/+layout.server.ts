import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load = (({ locals }) => {
    console.log("layout.server.ts loading locals from load function: ", locals.user);
    
    return { 
        user: locals.user,
        participant: locals.participant
    };
}) satisfies LayoutServerLoad;