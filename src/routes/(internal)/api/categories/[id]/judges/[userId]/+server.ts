import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/database/create_prisma_client';
import { requireCompetitionRole } from '$lib/utils/api_auth';
import { Role } from '$lib/.prisma/generated/prisma/enums';

export const DELETE: RequestHandler = async (event) => {
	const categoryId = parseInt(event.params.id as string);
	const userId = event.params.userId;

	if (isNaN(categoryId)) {
		return json({ error: 'Invalid category ID' }, { status: 400 });
	}

	if (!userId) {
		return json({ error: 'Missing userId' }, { status: 400 });
	}

	const category = await prisma.category.findUnique({
		where: { id: categoryId },
		select: { competitionId: true }
	});

	if (!category) {
		return json({ error: 'Category not found' }, { status: 404 });
	}

	const auth = await requireCompetitionRole(event, category.competitionId, [Role.ORGANIZER]);
	if (!auth.authorized) return auth.response;

	const updated = await prisma.category.update({
		where: { id: categoryId },
		data: { judges: { disconnect: { id: userId } } },
		include: {
			judges: { select: { id: true, name: true, email: true } }
		}
	});

	return json({ success: true, judges: updated.judges });
};
