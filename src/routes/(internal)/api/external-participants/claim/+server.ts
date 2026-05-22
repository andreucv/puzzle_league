import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/database/create_prisma_client';
import { getAuthUserId } from '$lib/api_utils/api_auth';
import { createNotification } from '$lib/notifications/notifications';
import { NotificationType } from '$lib/.prisma/generated/prisma/enums';
import { getPostHogClient } from '$lib/server/posthog';

export const POST: RequestHandler = async (event) => {
    const userId = getAuthUserId(event);

    try {
        const body = await event.request.json();
        const { externalParticipantIds } = body;

        if (!Array.isArray(externalParticipantIds) || externalParticipantIds.length === 0) {
            return json({ error: 'No external participant IDs provided' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // Verify all external participants exist and are unclaimed
            const externalParticipants = await tx.externalParticipant.findMany({
                where: {
                    id: { in: externalParticipantIds },
                    claimedById: null
                },
                include: {
                    entries: true,
                    createdBy: {
                        select: { id: true, name: true }
                    }
                }
            });

            if (externalParticipants.length !== externalParticipantIds.length) {
                const foundIds = externalParticipants.map(i => i.id);
                const alreadyClaimed = externalParticipantIds.filter((id: string) => !foundIds.includes(id));
                throw new Error(`Some external participants are already claimed or not found: ${alreadyClaimed.join(', ')}`);
            }

            // Claim all external participants: set claimedById and connect user to associated records
            for (const ep of externalParticipants) {
                await tx.externalParticipant.update({
                    where: { id: ep.id },
                    data: { claimedById: userId }
                });

                // Connect the claiming user to all records associated with this external participant
                // and disconnect the external participant from those records (user fully replaces the external participant)
                for (const record of ep.entries) {
                    await tx.entry.update({
                        where: { id: record.id },
                        data: {
                            users: {
                                connect: { id: userId }
                            },
                            externalParticipants: {
                                disconnect: { id: ep.id }
                            }
                        }
                    });
                }
            }

            return externalParticipants;
        });

        // Send notifications to the users who created the external participants
        for (const ep of result) {
            await createNotification({
                userId: ep.createdById,
                type: NotificationType.EXTERNAL_PARTICIPANT_CLAIMED,
                title: 'notifications.titles.external_participant_claimed',
                message: 'notifications.messages.external_participant_claimed',
                link: '/competitions/explore_competitions',
                data: { intentName: ep.name },
            });
        }

        const posthog = getPostHogClient();
        posthog.capture({
            distinctId: userId,
            event: 'external_participant_claimed',
            properties: {
                claimed_count: result.length
            }
        });

        return json({
            success: true,
            claimedCount: result.length,
            message: `Successfully claimed ${result.length} participation(s)`
        });
    } catch (error) {
        console.error('Error claiming external participants:', error);
        return json({
            error: error instanceof Error ? error.message : 'Failed to claim external participants'
        }, { status: 400 });
    }
};
