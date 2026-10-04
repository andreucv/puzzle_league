import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/svelte";

vi.mock("$lib/translations", async () => import("$tests/mocks/translations"));

import EntryRegistrationStatusBadge from "./EntryRegistrationStatusBadge.svelte";

describe("EntryRegistrationStatusBadge", () => {
    it("shows the status label by default", () => {
        render(EntryRegistrationStatusBadge, { props: { status: "WAITLISTED" } });
        expect(screen.getByText("registration.status_waitlisted")).toBeInTheDocument();
    });

    it("renders icon only when compact", () => {
        render(EntryRegistrationStatusBadge, { props: { status: "WAITLISTED", compact: true } });
        const badge = screen.getByTestId("registration-status-badge");
        expect(badge.dataset.status).toBe("WAITLISTED");
        expect(badge.querySelector("svg")).not.toBeNull();
        expect(badge.textContent?.trim()).toBe("");
    });

    it("shows the count only when greater than 1", () => {
        const { unmount } = render(EntryRegistrationStatusBadge, { props: { status: "CONFIRMED", compact: true, count: 1 } });
        expect(screen.getByTestId("registration-status-badge").textContent?.trim()).toBe("");
        unmount();

        render(EntryRegistrationStatusBadge, { props: { status: "CONFIRMED", compact: true, count: 3 } });
        expect(screen.getByTestId("registration-status-badge").textContent?.trim()).toBe("3");
    });
});
