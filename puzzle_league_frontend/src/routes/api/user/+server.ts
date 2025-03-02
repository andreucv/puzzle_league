import { error, json } from '@sveltejs/kit';
import { createUserRecord, getUserById } from '$lib/database';
import { getFirebaseAdmin } from '$lib/firebase/admin';

export async function POST({ request }) {
    try {
        // Get the request body containing user data and token
        const body = await request.json();
        const { idToken, userData } = body;

        if (!idToken) {
            throw error(400, { message: 'Missing ID token' });
        }

        if (!userData || !userData.uid || !userData.email) {
            throw error(400, { message: 'Missing user data' });
        }

        // Verify the token
        const admin = getFirebaseAdmin();
        const decodedToken = await admin.auth().verifyIdToken(idToken);

        // Ensure the UID in the token matches the one in the request
        if (decodedToken.uid !== userData.uid) {
            throw error(403, { message: 'Token UID mismatch' });
        }

        // Check if the user exists
        const existingUser = await getUserById(decodedToken.uid);

        if (existingUser) {
            // User exists, return user data
            return json({
                success: true,
                exists: true,
                user: existingUser
            });
        } else {
            // User doesn't exist, create a new user record
            const newUser = await createUserRecord({
                uid: decodedToken.uid,
                email: userData.email,
                displayName: userData.displayName || null,
                photoURL: userData.photoURL || null,
                providerId: userData.providerId || 'password'
            });

            return json({
                success: true,
                exists: false,
                user: newUser
            });
        }
    } catch (err) {
        console.error('Error processing user data:', err);

        // Return proper error based on the type
        if (err.status) {
            // It's already a SvelteKit error
            throw err;
        } else if (err.code && err.code.includes('auth/')) {
            // Firebase auth error
            throw error(401, { message: err.message || 'Authentication error' });
        } else {
            // Generic server error
            throw error(500, { message: 'Failed to process user data' });
        }
    }
}