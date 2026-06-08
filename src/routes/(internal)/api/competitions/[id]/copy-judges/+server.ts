import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/database/create_prisma_client';

export const POST: RequestHandler = async (event) => {
	try {
		const competitionId = parseInt(event.params.id as string);

		if (isNaN(competitionId)) {
			return json({ error: 'Invalid competition ID' }, { status: 400 });
		}

	const { sourceCategoryId } = await event.request.json();

	if (!sourceCategoryId || typeof sourceCategoryId !== 'number') {
		return json({ error: 'sourceCategoryId is required' }, { status: 400 });
	}

	// Verify source category belongs to competition and get its judges
	const sourceAssignments = await prisma.categoryJudgeAssignment.findMany({
		where: { categoryId: sourceCategoryId, category: { competitionId } },
		select: { userId: true }
	});

	if (sourceAssignments.length === 0) {
		return json({ error: 'Source category has no judges to copy' }, { status: 400 });
	}

	// Get all other categories in the competition
	const otherCategories = await prisma.category.findMany({
		where: { competitionId, id: { not: sourceCategoryId } },
		select: { id: true }
	});

	// Create judge assignments for all other categories (skip duplicates)
	const assignments = otherCategories.flatMap((cat) =>
		sourceAssignments.map((a) => ({
			userId: a.userId,
			categoryId: cat.id,
		}))
	);

	await prisma.categoryJudgeAssignment.createMany({
		data: assignments,
		skipDuplicates: true,
	});

	return json({ success: true });
	} catch (error) {
		console.error('Error copying judges:', error);
		return json({ error: 'Failed to copy judges' }, { status: 500 });
	}
};
