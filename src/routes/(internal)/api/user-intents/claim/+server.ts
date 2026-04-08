import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/database/create_prisma_client';
import { getAuthUserId } from '$lib/api_utils/api_auth';
import { createNotification } from '$lib/notifications/notifications';
import { NotificationType } from '$lib/.prisma/generated/prisma/enums';

export const POST: RequestHandler = async (event) => {
    const userId = getAuthUserId(event);

    try {
        const body = await event.request.json();
        const { userIntentIds } = body;

        if (!Array.isArray(userIntentIds) || userIntentIds.length === 0) {
            return json({ error: 'No user intent IDs provided' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // Verify all intents exist and are unclaimed
            const intents = await tx.userIntent.findMany({
                where: {
                    id: { in: userIntentIds },
                    claimedById: null
                },
                include: {
                    records: true,
                    createdBy: {
                        select: { id: true, name: true }
                    }
                }
            });

            if (intents.length !== userIntentIds.length) {
                const foundIds = intents.map(i => i.id);
                const alreadyClaimed = userIntentIds.filter((id: string) => !foundIds.includes(id));
                throw new Error(`Some user intents are already claimed or not found: ${alreadyClaimed.join(', ')}`);
            }

            // Claim all intents: set claimedById and connect user to associated records
            for (const intent of intents) {
                await tx.userIntent.update({
                    where: { id: intent.id },
                    data: { claimedById: userId }
                });

                // Connect the claiming user to all records associated with this intent
                // and disconnect the intent from those records (user fully replaces the intent)
                for (const record of intent.records) {
                    await tx.record.update({
                        where: { id: record.id },
                        data: {
                            users: {
                                connect: { id: userId }
                            },
                            userIntents: {
                                disconnect: { id: intent.id }
                            }
                        }
                    });
                }
            }

            return intents;
        });

        // Send notifications to the users who created the intents
        for (const intent of result) {
            await createNotification({
                userId: intent.createdById,
                type: NotificationType.USER_INTENT_CLAIMED,
                title: 'notifications.titles.user_intent_claimed',
                message: 'notifications.messages.user_intent_claimed',
                link: '/competitions/explore_competitions',
                data: { intentName: intent.name },
            });
        }

        return json({
            success: true,
            claimedCount: result.length,
            message: `Successfully claimed ${result.length} participation(s)`
        });
    } catch (error) {
        console.error('Error claiming user intents:', error);
        return json({
            error: error instanceof Error ? error.message : 'Failed to claim user intents'
        }, { status: 400 });
    }
};
