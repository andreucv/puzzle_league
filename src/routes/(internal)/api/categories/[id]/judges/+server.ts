import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/database/create_prisma_client';

export const POST: RequestHandler = async (event) => {
	try {
		const categoryId = parseInt(event.params.id as string);

		if (isNaN(categoryId)) {
			return json({ error: 'Invalid category ID' }, { status: 400 });
		}

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
	} catch (error) {
		console.error('Error adding judge to category:', error);
		return json({ error: 'Failed to add judge' }, { status: 500 });
	}
};
