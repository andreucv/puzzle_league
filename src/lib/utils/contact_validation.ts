export const PHONE_PREFIX_PATTERN = /^\+\d{1,4}$/;
export const PHONE_NUMBER_PATTERN = /^\d{6,12}$/;
export const POSTAL_CODE_PATTERN = /^[a-zA-Z0-9\s-]{3,10}$/;

export type PhoneValidationResult =
    | { valid: true; phonePrefix: string; phoneNumber: string }
    | { valid: false; error: string };

export type PostalCodeValidationResult =
    | { valid: true; postalCode: string | null }
    | { valid: false; error: string };

/**
 * Parse and validate phone prefix + number from form data.
 * When `requireBoth` is true both fields must be present (used by add-phone).
 * When false, both empty is accepted (used by profile update - clears phone).
 */
export function validatePhone(
    formData: FormData,
    requireBoth: boolean
): PhoneValidationResult {
    const phonePrefix = formData.get('phonePrefix')?.toString().trim() || '';
    const phoneNumber = formData.get('phoneNumber')?.toString().trim() || '';

    if (requireBoth && (!phonePrefix || !phoneNumber)) {
        return { valid: false, error: 'add_phone.validation_both_required' };
    }

    if (phonePrefix && !phoneNumber) {
        return { valid: false, error: 'add_phone.validation_number_required' };
    }
    if (!phonePrefix && phoneNumber) {
        return { valid: false, error: 'add_phone.validation_prefix_required' };
    }

    if (phonePrefix && !PHONE_PREFIX_PATTERN.test(phonePrefix)) {
        return { valid: false, error: 'add_phone.validation_prefix_format' };
    }

    if (phoneNumber && !PHONE_NUMBER_PATTERN.test(phoneNumber)) {
        return { valid: false, error: 'add_phone.validation_number_format' };
    }

    return { valid: true, phonePrefix, phoneNumber };
}

export function validatePostalCode(postalCode: string | null | undefined): PostalCodeValidationResult {
    const value = postalCode?.trim() || null;

    if (value && !POSTAL_CODE_PATTERN.test(value)) {
        return { valid: false, error: 'add_location.validation_postal_code_format' };
    }

    return { valid: true, postalCode: value };
}
