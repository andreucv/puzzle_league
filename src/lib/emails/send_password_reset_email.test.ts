import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSend } = vi.hoisted(() => ({
    mockSend: vi.fn(),
}));

vi.mock("resend", () => ({
    Resend: class {
        emails = { send: mockSend };
    },
}));

vi.mock("$env/static/private", () => ({
    RESEND_API_KEY: "test-api-key",
    RESEND_FROM_EMAIL: "noreply@test.com",
}));

vi.mock("./email_template", () => ({
    buildMultiLanguageEmail: vi.fn().mockReturnValue("<html>test</html>"),
}));

import {
    sendPasswordResetEmail,
    sendSocialOnlyPasswordResetEmail,
} from "./send_password_reset_email";

describe("sendPasswordResetEmail", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("Given valid email, when send succeeds, then returns success", async () => {
        mockSend.mockResolvedValue({ id: "msg-123" });

        const result = await sendPasswordResetEmail(
            "user@test.com",
            "https://app.test/reset-password?token=abc",
        );

        expect(result).toEqual({ success: true });
        expect(mockSend).toHaveBeenCalledOnce();
        expect(mockSend).toHaveBeenCalledWith(
            expect.objectContaining({
                from: "noreply@test.com",
                to: "user@test.com",
            }),
        );
    });

    it("Given valid email, when Resend throws, then returns failure with error message", async () => {
        const consoleSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        mockSend.mockRejectedValue(new Error("API rate limit exceeded"));

        const result = await sendPasswordResetEmail(
            "user@test.com",
            "https://app.test/reset-password?token=abc",
        );

        expect(result).toEqual({
            success: false,
            error: "API rate limit exceeded",
        });
        expect(consoleSpy).toHaveBeenCalledWith(
            "[sendPasswordResetEmail] Failed to send email:",
            expect.any(Error),
        );
        consoleSpy.mockRestore();
    });

    it("Given valid email, when Resend throws non-Error, then returns failure with generic message", async () => {
        const consoleSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        mockSend.mockRejectedValue("network timeout");

        const result = await sendPasswordResetEmail(
            "user@test.com",
            "https://app.test/reset-password?token=abc",
        );

        expect(result).toEqual({ success: false, error: "Unknown error" });
        consoleSpy.mockRestore();
    });

    it("Given a social-only account, when sendSocialOnlyPasswordResetEmail succeeds, then the body explains the linked provider and links to login", async () => {
        const { buildMultiLanguageEmail } = await import("./email_template");
        mockSend.mockResolvedValue({ id: "msg-456" });

        await sendSocialOnlyPasswordResetEmail("user@test.com", ["google"]);

        expect(buildMultiLanguageEmail).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    locale: "en",
                    message: expect.stringContaining("is linked to Google"),
                }),
            ]),
            "/login",
        );
    });

    it("Given a regular reset, when sendPasswordResetEmail succeeds, then the body does not include the social provider notice", async () => {
        const { buildMultiLanguageEmail } = await import("./email_template");
        mockSend.mockResolvedValue({ id: "msg-789" });

        await sendPasswordResetEmail(
            "user@test.com",
            "https://app.test/reset-password?token=abc",
        );

        expect(buildMultiLanguageEmail).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    locale: "en",
                    message: expect.not.stringContaining("is linked to"),
                }),
            ]),
            "https://app.test/reset-password?token=abc",
        );
    });
});
