import { prisma } from '$lib/database/create_prisma_client';
import { invalidateUserWithRolesCache } from '$lib/database/db_user';
export { validatePhone } from './contact_validation';
export type { PhoneValidationResult } from './contact_validation';

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
    await invalidateUserWithRolesCache(userId);
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
    await invalidateUserWithRolesCache(userId);
}
