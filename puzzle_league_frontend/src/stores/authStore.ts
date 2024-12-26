import { writable } from "svelte/store";

export const authStore = writable({
    isLoading: true,
    user: null,
})