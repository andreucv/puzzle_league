import { describe, expect, it } from 'vitest';
import { validatePhone, validatePostalCode } from './contact_validation';

function phoneFormData(phonePrefix: string, phoneNumber: string) {
    const formData = new FormData();
    formData.set('phonePrefix', phonePrefix);
    formData.set('phoneNumber', phoneNumber);
    return formData;
}

describe('validatePhone', () => {
    it('accepts phone numbers with 6 digits', () => {
        const result = validatePhone(phoneFormData('+34', '123456'), true);

        expect(result).toEqual({ valid: true, phonePrefix: '+34', phoneNumber: '123456' });
    });

    it('accepts phone numbers with 12 digits', () => {
        const result = validatePhone(phoneFormData('+34', '123456789012'), true);

        expect(result).toEqual({ valid: true, phonePrefix: '+34', phoneNumber: '123456789012' });
    });

    it.each(['12345', '1234567890123', '123 456', '123-456', 'abcdef'])(
        'rejects invalid phone number %s',
        (phoneNumber) => {
            const result = validatePhone(phoneFormData('+34', phoneNumber), true);

            expect(result).toEqual({
                valid: false,
                error: 'add_phone.validation_number_format'
            });
        }
    );
});

describe('validatePostalCode', () => {
    it.each(['08001', 'SW1A 1AA', 'ABC-123'])('accepts postal code %s', (postalCode) => {
        const result = validatePostalCode(postalCode);

        expect(result).toEqual({ valid: true, postalCode });
    });

    it('accepts an empty postal code', () => {
        const result = validatePostalCode('');

        expect(result).toEqual({ valid: true, postalCode: null });
    });

    it.each(['12', '12345678901', '08001!', 'AB_123'])(
        'rejects invalid postal code %s',
        (postalCode) => {
            const result = validatePostalCode(postalCode);

            expect(result).toEqual({
                valid: false,
                error: 'add_location.validation_postal_code_format'
            });
        }
    );
});
