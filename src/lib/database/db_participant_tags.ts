import { prisma } from '$lib/database/create_prisma_client';
import { EntryTagStatus, ParticipantTagType } from '$lib/.prisma/generated/prisma/enums';

// ---------------------------------------------------------------------------
// Participant tags are a fixed enum (ParticipantTagType). There is no tag
// "model" to create: an organizer makes a tag claimable in a category by
// adding a TagCategory row (optionally with a price override). That row is the
// single source of truth for what participants can claim at registration.
// ---------------------------------------------------------------------------

export const PARTICIPANT_TAG_TYPES = Object.values(ParticipantTagType);

export function isParticipantTagType(value: unknown): value is ParticipantTagType {
	return typeof value === 'string' && (PARTICIPANT_TAG_TYPES as string[]).includes(value);
}

export interface AvailableTag {
	tag: ParticipantTagType;
	priceOverride: number | null;
}

/**
 * Tags claimable per category for a competition (availability = a TagCategory
 * row exists). Returns a plain object keyed by categoryId (serialization-friendly
 * for SvelteKit load). Shaped for the registration form and results filter.
 */
export async function getAvailableTagsByCategory(competitionId: number): Promise<Record<number, AvailableTag[]>> {
	const rows = await prisma.tagCategory.findMany({
		where: { category: { competitionId } },
		select: { categoryId: true, tag: true, priceOverride: true },
		orderBy: { tag: 'asc' },
	});

	const byCategory: Record<number, AvailableTag[]> = {};
	for (const row of rows) {
		(byCategory[row.categoryId] ??= []).push({ tag: row.tag, priceOverride: row.priceOverride });
	}
	return byCategory;
}

/** True when a tag is claimable in a category (a TagCategory row exists). */
export async function isTagClaimableInCategory(tag: ParticipantTagType, categoryId: number): Promise<boolean> {
	const row = await prisma.tagCategory.findUnique({
		where: { tag_categoryId: { tag, categoryId } },
		select: { tag: true },
	});
	return !!row;
}

export { EntryTagStatus, ParticipantTagType };
