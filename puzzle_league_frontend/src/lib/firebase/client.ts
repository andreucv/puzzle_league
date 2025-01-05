import { goto, invalidateAll } from "$app/navigation";
import { PUBLIC_FIREBASE_API_KEY, PUBLIC_FIREBASE_AUTH_DOMAIN } from "$env/static/public";
import { initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";

export function getFirebaseClient() {
    const firebaseConfig = {
        apiKey: PUBLIC_FIREBASE_API_KEY,
        authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
    };
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    void setPersistence(auth, browserLocalPersistence);
    return auth;
}