import {
    PUBLIC_FIREBASE_API_KEY,
    PUBLIC_FIREBASE_AUTH_DOMAIN,
    PUBLIC_FIREBASE_PROJECT_ID,
    PUBLIC_FIREBASE_STORAGE_BUCKET,
    PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    PUBLIC_FIREBASE_APP_ID,
    PUBLIC_FIREBASE_MEASUREMENT_ID
} from '$env/static/public';

import { initializeApp, getApps, getApp, deleteApp, type FirebaseApp } from 'firebase/app';
import { getAuth, onIdTokenChanged,
    signInWithEmailAndPassword as _signInWithEmailAndPassword,
    signInWithRedirect, GoogleAuthProvider,
    signOut as _signOut,
    createUserWithEmailAndPassword,
    signInWithPopup
} from 'firebase/auth';

import { authStore } from '../../stores/authStore';
import { invalidateAll } from '$app/navigation';
import { browser } from '$app/environment';

const firebaseConfig = {
    apiKey: PUBLIC_FIREBASE_API_KEY,
    authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: PUBLIC_FIREBASE_APP_ID,
    measurementId: PUBLIC_FIREBASE_MEASUREMENT_ID
};

function listenForAuthChanges() {
    const firebaseAuth = getAuth();

    onIdTokenChanged(firebaseAuth, async (newUser) => {
        if (newUser) {
            console.log('User signed in', newUser);
            authStore.set({ isLoading: false, user: newUser});
        } else {
            console.log('User signed out');
            authStore.set({ isLoading: false, user: null });
        }
        await invalidateAll();
    });
}
// Initialize Firebase
export let firebaseApp: FirebaseApp;

export function initializeFirebase() {
    if (!browser) {
        throw new Error('Cannot use the Firebase client on the server side');
    }

    if (!firebaseApp) {
        firebaseApp = initializeApp(firebaseConfig);
        listenForAuthChanges();
    }
}

// Functions to interact with Firebase Auth
export async function signInWithEmailAndPassword(email, password) {
    const firebaseAuth = getAuth();

    try {
        await _signInWithEmailAndPassword(firebaseAuth, email, password);
    } catch (error) {
        console.error(error);
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