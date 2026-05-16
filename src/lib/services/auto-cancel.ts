import { prisma } from '$lib/database/create_prisma_client';
import { CompetitionStatus, CategoryStatus, NotificationType } from '$lib/.prisma/generated/prisma/enums';
import { createNotificationForUsers } from '$lib/notifications/notifications';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AutoCancelOptions {
	dryRun?: boolean;
	competitionId?: number;
}

export interface AutoCancelResult {
	eligible: number;
	eligibleCompetitionIds: number[];
	cancelled: number;
	skipped: number;
	failed: number;
	categoriesChanged: number;
	recipientsAttempted: number;
	notificationFailures: number;
	failures: Array<{ competitionId: number; error: string }>;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export async function autoCancelExpiredCompetitions(
	options: AutoCancelOptions = {},
): Promise<AutoCancelResult> {
	const { dryRun = false, competitionId } = options;
	const now = new Date();

	console.log(`[auto-cancel] Starting. dryRun=${dryRun}, competitionId=${competitionId ?? 'all'}`);

	// 1. Find eligible competitions
	const eligibleCompetitions = await prisma.competition.findMany({
		where: {
			status: CompetitionStatus.NOT_STARTED,
			endDate: { lt: now },
			...(competitionId != null ? { id: competitionId } : {}),
		},
		select: {
			id: true,
			name: true,
			creatorId: true,
			categories: {
				select: {
					id: true,
					status: true,
				},
			},
		},
	});

	const result: AutoCancelResult = {
		eligible: eligibleCompetitions.length,
		eligibleCompetitionIds: eligibleCompetitions.map((c) => c.id),
		cancelled: 0,
		skipped: 0,
		failed: 0,
		categoriesChanged: 0,
		recipientsAttempted: 0,
		notificationFailures: 0,
		failures: [],
	};

	if (dryRun) {
		// Calculate expected counts without mutating
		for (const competition of eligibleCompetitions) {
			const categoriesToCancel = competition.categories.filter(
				(c) => c.status === CategoryStatus.NOT_STARTED,
			);
			result.categoriesChanged += categoriesToCancel.length;

			const recipients = await collectRecipients(competition.id, competition.creatorId);
			result.recipientsAttempted += recipients.length;
		}

		console.log(`[auto-cancel] Dry run complete. ${result.eligible} eligible competitions found.`);
		return result;
	}

	// 2. Process each eligible competition
	for (const competition of eligibleCompetitions) {
		try {
			// Cancel the competition
			await prisma.competition.update({
				where: { id: competition.id },
				data: { status: CompetitionStatus.CANCELLED },
			});

			// Cancel only NOT_STARTED categories
			const categoriesToCancel = competition.categories.filter(
				(c) => c.status === CategoryStatus.NOT_STARTED,
			);

			if (categoriesToCancel.length > 0) {
				await prisma.category.updateMany({
					where: {
						id: { in: categoriesToCancel.map((c) => c.id) },
					},
					data: { status: CategoryStatus.CANCELED },
				});
			}

			result.cancelled += 1;
			result.categoriesChanged += categoriesToCancel.length;

			console.log(
				`[auto-cancel] Cancelled competition ${competition.id} ("${competition.name}"), ` +
					`${categoriesToCancel.length} categories changed.`,
			);

			// 3. Collect and deduplicate notification recipients
			const recipientIds = await collectRecipients(competition.id, competition.creatorId);
			result.recipientsAttempted += recipientIds.length;

			// 4. Send notifications (failures do not rollback the cancellation)
			if (recipientIds.length > 0) {
				try {
					await createNotificationForUsers(
						recipientIds,
						NotificationType.COMPETITION_CANCELLED,
						'notifications.titles.competition_auto_cancelled',
						'notifications.messages.competition_auto_cancelled',
						`/competitions/competition_details/${competition.id}`,
						{ competitionName: competition.name },
					);
				} catch (notificationError) {
					result.notificationFailures += 1;
					console.error(
						`[auto-cancel] Notification failed for competition ${competition.id}:`,
						notificationError,
					);
				}
			}
		} catch (error) {
			result.failed += 1;
			const errorMessage = error instanceof Error ? error.message : String(error);
			result.failures.push({ competitionId: competition.id, error: errorMessage });
			console.error(`[auto-cancel] Failed to cancel competition ${competition.id}:`, error);
		}
	}

	result.skipped = result.eligible - result.cancelled - result.failed;

	console.log(
		`[auto-cancel] Complete. eligible=${result.eligible}, cancelled=${result.cancelled}, ` +
			`failed=${result.failed}, skipped=${result.skipped}, ` +
			`categoriesChanged=${result.categoriesChanged}, recipients=${result.recipientsAttempted}, ` +
			`notificationFailures=${result.notificationFailures}`,
	);

	return result;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function collectRecipients(competitionId: number, creatorId: string): Promise<string[]> {
	const entries = await prisma.entry.findMany({
		where: { category: { competitionId } },
		select: {
			creatorId: true,
			users: { select: { id: true } },
		},
	});

	const userIdSet = new Set<string>();

	// Organizer (competition creator)
	userIdSet.add(creatorId);

	// Entry creators and platform participants
	for (const entry of entries) {
		userIdSet.add(entry.creatorId);
		for (const user of entry.users) {
			userIdSet.add(user.id);
		}
	}

	return Array.from(userIdSet);
}
