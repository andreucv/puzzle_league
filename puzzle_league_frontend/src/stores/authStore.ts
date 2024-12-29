import { writable } from "svelte/store";

interface AuthState {
    isLoading: boolean;
    user: any; // You can replace 'any' with a more specific type if you have one
    backend_token: string | null;
}

const initialState: AuthState = {
    isLoading: true,
    user: null,
    backend_token: null,
}

export const authStore = writable<AuthState>(initialState);