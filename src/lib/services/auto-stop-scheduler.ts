import type { Client } from '@upstash/qstash';
import type { PrismaClient } from '$lib/.prisma/generated/prisma/client';

export interface AutoStopScheduler {
	scheduleAutoStop(categoryId: number, competitionId: number, deadline: Date): Promise<void>;
	cancelAutoStop(categoryId: number): Promise<void>;
	rescheduleAutoStop(categoryId: number, competitionId: number, newDeadline: Date): Promise<void>;
}

interface AutoStopSchedulerDeps {
	qstashClient: Client;
	db: PrismaClient;
	webhookUrl: string;
}

export function createAutoStopScheduler({ qstashClient, db, webhookUrl }: AutoStopSchedulerDeps): AutoStopScheduler {
	const scheduler: AutoStopScheduler = {
		async scheduleAutoStop(categoryId: number, competitionId: number, deadline: Date): Promise<void> {
			const result = await qstashClient.publishJSON({
				url: webhookUrl,
				body: { categoryId, competitionId },
				notBefore: Math.floor(deadline.getTime() / 1000),
				headers: {
					'ngrok-skip-browser-warning': 'true',
				},
			});

			await db.category.update({
				where: { id: categoryId },
				data: { autoStop: true, autoStopMessageId: result.messageId },
			});
		},

		async cancelAutoStop(categoryId: number): Promise<void> {
			const category = await db.category.findUnique({
				where: { id: categoryId },
				select: { autoStopMessageId: true },
			});

			if (!category?.autoStopMessageId) return;

			// Message may already be delivered/expired — ignore 404 from QStash
			try {
				await qstashClient.messages.delete(category.autoStopMessageId);
			} catch (error: unknown) {
				const isNotFound = error instanceof Error && 'status' in error && (error as any).status === 404;
				if (!isNotFound) throw error;
			}
			await db.category.update({
				where: { id: categoryId },
				data: { autoStopMessageId: null },
			});
		},

		async rescheduleAutoStop(categoryId: number, competitionId: number, newDeadline: Date): Promise<void> {
			await scheduler.cancelAutoStop(categoryId);
			await scheduler.scheduleAutoStop(categoryId, competitionId, newDeadline);
		},
	};
	return scheduler;
}
