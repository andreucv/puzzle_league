import { json, type RequestEvent } from '@sveltejs/kit';
import { prisma } from '$lib/database/database';
import { CategoryStatus } from '$lib/.prisma/generated/prisma/enums';
import { publishCompetitionEvent } from '$lib/events/server/ably';

export const POST = async (event: RequestEvent) => {
	try {
		const recordId = event.params.id as string;

		if (!recordId) {
			return json({ error: 'Invalid record ID' }, { status: 400 });
		}

		const body = await event.request.json();
		const nPiecesCompleted = body.nPiecesCompleted;

		if (typeof nPiecesCompleted !== 'number' || nPiecesCompleted < 0 || !Number.isInteger(nPiecesCompleted)) {
			return json({ error: 'nPiecesCompleted must be a non-negative integer' }, { status: 400 });
		}

		// Enforce: pieces updates only allowed when category is STOPPED and record is a DNF
		const record = await prisma.record.findUnique({
			where: { id: recordId },
			select: { finishTime: true, category: { select: { status: true } } }
		});

		if (!record) {
			return json({ error: 'Record not found' }, { status: 404 });
		}

		if (record.category.status !== CategoryStatus.STOPPED) {
			return json({ error: 'Pieces can only be updated while the category is STOPPED' }, { status: 409 });
		}

		if (record.finishTime !== null) {
			return json({ error: 'Pieces can only be set on DNF records (finishTime must be null)' }, { status: 409 });
		}

		const updatedRecord = await prisma.record.update({
			where: { id: recordId },
			data: { nPiecesCompleted },
			include: {
				users: {
					select: { id: true, name: true, email: true }
				}
			}
		});

		const cat = await prisma.category.findUnique({
			where: { id: updatedRecord.categoryId },
			select: { competitionId: true }
		});
		if (cat) {
			publishCompetitionEvent(cat.competitionId, 'record.pieces_updated', {
				recordId: updatedRecord.id,
				categoryId: updatedRecord.categoryId,
				competitionId: cat.competitionId,
				nPiecesCompleted
			});
		}

		return json({ record: updatedRecord });
	} catch (error) {
		console.error('Error updating pieces completed:', error);
		return json({ error: 'Failed to update pieces completed' }, { status: 500 });
	}
};

export const DELETE = async (event: RequestEvent) => {
	try {
		const recordId = event.params.id as string;

		if (!recordId) {
			return json({ error: 'Invalid record ID' }, { status: 400 });
		}

		const record = await prisma.record.findUnique({
			where: { id: recordId },
			select: { nPiecesCompleted: true, finishTime: true, category: { select: { status: true } } }
		});

		if (!record) {
			return json({ error: 'Record not found' }, { status: 404 });
		}

		if (record.category.status !== CategoryStatus.STOPPED) {
			return json({ error: 'Pieces can only be reset while the category is STOPPED' }, { status: 409 });
		}

		if (record.finishTime !== null) {
			return json({ error: 'Cannot reset pieces on a record with a finish time' }, { status: 409 });
		}

		const updatedRecord = await prisma.record.update({
			where: { id: recordId },
			data: { nPiecesCompleted: null },
			include: {
				users: {
					select: { id: true, name: true, email: true }
				}
			}
		});

		return json({ record: updatedRecord });
	} catch (error) {
		console.error('Error resetting pieces completed:', error);
		return json({ error: 'Failed to reset pieces completed' }, { status: 500 });
	}
};
