import { json, type RequestEvent } from '@sveltejs/kit';
import { prisma } from '$lib/database/create_prisma_client';
import { RegistrationStatus } from '$prisma/enums';
import { notificationsForPaymentReminder } from '$lib/notifications/registration_notifications';
import { dispatchNotifications } from '$lib/notifications/dispatcher';
import { PAYMENT_REMINDER_COOLDOWN_MS } from '$lib/constants/registration';

export const POST = async (event: RequestEvent) => {
	try {
		const entryId = event.params.id as string;
		const actorName = event.locals.user?.name || undefined;

		if (!entryId) {
			return json({ error: 'Invalid entry ID' }, { status: 400 });
		}

		const body = await event.request.json().catch(() => ({}));
		const note = typeof body.note === 'string' ? body.note.replace(/<[^>]*>/g, '').slice(0, 200) : undefined;

		const entry = await prisma.entry.findUnique({
			where: { id: entryId },
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

		if (!entry) {
			return json({ error: 'Entry not found' }, { status: 404 });
		}

		if (entry.status !== RegistrationStatus.PENDING_CONFIRMATION) {
			return json({ error: 'Only pending registrations can be reminded' }, { status: 400 });
		}

		if (entry.lastRemindedAt) {
			const elapsed = Date.now() - entry.lastRemindedAt.getTime();
			if (elapsed < PAYMENT_REMINDER_COOLDOWN_MS) {
				return json({ error: 'Reminder already sent recently. Please wait before sending again.' }, { status: 429 });
			}
		}

		const now = new Date();
		await prisma.entry.update({
			where: { id: entryId },
			data: { lastRemindedAt: now },
		});

		const reminderIntents = notificationsForPaymentReminder([entry], actorName, note);
		await dispatchNotifications(reminderIntents);
		const remindedCount = new Set(reminderIntents.flatMap((i) => i.userIds)).size;

		return json({ success: true, remindedAt: now.toISOString(), remindedCount });
	} catch (error) {
		console.error('Error sending payment reminder:', error);
		return json({ error: 'Failed to send payment reminder' }, { status: 500 });
	}
};
