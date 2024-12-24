import { createUserWithEmailAndPassword, signInWithCredential, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithCustomToken, signInWithRedirect } from "firebase/auth"
import { firebaseAuth } from "$lib/firebase/client";

export const auth_helpers = {
    login: async (email, password) => {
        try {
            console.log(firebaseAuth, email, password);
            await signInWithEmailAndPassword(firebaseAuth, email, password);
        } catch (error) {
            console.error(error);
        }
    },
    register: async (email, password) => {
        try {
            await createUserWithEmailAndPassword(firebaseAuth, email, password);
        } catch (error) {
            console.error(error);
        }
    },
    logout: async () => {
        try {
            await signOut(firebaseAuth);
        } catch (error) {
            console.error(error);
        }
    },
    with_google: async () => {
        try {
            const googleAuthProvider = new GoogleAuthProvider();
            await signInWithRedirect(firebaseAuth, googleAuthProvider);
        } catch (error) {
            console.error(error);
        }
    }
}