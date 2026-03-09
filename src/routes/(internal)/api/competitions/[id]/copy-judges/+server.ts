import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/database/create_prisma_client';
import { requireCompetitionRole } from '$lib/utils/api_auth';
import { Role } from '$lib/.prisma/generated/prisma/enums';

export const POST: RequestHandler = async (event) => {
	const competitionId = parseInt(event.params.id as string);

	if (isNaN(competitionId)) {
		return json({ error: 'Invalid competition ID' }, { status: 400 });
	}

	const auth = await requireCompetitionRole(event, competitionId, [Role.ORGANIZER]);
	if (!auth.authorized) return auth.response;

	const { sourceCategoryId } = await event.request.json();

	if (!sourceCategoryId || typeof sourceCategoryId !== 'number') {
		return json({ error: 'sourceCategoryId is required' }, { status: 400 });
	}

	// Verify source category belongs to competition and get its judges
	const sourceCategory = await prisma.category.findFirst({
		where: { id: sourceCategoryId, competitionId },
		include: { judges: { select: { id: true } } }
	});

	if (!sourceCategory) {
		return json({ error: 'Source category not found in this competition' }, { status: 404 });
	}

	if (sourceCategory.judges.length === 0) {
		return json({ error: 'Source category has no judges to copy' }, { status: 400 });
	}

	// Get all other categories in the competition
	const otherCategories = await prisma.category.findMany({
		where: { competitionId, id: { not: sourceCategoryId } },
		select: { id: true }
	});

	// Connect judges to all other categories
	const judgeIds = sourceCategory.judges.map((j) => ({ id: j.id }));

	await Promise.all(
		otherCategories.map((cat) =>
			prisma.category.update({
				where: { id: cat.id },
				data: { judges: { connect: judgeIds } }
			})
		)
	);

	return json({ success: true });
};
