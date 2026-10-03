import { describe, it, expect, vi } from "vitest";

vi.mock("$prisma/enums", () => ({
    NotificationType: { GENERAL: "GENERAL" },
}));

vi.mock("$lib/utils/category_utils", () => ({
    getCategoryTypeName: vi.fn().mockReturnValue("category_names.individual"),
}));

import { notificationsForAnnouncement } from "./announcement_notifications";

const base = {
    competitionId: 7,
    competitionName: "Spring Cup",
    message: "Moved to next Sunday due to the weather.",
    actorName: "Org",
};

describe("notificationsForAnnouncement", () => {
    it("returns no intents when there are no entry creators", () => {
        expect(
            notificationsForAnnouncement({ ...base, creatorIds: [] }),
        ).toEqual([]);
    });

    it("builds one competition-wide intent with de-duplicated creators", () => {
        const [intent, ...rest] = notificationsForAnnouncement({
            ...base,
            creatorIds: ["u1", "u2", "u1"],
        });

        expect(rest).toHaveLength(0);
        expect(intent.userIds).toEqual(["u1", "u2"]);
        expect(intent.type).toBe("GENERAL");
        expect(intent.title).toBe(
            "notifications.titles.organizer_announcement",
        );
        expect(intent.translationKey).toBe("organizer_announcement");
        expect(intent.link).toBe("/competitions/competition_details/7");
        expect(intent.actorName).toBe("Org");
        expect(intent.data).toEqual({
            competitionName: "Spring Cup",
            message: base.message,
        });
    });

    it("uses the category variant and a translatable category name when scoped to a category", () => {
        const [intent] = notificationsForAnnouncement({
            ...base,
            creatorIds: ["u1"],
            category: { type: "INDIVIDUAL", subname: "Elite" },
        });

        expect(intent.title).toBe(
            "notifications.titles.organizer_announcement_category",
        );
        expect(intent.translationKey).toBe("organizer_announcement_category");
        expect(intent.data?.categoryName).toBe(
            "@:category_names.individual - Elite",
        );
    });
});
