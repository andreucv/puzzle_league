import { prisma } from '$lib/database/create_prisma_client';
import { CategoryStatus } from '$prisma/enums';
import type { PrismaClient } from '$prisma/client';
import { RegistrationWorkflowError } from './registration-workflow';

type Db = Pick<PrismaClient, 'entry'>;

/**
 * The subset of `userIds` holding an Entry in the Category, as party member or creator. Such
 * users cannot register again, so they are never offered a follow nor notified.
 */
export async function userIdsWithEntryInCategory(db: Db, categoryId: number, userIds: string[]): Promise<Set<string>> {
	if (userIds.length === 0) return new Set();
	const entries = await db.entry.findMany({
		where: {
			categoryId,
			OR: [{ creatorId: { in: userIds } }, { users: { some: { id: { in: userIds } } } }],
		},
		select: { creatorId: true, users: { select: { id: true } } },
	});
	const wanted = new Set(userIds);
	const found = new Set<string>();
	for (const entry of entries) {
		for (const id of [entry.creatorId, ...entry.users.map((u) => u.id)]) {
			if (wanted.has(id)) found.add(id);
		}
	}
	return found;
}

/**
 * Follow a closed, NOT_STARTED Category to be notified when its registration opens. Following
 * again re-arms a previously notified follow (`notifiedAt` reset to null). Callers check that
 * follower notification is available (QStash configured) first.
 */
export async function followCategory({ categoryId, userId }: { categoryId: number; userId: string }): Promise<void> {
	const category = await prisma.category.findUnique({
		where: { id: categoryId },
		select: { status: true, registrationOpen: true },
	});
	if (!category) {
		throw new RegistrationWorkflowError('ENTRY_NOT_FOUND', 'Category not found');
	}
	if (category.status !== CategoryStatus.NOT_STARTED || category.registrationOpen) {
		throw new RegistrationWorkflowError('INVALID_STATUS', 'Only closed, not-started categories can be followed');
	}
	if ((await userIdsWithEntryInCategory(prisma, categoryId, [userId])).size > 0) {
		throw new RegistrationWorkflowError('INVALID_STATUS', 'You are already registered in this category');
	}

	await prisma.categoryFollow.upsert({
		where: { userId_categoryId: { userId, categoryId } },
		create: { userId, categoryId },
		update: { notifiedAt: null },
	});
}

/** Stop following a Category. Idempotent; this is the only path that deletes a follow. */
export async function unfollowCategory({ categoryId, userId }: { categoryId: number; userId: string }): Promise<void> {
	await prisma.categoryFollow.deleteMany({ where: { userId, categoryId } });
}

/** The viewer's pending follows (not yet notified) among a Competition's Categories. */
export async function getPendingFollowedCategoryIds(competitionId: number, userId: string): Promise<number[]> {
	const follows = await prisma.categoryFollow.findMany({
		where: { userId, notifiedAt: null, category: { competitionId } },
		select: { categoryId: true },
	});
	return follows.map((f) => f.categoryId);
}
