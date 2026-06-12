/**
 * Shared helpers for registration test seed scripts.
 * Provides DRY category & competition builders and time slot helpers.
 */
import type { CategorySeedInput, CompetitionSeedInput } from '../seed_utils/types';

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
