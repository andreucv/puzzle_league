/**
 * Client-safe category model for the competition create/edit form.
 *
 * Lives apart from `competition-form.ts` because that module imports
 * `$env/static/private` + cloudinary (server-only). The page is a client
 * component, so the single-source-of-truth category model and the submit-time
 * payload builder live here instead.
 *
 * The datetime resolution intentionally runs on the client (organizer's browser
 * timezone via `getLocalTimeZone()`), preserving the behaviour of the former
 * `buildCategoryDateTime`. The Prisma `puzzleIds`/`tagCategories` transforms stay
 * on the server (`transformPuzzleIds`/`transformTagCategories`): they must run
 * *after* Zod validation, so they cannot be folded in here where the payload is
 * built before the request is validated.
 */
import {
	CalendarDate,
	Time,
	toCalendarDateTime,
	fromDate,
	getLocalTimeZone
} from '@internationalized/date';
import type { CategoryErrors } from '$lib/utils/competition_form_validation';

export interface TagCategoryDraft {
	tag: string;
	priceOverride: number | null;
}

/**
 * A single rich category row. One array of these is the single source of truth
 * for the categories editor; the Prisma `{ create, update, delete }` payload is
 * derived from it once at submit by `buildCategoriesPayload`.
 */
export interface CategoryDraft {
	/** 'existing' rows came from the DB (carry `id`); 'new' rows are added in the form. */
	origin: 'existing' | 'new';
	/** DB id for existing rows. */
	id?: number;
	/** Marks an existing row scheduled for deletion (kept in the array, not rendered). */
	removed?: boolean;

	description: string;
	subname?: string | null;
	type: string;
	/** Wall-clock "HH:MM" strings; combined with the dates at submit. */
	startTime: string;
	endTime: string;
	/** Day the category starts / ends on (multi-day); the single competition date otherwise. */
	startDate: CalendarDate | null;
	endDate: CalendarDate | null;
	maxParties: number | null;
	maxPartySize: number | null;
	price: number | null;
	status?: string;
	puzzleIds: string[];
	/** Full puzzle objects hydrated on load, fed to PuzzleLinkSection as initial values. */
	puzzles?: unknown[];
	tagCategories: TagCategoryDraft[];
	/** Transient per-field validation messages for display. */
	errors: CategoryErrors;
}

export interface CategoriesPayload {
	create: Record<string, unknown>[];
	update: { where: { id: number }; data: Record<string, unknown> }[];
	delete: { id: number }[];
}

/**
 * Combine a calendar day with a "HH:MM" wall-clock time into an absolute
 * ISO string, using the local (browser) timezone. Returns '' when either part
 * is missing so the Zod `min(1)` guard catches incomplete rows.
 */
export function resolveCategoryDateTime(date: CalendarDate | null, time: string): string {
	if (!date || !time) return '';
	const tz = getLocalTimeZone();
	const [hours, minutes] = time.split(':').map((p) => parseInt(p, 10));
	const dateTime = toCalendarDateTime(date, new Time(hours, minutes));
	const jsDate = dateTime.toDate(tz);
	return fromDate(jsDate, tz).toAbsoluteString();
}

function toCategoryData(draft: CategoryDraft): Record<string, unknown> {
	return {
		description: draft.description,
		subname: draft.subname ?? null,
		type: draft.type,
		startTime: resolveCategoryDateTime(draft.startDate, draft.startTime),
		endTime: resolveCategoryDateTime(draft.endDate, draft.endTime),
		maxParties: draft.maxParties,
		maxPartySize: draft.maxPartySize,
		price: draft.price,
		status: draft.status ?? 'NOT_STARTED',
		puzzleIds: draft.puzzleIds ?? [],
		tagCategories: draft.tagCategories ?? []
	};
}

/**
 * Derive the Prisma nested-write `{ create, update, delete }` payload from the
 * draft list. Existing rows flagged `removed` go to `delete`; remaining existing
 * rows go to `update` (keyed by `id`); new rows go to `create`.
 */
export function buildCategoriesPayload(categories: CategoryDraft[]): CategoriesPayload {
	const payload: CategoriesPayload = { create: [], update: [], delete: [] };

	for (const draft of categories) {
		if (draft.origin === 'existing' && draft.removed) {
			if (draft.id != null) payload.delete.push({ id: draft.id });
			continue;
		}
		if (draft.removed) continue;

		if (draft.origin === 'new') {
			payload.create.push(toCategoryData(draft));
		} else if (draft.id != null) {
			payload.update.push({ where: { id: draft.id }, data: toCategoryData(draft) });
		}
	}

	return payload;
}
