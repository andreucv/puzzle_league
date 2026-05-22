/**
 * Shared helpers for registration test seed scripts.
 * Provides DRY category & competition builders, time slot helpers,
 * competition name constants, and a restore helper.
 */
import type { CategorySeedInput, CompetitionSeedInput } from '../seed_utils/types';
import { createSeedContext } from '../seed_utils';

// ── Time helpers ──

function setTime(base: Date, hour: number): Date {
    const d = new Date(base);
    d.setHours(hour, 0, 0, 0);
    return d;
}

export function getTimeSlots() {
    const now = new Date();
    return {
        now,
        morning: { start: setTime(now, 10), end: setTime(now, 12) },
        afternoon: { start: setTime(now, 14), end: setTime(now, 16) },
    };
}

// ── Category builders ──

interface CategoryOverrides {
    maxParties?: number;
    price?: number;
}

export function individual(
    description: string,
    times: { start: Date; end: Date },
    overrides?: CategoryOverrides,
): CategorySeedInput {
    return {
        description,
        type: 'INDIVIDUAL',
        maxPartySize: 1,
        maxParties: overrides?.maxParties ?? 10,
        startTime: times.start,
        endTime: times.end,
        price: overrides?.price,
    };
}

export function pairs(
    description: string,
    times: { start: Date; end: Date },
    overrides?: CategoryOverrides,
): CategorySeedInput {
    return {
        description,
        type: 'PAIRS',
        maxPartySize: 2,
        maxParties: overrides?.maxParties ?? 10,
        startTime: times.start,
        endTime: times.end,
        price: overrides?.price,
    };
}

// ── Competition builder ──

interface CompetitionOverrides {
    registrationOpen?: boolean;
    showPaymentWarning?: boolean;
}

export function competition(
    creatorId: string,
    name: string,
    description: string,
    categories: CategorySeedInput[],
    overrides?: CompetitionOverrides,
): CompetitionSeedInput {
    const { now } = getTimeSlots();
    return {
        name,
        description,
        location: 'Test Location',
        country: 'ES',
        postalCode: '08001',
        startDate: now,
        endDate: now,
        creatorId,
        registrationOpen: overrides?.registrationOpen ?? true,
        showPaymentWarning: overrides?.showPaymentWarning,
        categories,
    };
}

// ── Competition name constants ──

export const ORGANIZER_COMPETITION_NAMES = [
    'Happy Path Competition',
    'Refuse Test Competition',
    'Waitlist Test Competition',
    'Auto-Confirm Competition',
] as const;

export const PARTICIPANT_COMPETITION_NAMES = [
    'External Participant Individual Competition',
    'Pairs Team Build Competition',
    'Unregister Test Competition',
    'Remove Queued Competition',
    'Multi-Cat Batch Competition',
    'Free With Warning Competition',
] as const;

export const ALL_COMPETITION_NAMES = [
    ...ORGANIZER_COMPETITION_NAMES,
    ...PARTICIPANT_COMPETITION_NAMES,
] as const;

// ── Restore helper ──

export async function restoreCompetitions(names: readonly string[]): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is not set');

    const ctx = await createSeedContext(databaseUrl);
    const { organizer } = ctx.baseUsers;

    await ctx.prisma.competition.deleteMany({
        where: {
            creatorId: organizer.id,
            name: { in: [...names] },
        },
    });

    console.log('✅ Restore complete');
    await ctx.prisma.$disconnect();
}
