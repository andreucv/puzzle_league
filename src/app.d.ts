// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { User, Session } from '@prisma/client';
import type { CategoryType } from '$lib/.prisma/generated/prisma/browser';

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
                phonePrefix?: string | null;
                phoneNumber?: string | null;
                phonePromptLastChecked?: Date | null;
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

        // Competition results page interfaces
        interface ResultPuzzleData {
            id: string;
            name: string | null;
            pieces: number;
            brand: string;
            image_cld_id: string | null;
        }
        interface ResultRecordUser {
            id: string;
            name: string;
            image: string | null;
        }
        interface ResultUserIntent {
            id: string;
            name: string;
        }
        interface ResultRecord {
            id: string;
            finishTime: Date | null;
            tableNumber: number | null;
            nPiecesCompleted: number | null;
            users: ResultRecordUser[];
            userIntents: ResultUserIntent[];
        }
        interface ResultCategory {
            id: number;
            description: string;
            subname: string | null;
            type: CategoryType;
            realStartTime: Date | null;
            realEndTime: Date | null;
            puzzles: ResultPuzzleData[];
            records: ResultRecord[];
        }
    }
}

export {};
