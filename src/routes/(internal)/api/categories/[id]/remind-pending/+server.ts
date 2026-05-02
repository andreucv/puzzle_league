import { json, type RequestEvent } from '@sveltejs/kit';
import { prisma } from '$lib/database/create_prisma_client';
import { InscriptionStatus } from '$lib/.prisma/generated/prisma/enums';
import { notifyPaymentReminder } from '$lib/notifications/inscription_notifications';
import { PAYMENT_REMINDER_COOLDOWN_MS } from '$lib/constants/inscription';

export const POST = async (event: RequestEvent) => {
	try {
		const categoryId = parseInt(event.params.id as string);
		const actorName = event.locals.user?.name || undefined;

		if (isNaN(categoryId)) {
			return json({ error: 'Invalid category ID' }, { status: 400 });
		}

		const body = await event.request.json().catch(() => ({}));
		const note = typeof body.note === 'string' ? body.note.replace(/<[^>]*>/g, '').slice(0, 200) : undefined;

		const cooldownThreshold = new Date(Date.now() - PAYMENT_REMINDER_COOLDOWN_MS);

		const eligibleRecords = await prisma.record.findMany({
			where: {
				categoryId,
				status: InscriptionStatus.PENDING_CONFIRMATION,
				OR: [
					{ lastRemindedAt: null },
					{ lastRemindedAt: { lt: cooldownThreshold } },
				],
			},
			include: {
				category: {
					select: {
						competitionId: true,
						description: true,
						subname: true,
						type: true,
						competition: { select: { name: true } },
					},
				},
				users: { select: { id: true, name: true } },
				userIntents: { select: { name: true } },
			},
		});

		const totalPending = await prisma.record.count({
			where: {
				categoryId,
				status: InscriptionStatus.PENDING_CONFIRMATION,
			},
		});

		const skippedCount = totalPending - eligibleRecords.length;

		if (eligibleRecords.length === 0) {
			return json({ success: true, remindedCount: 0, skippedCount });
		}

		const now = new Date();
		await prisma.record.updateMany({
			where: { id: { in: eligibleRecords.map((r) => r.id) } },
			data: { lastRemindedAt: now },
		});

		const remindedCount = await notifyPaymentReminder(eligibleRecords, actorName, note);

		return json({ success: true, remindedCount, skippedCount });
	} catch (error) {
		console.error('Error sending bulk payment reminders:', error);
		return json({ error: 'Failed to send payment reminders' }, { status: 500 });
	}
};
