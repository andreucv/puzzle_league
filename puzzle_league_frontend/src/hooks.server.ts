import { getFirebaseAdmin } from "$lib/firebase/admin";
import { fetch_get_from_url } from "$lib/api_utils";
import { redirect, type Handle } from "@sveltejs/kit";
import type { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";

export const handle: Handle = async ({ event, resolve }) => {
    const now = performance.now();
    const session = event.cookies.get("session") ?? "";
    console.log("hooks.server.ts: session", session);
    console.log("hooks.server.ts: serving event.url", event.url);
    console.log("hooks.server.ts: serving event.body", event.request.body);
    if (!session || session === "") {
        console.info("No session found");
        event.locals.user = undefined;
        event.locals.token = undefined;
        event.locals.participant = undefined;
    } else {
        let decodedClaims: DecodedIdToken | undefined = undefined;
        try {
            const admin = getFirebaseAdmin();
            decodedClaims = await admin
                .auth()
                .verifyIdToken(session, false);
            console.log("decodedClaims user is ", user);  
        } catch (err) {
            console.error("Error verifying session cookie", err);
            event.locals.user = undefined;
            event.locals.token = undefined;
            event.locals.participant = undefined;
        }

        if (!decodedClaims) {
            console.error("No decoded claims found");
            event.locals.user = undefined;
            event.locals.token = undefined;
            event.locals.participant = undefined;
        } else {
            console.info("User session verified");
            event.locals.user = decodedClaims;
            event.locals.token = session;
            event.locals.participant = await fetch_get_from_url('api/puzzles/participants/get_participant/', session);
            console.log("hooks.server.ts: decodedClaims", decodedClaims);
            console.log("hooks.server.ts: token", session);
            console.log("hooks.server.ts: participant", event.locals.participant);
        }

    }
    // if (event.url.pathname !== "/login" && !event.locals.userSession) {
    //     throw redirect(303, "/login");
    // }

    console.debug(`Request took ${(performance.now() - now).toFixed(1)}ms`);
    return resolve(event);
}
