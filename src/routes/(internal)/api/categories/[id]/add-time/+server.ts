import { json, type RequestEvent } from '@sveltejs/kit';
import { prisma } from '$lib/database/create_prisma_client';
import { CategoryStatus } from '$lib/.prisma/generated/prisma/enums';
import { publishCompetitionEvent } from '$lib/events/server/ably';

const ALLOWED_MINUTES = [5, 10, 15];

export const POST = async (event: RequestEvent) => {
	try {
		const categoryId = parseInt(event.params.id as string);

		if (isNaN(categoryId)) {
			return json({ error: 'Invalid category ID' }, { status: 400 });
		}

		const body = await event.request.json();
		const minutes = body?.minutes;

		if (!ALLOWED_MINUTES.includes(minutes)) {
			return json({ error: 'Minutes must be one of: 5, 10, 15' }, { status: 400 });
		}

		const category = await prisma.category.findUnique({
			where: { id: categoryId },
			select: { id: true, status: true, competitionId: true }
		});

		if (!category) {
			return json({ error: 'Category not found' }, { status: 404 });
		}

		if (category.status !== CategoryStatus.LIVE) {
			return json({ error: 'Can only add time to LIVE categories' }, { status: 409 });
		}

		const updatedCategory = await prisma.category.update({
			where: { id: categoryId },
			data: { extraMinutes: { increment: minutes } },
			select: { extraMinutes: true }
		});

		await publishCompetitionEvent(category.competitionId, 'category.time_extended', {
			categoryId,
			competitionId: category.competitionId,
			extraMinutes: updatedCategory.extraMinutes,
			addedMinutes: minutes
		});

		return json({ success: true, extraMinutes: updatedCategory.extraMinutes });
	} catch (error) {
		console.error('Error adding time to category:', error);
		return json({ error: 'Failed to add time' }, { status: 500 });
	}
};
