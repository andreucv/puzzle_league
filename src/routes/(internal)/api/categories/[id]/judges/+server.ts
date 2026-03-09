import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/database/create_prisma_client';
import { requireCompetitionRole } from '$lib/utils/api_auth';
import { Role } from '$lib/.prisma/generated/prisma/enums';

export const POST: RequestHandler = async (event) => {
	const categoryId = parseInt(event.params.id as string);

	if (isNaN(categoryId)) {
		return json({ error: 'Invalid category ID' }, { status: 400 });
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

	const { userId } = await event.request.json();

	if (!userId || typeof userId !== 'string') {
		return json({ error: 'userId is required' }, { status: 400 });
	}

	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) {
		return json({ error: 'User not found' }, { status: 404 });
	}

	const updated = await prisma.category.update({
		where: { id: categoryId },
		data: { judges: { connect: { id: userId } } },
		include: {
			judges: { select: { id: true, name: true, email: true } }
		}
	});

	return json({ success: true, judges: updated.judges });
};
