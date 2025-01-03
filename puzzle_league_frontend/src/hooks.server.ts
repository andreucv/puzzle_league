import { getFirebaseAdmin } from "$lib/firebase/admin";
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
        event.locals.userSession = undefined;
    } else {
        let decodedClaims: DecodedIdToken | undefined = undefined;
        try {
            const admin = getFirebaseAdmin();
            decodedClaims = await admin
                .auth()
                .verifySessionCookie(session, false);
        } catch (err) {
            console.error("Error verifying session cookie", err);
            event.locals.userSession = undefined;
        }
        if (!decodedClaims) {
            console.error("No decoded claims found");
            event.locals.userSession = undefined;
        } else {
            console.info("User session verified");
            event.locals.userSession = decodedClaims;
        }
    }

    // if (event.url.pathname !== "/login" && !event.locals.userSession) {
    //     throw redirect(303, "/login");
    // }

    console.debug(`Request took ${(performance.now() - now).toFixed(1)}ms`);
    return resolve(event);
}
