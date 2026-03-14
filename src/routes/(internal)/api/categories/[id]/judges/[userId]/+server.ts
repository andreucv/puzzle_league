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

		const updated = await prisma.category.update({
			where: { id: categoryId },
			data: { judges: { disconnect: { id: userId } } },
			include: {
				judges: { select: { id: true, name: true, email: true } }
			}
		});

		return json({ success: true, judges: updated.judges });
	} catch (error) {
		console.error('Error removing judge from category:', error);
		return json({ error: 'Failed to remove judge' }, { status: 500 });
	}
};
