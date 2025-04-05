import { writable, get } from "svelte/store";
import { goto, invalidateAll } from "$app/navigation";

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerId: string;
}

export interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  backend_token: string | null;
  error: string | null;
}

const initialState: AuthState = {
  isLoading: true,
  isAuthenticated: false,
  user: null,
  backend_token: null,
  error: null
};

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initialState);

  return {
    subscribe,
    setUser: (user: User | null) => {
      update(state => ({
        ...state,
        isLoading: false,
        isAuthenticated: !!user,
        user
      }));
    },
    setToken: (token: string | null) => {
      update(state => ({
        ...state,
        backend_token: token
      }));
    },
    setError: (error: string | null) => {
      update(state => ({
        ...state,
        error
      }));
    },
    startLoading: () => {
      update(state => ({
        ...state,
        isLoading: true
      }));
    },
    stopLoading: () => {
      update(state => ({
        ...state,
        isLoading: false
      }));
    },
    logout: async () => {
      try {
        // Call the server to clear the session cookie
        await fetch("/login", {
          method: "DELETE"
        });

        // Reset the store
        set(initialState);

        // Invalidate all data and redirect to home
        await invalidateAll();
        await goto("/");
      } catch (error) {
        console.error("Logout error:", error);
      }
    },
    resetState: () => set(initialState)
  };
}

export const authStore = createAuthStore();
