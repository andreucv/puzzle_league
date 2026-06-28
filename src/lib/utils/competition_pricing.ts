/**
 * Pay-per-competition pricing (capacity-based) and free-sandbox eligibility.
 *
 * Pure functions, no env access — the unit rate is passed in by the caller
 * (read from server config), so this is reused unchanged by the priming UI
 * (Phase 0), the concierge link (Phase 1), and the automated checkout (Phase 4).
 * See docs/features/pay-per-competition/04-plan.md (P1, F1) and 07-free-tier-policy.md.
 */

/** A ≤10-slot competition is the free test sandbox, not a real event. */
export const FREE_SANDBOX_CAPACITY = 10;

type PricedCategory = { maxParties: number | null };

/**
 * Σ `maxParties` across categories (the billing base). A null `maxParties`
 * counts as 0 here; callers that need a hard price first check
 * `hasCompleteCapacity` — capacity is the billing base, so an incomplete config
 * is a pricing error, not a €0 competition.
 */
export function totalCapacity(categories: PricedCategory[]): number {
	return categories.reduce((sum, c) => sum + (c.maxParties ?? 0), 0);
}

/** True when every category has a usable capacity — required before charging. */
export function hasCompleteCapacity(categories: PricedCategory[]): boolean {
	return categories.length > 0 && categories.every((c) => c.maxParties != null && c.maxParties >= 1);
}

/** enablementPrice = unitRate × Σ maxParties. `unitRate` is euros per slot. */
export function enablementPrice(categories: PricedCategory[], unitRate: number): number {
	return totalCapacity(categories) * unitRate;
}

/**
 * F1 — free-sandbox eligibility. A competition whose total capacity is within
 * the sandbox cap may be claimed as the account's one free ≤10-slot sandbox;
 * anything larger is a real event and pays from edition 1.
 */
export function isFreeEligible(categories: PricedCategory[]): boolean {
	return totalCapacity(categories) <= FREE_SANDBOX_CAPACITY;
}
