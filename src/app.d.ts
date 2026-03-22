// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { User, Session } from '@prisma/client';

declare global {
    namespace App {
        interface Error {
            message: string;
            code?: 'AUTH_REQUIRED' | 'FORBIDDEN' | 'NOT_FOUND' | 'DB_ERROR' | 'VALIDATION_ERROR' | 'UNKNOWN';
        }
        interface Locals {
            user?: {
                id: string;
                name: string;
                email: string;
                emailVerified: boolean;
                image?: string | null;
                country?: string | null;
                postalCode?: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
            session?: Session;
        }
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
