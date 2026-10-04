import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/svelte";

// CompetitionCard reads locale.get() for the month name, which the shared mock store lacks
vi.mock("$lib/translations", async () => {
    const mock = await import("$tests/mocks/translations");
    return { ...mock, locale: { ...mock.locale, get: () => "en" } };
});

import CompetitionCard from "./CompetitionCard.svelte";

const ME = "me";
const participant = (status: string) => ({ status, creatorId: "other", users: [{ id: ME, name: "Me" }] });
const created = (status: string) => ({ status, creatorId: ME, users: [{ id: "friend", name: "Friend" }] });

function makeCategory(id: number, entries: any[] = []) {
    return {
        id,
        type: "INDIVIDUAL",
        subname: `Cat ${id}`,
        status: "NOT_STARTED",
        registrationOpen: true,
        startTime: new Date("2030-01-01T10:00:00Z"),
        endTime: new Date("2030-01-01T12:00:00Z"),
        maxParties: 10,
        _count: { entries: 5 },
        entries,
    };
}

function renderCard(categories: any[], { anonymous = false } = {}) {
    const currentUserId = anonymous ? undefined : ME;
    return render(CompetitionCard, {
        props: {
            competition: {
                id: 1,
                name: "Copa",
                status: "NOT_STARTED",
                startDate: new Date("2030-01-01T00:00:00Z"),
                image_cld_id: null,
                country: null,
                postalCode: null,
                categories,
            } as any,
            currentUserId,
        },
    });
}

const markerStatuses = () =>
    screen
        .queryAllByTestId("user-entry-status-full")
        .map((el) =>
            Array.from(el.querySelectorAll("[data-testid='registration-status-badge']")).map(
                (b) => (b as HTMLElement).dataset.status,
            ),
        );

describe("CompetitionCard registration status (#120)", () => {
    it("shows a waitlisted marker for a waitlisted participant", () => {
        renderCard([makeCategory(1, [participant("WAITLISTED")])]);
        expect(markerStatuses()).toEqual([["WAITLISTED"]]);
    });

    it("shows the status of entries the user only created", () => {
        renderCard([makeCategory(1, [created("PENDING_CONFIRMATION")])]);
        expect(markerStatuses()).toEqual([["PENDING_CONFIRMATION"]]);
    });

    it("shows 3 user categories and puts the hidden most urgent status on '+N more'", () => {
        renderCard([
            makeCategory(1, [participant("CONFIRMED")]),
            makeCategory(2, [participant("PENDING_CONFIRMATION")]),
            makeCategory(3),
            makeCategory(4, [participant("CONFIRMED")]),
            makeCategory(5, [created("WAITLISTED")]),
        ]);
        expect(screen.getByText("Cat 1")).toBeInTheDocument();
        expect(screen.getByText("Cat 2")).toBeInTheDocument();
        expect(screen.getByText("Cat 4")).toBeInTheDocument();
        expect(screen.queryByText("Cat 3")).toBeNull();
        expect(screen.queryByText("Cat 5")).toBeNull();

        const hidden = screen.getByTestId("hidden-entry-status");
        expect(within(hidden).getByTestId("registration-status-badge").dataset.status).toBe("WAITLISTED");
    });

    it("is unchanged without a current user: first 2 categories, no markers", () => {
        renderCard(
            [makeCategory(1), makeCategory(2), makeCategory(3, [participant("WAITLISTED")])],
            { anonymous: true },
        );
        expect(screen.getByText("Cat 1")).toBeInTheDocument();
        expect(screen.getByText("Cat 2")).toBeInTheDocument();
        expect(screen.queryByText("Cat 3")).toBeNull();
        expect(screen.queryByTestId("user-entry-status")).toBeNull();
        expect(screen.queryByTestId("hidden-entry-status")).toBeNull();
    });
});
