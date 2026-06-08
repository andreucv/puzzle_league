import { prisma } from '$lib/database/create_prisma_client';
import { Role } from '$lib/.prisma/generated/prisma/enums';
import type { PrismaClient } from '$lib/.prisma/generated/prisma/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CompetitionAccess = {
	isCreator: boolean;
	isAdmin: boolean;
	isCoorganizer: boolean;
	isJudge: boolean;
	judgedCategoryIds: number[];
	canManageCompetition: boolean; // convenience: isCreator || isAdmin || isCoorganizer
};

type PrismaLike = Pick<PrismaClient, 'competition' | 'roleAssignment' | 'competitionCoorganizerRoleAssignment' | 'categoryJudgeAssignment' | 'category' | 'entry'>;

// ---------------------------------------------------------------------------
// Core query — single entry point for competition-level access
// ---------------------------------------------------------------------------

export async function getCompetitionAccess(
	competitionId: number,
	userId: string,
	client: PrismaLike = prisma,
): Promise<CompetitionAccess> {
	const [competition, adminRole, scopedOrganizer, judgedCategories] = await Promise.all([
		client.competition.findUnique({
			where: { id: competitionId },
			select: { creatorId: true },
		}),
		client.roleAssignment.findFirst({
			where: { userId, role: Role.ADMIN },
			select: { id: true },
		}),
		client.competitionCoorganizerRoleAssignment.findFirst({
			where: { userId, competitionId },
			select: { id: true },
		}),
		client.categoryJudgeAssignment.findMany({
			where: { userId, category: { competitionId } },
			select: { categoryId: true },
		}),
	]);

	const isCreator = competition?.creatorId === userId;
	const isAdmin = !!adminRole;
	const isCoorganizer = !!scopedOrganizer;
	const canManageCompetition = isCreator || isAdmin || isCoorganizer;
	const isJudge = judgedCategories.length > 0;

	return {
		isCreator,
		isAdmin,
		isCoorganizer,
		isJudge,
		judgedCategoryIds: judgedCategories.map((a) => a.categoryId),
		canManageCompetition,
	};
}

// ---------------------------------------------------------------------------
// Guard helpers — throw 403 Response when access is denied
// ---------------------------------------------------------------------------

export async function requireCompetitionOrganizer(
	competitionId: number,
	userId: string,
	client?: PrismaLike,
): Promise<CompetitionAccess> {
	const access = await getCompetitionAccess(competitionId, userId, client);
	if (!access.canManageCompetition) {
		throw forbiddenResponse();
	}
	return access;
}

export async function requireCategoryJudge(
	categoryId: number,
	userId: string,
	client: PrismaLike = prisma,
): Promise<CompetitionAccess> {
	const category = await client.category.findUnique({
		where: { id: categoryId },
		select: { competitionId: true, judgeAssignments: { where: { userId }, select: { id: true } } },
	});

	if (!category) {
		throw notFoundResponse('Category not found');
	}

	// Directly assigned as category judge
	if (category.judgeAssignments.length > 0) {
		const access = await getCompetitionAccess(category.competitionId, userId, client);
		return access;
	}

	// Fall back to organizer-level access (creator, admin, scoped organizer)
	const access = await getCompetitionAccess(category.competitionId, userId, client);
	if (!access.canManageCompetition) {
		throw forbiddenResponse();
	}
	return access;
}

export async function requireEntryJudge(
	entryId: string,
	userId: string,
	client: PrismaLike = prisma,
): Promise<CompetitionAccess> {
	const entry = await client.entry.findUnique({
		where: { id: entryId },
		select: { categoryId: true },
	}) as { categoryId: number } | null;

	if (!entry) {
		throw notFoundResponse('Entry not found');
	}

	return requireCategoryJudge(entry.categoryId, userId, client);
}

// ---------------------------------------------------------------------------
// Error helpers
// ---------------------------------------------------------------------------

function forbiddenResponse(): Response {
	return new Response(JSON.stringify({ error: 'Forbidden' }), {
		status: 403,
		headers: { 'Content-Type': 'application/json' },
	});
}

function notFoundResponse(message: string): Response {
	return new Response(JSON.stringify({ error: message }), {
		status: 404,
		headers: { 'Content-Type': 'application/json' },
	});
}
