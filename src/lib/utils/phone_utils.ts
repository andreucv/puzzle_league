import { prisma } from '$lib/database/create_prisma_client';

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
        return { valid: false, error: 'add_phone.validation_both_required' };
    }

    if (phonePrefix && !phoneNumber) {
        return { valid: false, error: 'add_phone.validation_number_required' };
    }
    if (!phonePrefix && phoneNumber) {
        return { valid: false, error: 'add_phone.validation_prefix_required' };
    }

    if (phonePrefix && !/^\+\d{1,4}$/.test(phonePrefix)) {
        return { valid: false, error: 'add_phone.validation_prefix_format' };
    }

    if (phoneNumber && !/^\d{4,15}$/.test(phoneNumber)) {
        return { valid: false, error: 'add_phone.validation_number_format' };
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
