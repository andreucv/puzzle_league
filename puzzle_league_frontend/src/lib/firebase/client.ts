import {
    PUBLIC_FIREBASE_API_KEY,
    PUBLIC_FIREBASE_AUTH_DOMAIN,
    PUBLIC_FIREBASE_PROJECT_ID,
    PUBLIC_FIREBASE_STORAGE_BUCKET,
    PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    PUBLIC_FIREBASE_APP_ID,
    PUBLIC_FIREBASE_MEASUREMENT_ID
} from '$env/static/public';

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
    getAuth, onAuthStateChanged,
    signInWithEmailAndPassword as _signInWithEmailAndPassword,
    GoogleAuthProvider,
    signOut as _signOut,
    createUserWithEmailAndPassword,
    signInWithPopup,
} from 'firebase/auth';

import { authStore } from '../../stores/authStore';
import { invalidateAll } from '$app/navigation';
import { browser } from '$app/environment';
import { fromStore } from 'svelte/store';

const firebaseConfig = {
    apiKey: PUBLIC_FIREBASE_API_KEY,
    authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: PUBLIC_FIREBASE_APP_ID,
    measurementId: PUBLIC_FIREBASE_MEASUREMENT_ID
};

export function listenForAuthChanges() {
    const firebaseAuth = getAuth();
    
    onAuthStateChanged(firebaseAuth, async (user) => {
        if (user != null) {
            const previous_user = fromStore(authStore).current.user;
            const previous_backend_token = fromStore(authStore).current.backend_token;
            console.log('client.ts: listenForAuthChanges: previous_user', previous_user);
            console.log('client.ts: listenForAuthChanges: previous_backend_token', previous_backend_token);
            if (user.email == previous_user?.email && previous_backend_token != null) {
                // We will login the user with the knox token login endpoint using token
                return;
            }
            const idToken = await user.getIdToken();
            console.log('User signed in', user);
            if (idToken) {
                const result = await fetch('/api/send_token_to_backend', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ token: idToken }),
                });
                console.log('client.ts: listenForAuthChanges: idToken', idToken);
                console.log('client.ts: listenForAuthChanges: result', result);
                const body = await result.json();
                console.log('client.ts: listenForAuthChanges: storing authStore', user, body.token)
                authStore.set({ isLoading: false, user: user, backend_token: body.token });
                localStorage.setItem('auth', JSON.stringify({ user: user, backend_token: body.token }, function(k, v) { return v === undefined ? null : v; }));
            }
        } else {
            console.log('User signed out');
            authStore.set({ isLoading: false, user: null, backend_token: null });
            localStorage.removeItem('auth');
        }
        invalidateAll();
    });
}

// Initialize Firebase
export let firebaseApp: FirebaseApp | undefined;
export let firebaseAuth: Auth;

export function initializeFirebase() {
    if (!browser) {
        throw new Error('Cannot use the Firebase client on the server side');
    }
    if (firebaseApp == undefined && !getApps().length) {
        firebaseApp = initializeApp(firebaseConfig);
    } else {
        firebaseApp = getApps()[0];
    }
    firebaseAuth = getAuth(firebaseApp);
}

// Functions to interact with Firebase Auth
export async function signInWithEmailAndPassword(email, password) {
    const firebaseAuth = getAuth();

    try {
        return await _signInWithEmailAndPassword(firebaseAuth, email, password);
    } catch (error) {
        const _error = await error;
        console.error("FirebaseClient: error", _error);
        throw new Error(_error);
    }
}

export async function registerUserWithEmailAndPassword(email, password) {
    const firebaseAuth = getAuth();

    try {
        await createUserWithEmailAndPassword(firebaseAuth, email, password);
    } catch (error) {
        console.error(error);
    }
}

export async function signInWithGoogle() {
    const firebaseAuth = getAuth();
    try {
        const googleAuthProvider = new GoogleAuthProvider();
        await signInWithPopup(firebaseAuth, googleAuthProvider);
    } catch (error) {
        console.error(error);
    }
}

export async function signOut() {
    const firebaseAuth = getAuth();
    try {
        await _signOut(firebaseAuth);
    } catch (error) {
        console.error(error);
    }
}