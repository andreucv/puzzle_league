// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { User, Session } from '@prisma/client';

declare global {
    namespace App {
        // interface Error {}
        // interface PageData {}
        // interface PageState {}
        // interface Platform {}
        interface User {
            id: string;
            name: string;
            email: string;
            emailVerified: boolean;
            image?: string;
            createdAt: Date;
            updatedAt: Date;
            rolesAssigned: string[];
        }
    }
}

export {};
