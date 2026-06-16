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
            registrationStatus: null,
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

    describe("registration indicator", () => {
        // The user's own registration is now signalled by colouring the capacity count
        // success-green (countColorClass), not by a separate titled indicator element.
        it("colours the count as registered when the user is confirmed", () => {
            const { container } = renderRow(
                {},
                { registrationStatus: "CONFIRMED" },
            );
            expect(container.querySelector(".text-success-600")).not.toBeNull();
        });

        it("colours the count as registered when the user is pending confirmation", () => {
            const { container } = renderRow(
                {},
                { registrationStatus: "PENDING_CONFIRMATION" },
            );
            expect(container.querySelector(".text-success-600")).not.toBeNull();
        });

        it("does not colour the count as registered when the user is not registered", () => {
            const { container } = renderRow({}, { registrationStatus: null });
            expect(container.querySelector(".text-success-600")).toBeNull();
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
