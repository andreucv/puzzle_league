import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/database/create_prisma_client';

export const DELETE: RequestHandler = async (event) => {
	try {
		const categoryId = parseInt(event.params.id as string);
		const userId = event.params.userId;

		if (isNaN(categoryId)) {
			return json({ error: 'Invalid category ID' }, { status: 400 });
		}

		if (!userId) {
			return json({ error: 'Missing userId' }, { status: 400 });
		}

		await prisma.categoryJudgeAssignment.delete({
			where: { userId_categoryId: { userId, categoryId } },
		});

		const judges = await prisma.categoryJudgeAssignment.findMany({
			where: { categoryId },
			select: { user: { select: { id: true, name: true, email: true } } },
		});

		return json({ success: true, judges: judges.map((j) => j.user) });
	} catch (error) {
		console.error('Error removing judge from category:', error);
		return json({ error: 'Failed to remove judge' }, { status: 500 });
	}
};
