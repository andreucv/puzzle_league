/**
 * Capacity "fill level" for a capped category, derived purely from the reserved
 * count and the maximum. Kept free of any UI/styling concern so it can be unit
 * tested directly; consumers map the level to their own presentation (e.g. a
 * progress-bar colour). Overbooking is treated as full — there is no separate
 * "overbooked" level, mirroring the label which clamps to `max`.
 */
export type CapacityLevel = 'available' | 'low' | 'full';

/** Number of spots remaining, never negative. */
export function spotsLeft(count: number, max: number): number {
	return Math.max(0, max - count);
}

/**
 * - `full`      — no spots left (count >= max, including overbooked)
 * - `low`       — 3 or fewer spots left
 * - `available` — more than 3 spots left
 */
export function getCapacityLevel(count: number, max: number): CapacityLevel {
	const left = spotsLeft(count, max);
	if (left <= 0) return 'full';
	if (left <= 3) return 'low';
	return 'available';
}
