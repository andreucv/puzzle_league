import { prisma } from '$lib/database/database';

export type PhoneValidationResult =
    | { valid: true; phonePrefix: string; phoneNumber: string }
    | { valid: false; error: string };

/**
 * Parse and validate phone prefix + number from form data.
 * When `requireBoth` is true both fields must be present (used by add-phone).
 * When false, both empty is accepted (used by profile update — clears phone).
 */
export function validatePhone(
    formData: FormData,
    requireBoth: boolean
): PhoneValidationResult {
    const phonePrefix = formData.get('phonePrefix')?.toString().trim() || '';
    const phoneNumber = formData.get('phoneNumber')?.toString().replace(/[\s\-]/g, '').trim() || '';

    if (requireBoth && (!phonePrefix || !phoneNumber)) {
        return { valid: false, error: 'Both phone prefix and number are required' };
    }

    if (phonePrefix && !phoneNumber) {
        return { valid: false, error: 'Phone number is required when prefix is provided' };
    }
    if (!phonePrefix && phoneNumber) {
        return { valid: false, error: 'Phone prefix is required when number is provided' };
    }

    if (phonePrefix && !/^\+\d{1,4}$/.test(phonePrefix)) {
        return { valid: false, error: 'Prefix must start with + followed by 1-4 digits' };
    }

    if (phoneNumber && !/^\d{4,15}$/.test(phoneNumber)) {
        return { valid: false, error: 'Enter a valid phone number (4-15 digits)' };
    }

    return { valid: true, phonePrefix, phoneNumber };
}

/**
 * Persist phone data for a user.
 * Pass empty strings to clear both fields.
 */
export async function savePhoneForUser(
    userId: string,
    phonePrefix: string,
    phoneNumber: string
) {
    await prisma.user.update({
        where: { id: userId },
        data: {
            phonePrefix: phonePrefix || null,
            phoneNumber: phoneNumber || null,
            phonePromptLastChecked: new Date(),
            updatedAt: new Date()
        }
    });
}

/**
 * Clear phone data and reset the prompt-seen flag so the user
 * sees the onboarding prompt again on next login.
 */
export async function deletePhoneForUser(userId: string) {
    await prisma.user.update({
        where: { id: userId },
        data: {
            phonePrefix: null,
            phoneNumber: null,
            phonePromptLastChecked: null,
            updatedAt: new Date()
        }
    });
}
