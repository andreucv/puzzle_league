import { writable } from "svelte/store";
import { firebaseAuth } from "$lib/firebase/client";

export const authStore = writable({
    isLoading: true,
    user: null,
})

// export const authHandlers = {
//     signup: async (email, password) => {
//         try {
//             const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
//             const user = userCredential.user;
//             authStore.set({ isLoading: false, user });
//         } catch (error) {
//             authStore.set({ isLoading: false, error });
//         }
//     },
//     logout: async () => {
//         try {
//             await firebaseAuth.signOut();
//             authStore.set({ isLoading: false, user: null });
//         } catch (error) {
//             authStore.set({ isLoading: false, error });
//         }
//     },

// }