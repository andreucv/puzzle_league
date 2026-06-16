// Shared test fixtures — one source of truth for the domain shapes that were duplicated across
// suites with drifting fields. Each factory returns a plain object with sensible defaults and a
// shallow `overrides` merge.
//
// Scope note: only genuinely *duplicated* shapes live here. Single-use, suite-specific shapes
// (e.g. the component-render category in CategoryCard, the presentation competition in home-page,
// the registration-workflow domain entities) stay colocated with their suite — centralising a
// one-consumer fixture adds coupling without removing duplication.
//
// These are partial projections of Prisma models (with selected relations like
// `category.competition`), not full model rows, so they are intentionally loosely typed; call
// sites that feed them to strictly-typed functions cast at that boundary.

/**
 * Entry as returned by the registration confirm/refuse routes and consumed by the registration
 * notification builders: the entry plus its participants and the category→competition relation.
 * Shared by `confirm`, `refuse`, and `registration_notifications`.
 */
export function makeEntryData(overrides: Record<string, unknown> = {}) {
	return {
		id: 'entry-1',
		creatorId: 'user-1',
		users: [{ id: 'user-1', name: 'Alice' }],
		externalParticipants: [],
		category: {
			competitionId: 42,
			description: 'Individual',
			subname: null,
			type: 'INDIVIDUAL',
			competition: { name: 'Speed Cup' },
		},
		...overrides,
	};
}

/**
 * Competition row as listed by the "other upcoming competitions" query: the discovery shape with
 * its (optionally reserved-slot-counted) categories. Shared by `db_competition_other_upcoming`
 * and the `other-upcoming` API route suite.
 */
export function makeUpcomingCompetition(overrides: Record<string, unknown> = {}) {
	return {
		id: 1,
		name: 'Test Competition',
		startDate: new Date('2026-07-01'),
		status: 'NOT_STARTED',
		categories: [],
		...overrides,
	};
}
