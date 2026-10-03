import { json, type RequestEvent } from "@sveltejs/kit";
import { prisma } from "$lib/database/create_prisma_client";
import { dispatchNotifications } from "$lib/notifications/dispatcher";
import {
    ANNOUNCEMENT_MAX_LENGTH,
    notificationsForAnnouncement,
} from "$lib/notifications/announcement_notifications";
import { getPostHogClient } from "$lib/server/posthog";

/**
 * Organizer announcement: emails + in-app notifies the creators of every Entry in the
 * competition, or only in one category when `categoryId` is given. Used to announce a
 * rescheduled or cancelled competition/category. Does not change any competition state.
 */
export const POST = async (event: RequestEvent) => {
    try {
        const competitionId = parseInt(event.params.id as string);
        if (isNaN(competitionId)) {
            return json({ error: "Invalid competition ID" }, { status: 400 });
        }

        const body = await event.request.json().catch(() => ({}));
        const message =
            typeof body.message === "string"
                ? body.message
                      .replace(/<[^>]*>/g, "")
                      .trim()
                      .slice(0, ANNOUNCEMENT_MAX_LENGTH)
                : "";
        if (!message) {
            return json({ error: "Message is required" }, { status: 400 });
        }
        const categoryId =
            body.categoryId == null ? null : Number(body.categoryId);
        if (categoryId !== null && !Number.isInteger(categoryId)) {
            return json({ error: "Invalid category ID" }, { status: 400 });
        }

        const competition = await prisma.competition.findUnique({
            where: { id: competitionId },
            select: { name: true },
        });
        if (!competition) {
            return json({ error: "Competition not found" }, { status: 404 });
        }

        let category = null;
        if (categoryId !== null) {
            category = await prisma.category.findFirst({
                where: { id: categoryId, competitionId },
                select: { type: true, subname: true },
            });
            if (!category) {
                return json({ error: "Category not found" }, { status: 404 });
            }
        }

        const entries = await prisma.entry.findMany({
            where:
                categoryId !== null
                    ? { categoryId }
                    : { category: { competitionId } },
            select: { creatorId: true },
        });

        const intents = notificationsForAnnouncement({
            creatorIds: entries.map((e) => e.creatorId),
            competitionId,
            competitionName: competition.name,
            category,
            message,
            actorName: event.locals.user?.name || undefined,
        });
        const recipientCount = intents[0]?.userIds.length ?? 0;
        if (intents.length > 0) await dispatchNotifications(intents);

        getPostHogClient().capture({
            distinctId: event.locals.user?.id ?? "server",
            event: "organizer_announcement_sent",
            properties: {
                competition_id: competitionId,
                category_id: categoryId,
                recipients: recipientCount,
            },
        });

        return json({ success: true, recipientCount });
    } catch (error) {
        console.error("Error sending organizer announcement:", error);
        return json({ error: "Failed to send announcement" }, { status: 500 });
    }
};
