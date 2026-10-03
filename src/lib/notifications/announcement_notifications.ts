import type { NotificationIntent } from "./dispatcher";
import { NotificationType } from "$prisma/enums";
import type { CategoryType } from "$prisma/browser";
import { getCategoryTypeName } from "$lib/utils/category_utils";

export const ANNOUNCEMENT_MAX_LENGTH = 1000;

interface AnnouncementInput {
    creatorIds: string[];
    competitionId: number;
    competitionName: string;
    category?: { type: string; subname: string | null } | null;
    message: string;
    actorName?: string;
}

/**
 * Intent for a free-text organizer announcement (e.g. a rescheduled or cancelled
 * competition/category) sent to the creators of every Entry in scope. The organizer's
 * text is passed as-is (single language); only the surrounding title is translated.
 */
export function notificationsForAnnouncement(
    input: AnnouncementInput,
): NotificationIntent[] {
    const userIds = [...new Set(input.creatorIds)];
    if (userIds.length === 0) return [];

    const data: Record<string, string> = {
        competitionName: input.competitionName,
        message: input.message,
    };
    let keySuffix = "organizer_announcement";
    if (input.category) {
        const typeLabel = getCategoryTypeName(
            input.category.type as CategoryType,
        );
        data.categoryName = input.category.subname
            ? `@:${typeLabel} - ${input.category.subname}`
            : `@:${typeLabel}`;
        keySuffix = "organizer_announcement_category";
    }

    return [
        {
            userIds,
            type: NotificationType.GENERAL,
            title: `notifications.titles.${keySuffix}`,
            message: `notifications.messages.${keySuffix}`,
            link: `/competitions/competition_details/${input.competitionId}`,
            data,
            actorName: input.actorName,
            translationKey: keySuffix,
        },
    ];
}
