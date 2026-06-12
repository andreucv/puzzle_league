import type { PrismaClient } from '../../src/lib/.prisma/generated/prisma/client';

// ── Seed Context ──

/**
 * Shared context passed to every seed step function.
 * Created once per seed.ts execution; provides Prisma access
 * and the env-derived bootstrap user emails.
 */
export interface SeedContext {
    prisma: PrismaClient;
    /**
     * Unique per seed invocation. Seed steps suffix names and emails with it
     * so data from different suites, workers, and runs never collides — this
     * is what allows suites to run fully in parallel without restore scripts.
     */
    runId: string;
    /** Appends the context's runId to a base name. */
    unique: (base: string) => string;
    /** Bootstrap users created during global-setup, fetched at context creation. */
    baseUsers: {
        organizer: SeededUser;
        participant: SeededUser;
        admin: SeededUser;
    };
}

// ── Reusable input shapes for seed steps ──

export interface UserSeedInput {
    id?: string;
    name: string;
    email: string;
    emailVerified?: boolean;
    country?: string;
    postalCode?: string;
}

export interface CategorySeedInput {
    description: string;
    type: 'INDIVIDUAL' | 'PAIRS' | 'TEAM' | 'JUNIOR_INDIVIDUAL' | 'JUNIOR_PAIRS' | 'PUZZLE_CHESS' | 'OTHER';
    maxPartySize: number;
    maxParties: number;
    startTime: Date;
    endTime: Date;
    price?: number;
}

export interface CompetitionSeedInput {
    name: string;
    description: string;
    location: string;
    country: string;
    postalCode: string;
    startDate: Date;
    endDate: Date;
    creatorId: string;
    registrationOpen?: boolean;
    categories: CategorySeedInput[];
    showPaymentWarning?: boolean;
}

export interface EntrySeedInput {
    categoryId: number;
    creatorId: string;
    userIds: string[];
    status: 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'WAITLISTED';
}

export interface AuthUserSeedInput {
    name: string;
    /** Base email — the local part is suffixed with the context runId. */
    email: string;
    password: string;
    /** Optional global role to assign on top of the implicit participant role. */
    role?: 'ORGANIZER' | 'ADMIN';
    /** Mark all onboarding prompts as completed (default true). */
    onboarded?: boolean;
}

// ── Return shapes from seed steps ──

export interface SeededUser {
    id: string;
    name: string;
    email: string;
}

export interface SeededAuthUser extends SeededUser {
    /** Plaintext password, so tests can log in via the `actor` fixture. */
    password: string;
}

export interface SeededCompetition {
    id: number;
    name: string;
    categories: SeededCategory[];
}

export interface SeededCategory {
    id: number;
    description: string;
}

export interface SeededEntry {
    id: string;
    categoryId: number;
    creatorId: string;
}
