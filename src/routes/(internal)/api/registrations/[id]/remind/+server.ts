import { json, type RequestEvent } from '@sveltejs/kit';
import { prisma } from '$lib/database/create_prisma_client';
import { RegistrationStatus } from '$lib/.prisma/generated/prisma/enums';
import { notifyPaymentReminder } from '$lib/notifications/registration_notifications';
import { PAYMENT_REMINDER_COOLDOWN_MS } from '$lib/constants/registration';

export const POST = async (event: RequestEvent) => {
	try {
		const recordId = event.params.id as string;
		const actorName = event.locals.user?.name || undefined;

		if (!recordId) {
			return json({ error: 'Invalid record ID' }, { status: 400 });
		}

		const body = await event.request.json().catch(() => ({}));
		const note = typeof body.note === 'string' ? body.note.replace(/<[^>]*>/g, '').slice(0, 200) : undefined;

		const record = await prisma.entry.findUnique({
			where: { id: recordId },
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
				externalParticipants: { select: { name: true } },
			},
		});

		if (!record) {
			return json({ error: 'Record not found' }, { status: 404 });
		}

		if (record.status !== RegistrationStatus.PENDING_CONFIRMATION) {
			return json({ error: 'Only pending registrations can be reminded' }, { status: 400 });
		}

		if (record.lastRemindedAt) {
			const elapsed = Date.now() - record.lastRemindedAt.getTime();
			if (elapsed < PAYMENT_REMINDER_COOLDOWN_MS) {
				return json({ error: 'Reminder already sent recently. Please wait before sending again.' }, { status: 429 });
			}
		}

		const now = new Date();
		await prisma.entry.update({
			where: { id: recordId },
			data: { lastRemindedAt: now },
		});

		const remindedCount = await notifyPaymentReminder([record], actorName, note);

		return json({ success: true, remindedAt: now.toISOString(), remindedCount });
	} catch (error) {
		console.error('Error sending payment reminder:', error);
		return json({ error: 'Failed to send payment reminder' }, { status: 500 });
	}
};
