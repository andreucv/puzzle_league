import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/svelte";

vi.mock("$lib/translations", async () => import("$tests/mocks/translations"));

import CategoryCapacityRow from "./CategoryCapacityRow.svelte";

function makeCategory(overrides: Record<string, any> = {}) {
    return {
        type: "INDIVIDUAL",
        subname: null as string | null,
        maxParties: 12 as number | null,
        _count: { entries: 3 },
        ...overrides,
    };
}

function renderRow(
    categoryOverrides: Record<string, any> = {},
    propsOverrides: Record<string, any> = {},
) {
    return render(CategoryCapacityRow, {
        props: {
            category: makeCategory(categoryOverrides),
            competitionStatus: "NOT_STARTED",
            statusCounts: null,
            ...propsOverrides,
        },
    });
}

describe("CategoryCapacityRow", () => {
    // NOTE: the count→fill-level threshold logic (success/warning/error range) is unit
    // tested directly in src/lib/utils/capacity.test.ts. These tests only assert the
    // user-facing N/max label so they don't break on a styling/class rename.
    describe("capacity bar (capped + NOT_STARTED)", () => {
        it("shows the N/max label when capped and upcoming", () => {
            renderRow({ maxParties: 12, _count: { entries: 3 } });
            expect(screen.getByText("3/12")).toBeInTheDocument();
        });

        it("clamps the label to max when overbooked (no overbooked shown)", () => {
            renderRow({ maxParties: 12, _count: { entries: 15 } });
            expect(screen.getByText("12/12")).toBeInTheDocument();
            expect(screen.queryByText("15/12")).toBeNull();
        });
    });

    describe("plain count fallback", () => {
        it("shows the registered count (no bar) when uncapped", () => {
            const { container } = renderRow({
                maxParties: null,
                _count: { entries: 3 },
            });
            expect(screen.queryByText("3/12")).toBeNull();
            expect(screen.getByText("3")).toBeInTheDocument();
            expect(
                container.querySelector(
                    ".bg-success-500, .bg-warning-500, .bg-error-500",
                ),
            ).toBeNull();
        });

        it("shows the plain count (no bar) when the competition is not upcoming", () => {
            renderRow(
                { maxParties: 12, _count: { entries: 3 } },
                { competitionStatus: "STARTED" },
            );
            expect(screen.queryByText("3/12")).toBeNull();
            expect(screen.getByText("3")).toBeInTheDocument();
        });
    });

    describe("user entry status (#120)", () => {
        const counts = (c = 0, p = 0, w = 0) => ({ CONFIRMED: c, PENDING_CONFIRMATION: p, WAITLISTED: w });
        const statusesIn = (el: Element) =>
            Array.from(el.querySelectorAll("[data-testid='registration-status-badge']")).map(
                (b) => (b as HTMLElement).dataset.status,
            );

        it("shows no marker when the user has no entries", () => {
            renderRow({}, { statusCounts: null });
            expect(screen.queryByTestId("user-entry-status")).toBeNull();
        });

        it("keeps the capacity count neutral whatever the status", () => {
            renderRow({ maxParties: 10, _count: { entries: 10 } }, { statusCounts: counts(0, 0, 1) });
            const count = screen.getByText("10/10");
            expect(count.className).toContain("text-primary-700");
            expect(count.className).not.toContain("text-success-600");
        });

        it("lists every status in lifecycle order from sm up", () => {
            renderRow({}, { statusCounts: counts(1, 2, 1) });
            const full = screen.getByTestId("user-entry-status-full");
            expect(statusesIn(full)).toEqual(["CONFIRMED", "PENDING_CONFIRMATION", "WAITLISTED"]);
            expect(full.textContent?.replace(/\s/g, "")).toBe("2");
        });

        it("shows only the most urgent status with its own count on mobile", () => {
            renderRow({}, { statusCounts: counts(1, 2, 0) });
            const mobile = screen.getByTestId("user-entry-status-mobile");
            expect(statusesIn(mobile)).toEqual(["PENDING_CONFIRMATION"]);
            expect(mobile.textContent?.trim()).toBe("2");
        });

        it("labels the markers for assistive tech", () => {
            renderRow({}, { statusCounts: counts(0, 0, 1) });
            expect(screen.getByRole("img", { name: "competition_card.your_entries" })).toBeInTheDocument();
        });
    });

    describe("subname", () => {
        it("shows the subname when present", () => {
            renderRow({ subname: "500 pcs" });
            expect(screen.getByText("500 pcs")).toBeInTheDocument();
        });

        it("hides the subname when it equals the uppercased type name", () => {
            renderRow({ subname: "CATEGORY_NAMES.INDIVIDUAL" });
            expect(screen.queryByText("CATEGORY_NAMES.INDIVIDUAL")).toBeNull();
        });
    });
});
