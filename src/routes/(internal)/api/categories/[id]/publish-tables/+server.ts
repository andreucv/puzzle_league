import { json, type RequestEvent } from '@sveltejs/kit';
import { prisma } from '$lib/database/create_prisma_client';
import { InscriptionStatus } from '$lib/.prisma/generated/prisma/enums';
import { notifyTableAssignments } from '$lib/notifications/inscription_notifications';

export const POST = async (event: RequestEvent) => {
	try {
		const categoryId = parseInt(event.params.id as string);

		if (isNaN(categoryId)) {
			return json({ error: 'Invalid category ID' }, { status: 400 });
		}

		const category = await prisma.category.findUnique({
			where: { id: categoryId },
			include: { competition: { select: { name: true } } }
		});

		if (!category) {
			return json({ error: 'Category not found' }, { status: 404 });
		}

		// Fetch all confirmed records ordered by confirmation time, then reassign 1..N
		const records = await prisma.record.findMany({
			where: {
				categoryId,
				status: InscriptionStatus.CONFIRMED
			},
			orderBy: [{ confirmedAt: 'asc' }, { createdAt: 'asc' }],
			select: {
				id: true,
				tableNumber: true,
				creatorId: true,
				users: { select: { id: true, name: true } },
				userIntents: { select: { name: true } }
			}
		});

		if (records.length === 0) {
			return json({ error: 'No confirmed records to assign tables to' }, { status: 400 });
		}

		// Build a map of previous table numbers for deduplication
		const previousTables = new Map(
			records.map(r => [r.id, r.tableNumber])
		);

		// Reassign table numbers sequentially (compacting any gaps)
		await prisma.$transaction(
			records.map((record, index) =>
				prisma.record.update({
					where: { id: record.id },
					data: { tableNumber: index + 1 }
				})
			)
		);

		// Only notify users whose table number actually changed
		const recordsWithTables = records.map((record, index) => ({
			...record,
			tableNumber: index + 1
		}));

		const changedRecords = recordsWithTables.filter(
			r => r.tableNumber !== previousTables.get(r.id)
		);

		if (changedRecords.length > 0) {
			await notifyTableAssignments(changedRecords, category);
		}

		return json({ success: true, assignedCount: records.length, notifiedCount: changedRecords.length });
	} catch (error) {
		console.error('Error publishing table assignments:', error);
		return json({ error: 'Failed to publish table assignments' }, { status: 500 });
	}
};
