import { vi } from 'vitest';

export const authClient = {
    signIn: {
        email: vi.fn().mockResolvedValue({ data: null, error: { message: 'Invalid credentials' } }),
        social: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    signUp: {
        email: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
};
