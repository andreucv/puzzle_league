import { getFirebaseAdmin } from "$lib/firebase/admin";
import { redirect } from "@sveltejs/kit";
import { createSession, deleteSession } from "$lib/database";
import { randomUUID } from "crypto";

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }: { request: Request, cookies: any }) {
    const body = (await request.json()) as { idToken: string | undefined };
    if (!body.idToken) {
        console.info("No idToken found");
        throw redirect(303, "/login");
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const admin = getFirebaseAdmin();

    try {
        // Verify the ID token first
        const decodedToken = await admin.auth().verifyIdToken(body.idToken);
        const uid = decodedToken.uid;

        // Generate a unique session ID
        const sessionId = randomUUID();

        // Create a session in our local database
        await createSession(sessionId, uid, expiresIn);

        // Set session cookie options
        const options = {
            maxAge: expiresIn,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Only secure in production
            path: '/',
            sameSite: "strict",
        };

        // Set the session cookie
        cookies.set('session', sessionId, options);

        return new Response(JSON.stringify({ success: true, uid }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("Error creating session", error);
        return new Response(JSON.stringify({ error: "Authentication failed" }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ cookies }) {
    try {
        const sessionId = cookies.get('session');

        if (sessionId) {
            // Delete the session from our database
            await deleteSession(sessionId);
        }

        // Clear the session cookie
        cookies.delete('session', { path: '/' });

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("Error logging out:", error);
        return new Response(JSON.stringify({ error: "Logout failed" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
