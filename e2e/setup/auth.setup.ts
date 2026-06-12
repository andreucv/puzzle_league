import { test as setup, expect } from '@playwright/test';
import { AUTH_FILES, type Role } from '../fixtures';
import { loginViaUi } from '../utils/auth';
import { gotoHydrated } from '../utils/navigation';

/**
 * Logs in each bootstrap user once and saves its storage state for the role
 * fixtures (see fixtures.ts). Credentials come from .env and match the users
 * created by scripts/db_migration/action_seed_local_users.ts.
 */
const CREDENTIALS: Record<Role, { email?: string; password?: string }> = {
    participant: {
        email: process.env.TEST_PARTICIPANT_USER_EMAIL,
        password: process.env.TEST_PARTICIPANT_USER_PASSWORD,
    },
    organizer: {
        email: process.env.TEST_ORGANIZER_USER_EMAIL,
        password: process.env.TEST_ORGANIZER_USER_PASSWORD,
    },
    admin: {
        email: process.env.TEST_ADMIN_USER_EMAIL,
        password: process.env.TEST_ADMIN_USER_PASSWORD,
    },
};

for (const role of Object.keys(AUTH_FILES) as Role[]) {
    setup(`authenticate ${role}`, async ({ page }) => {
        const { email, password } = CREDENTIALS[role];
        if (!email || !password) {
            throw new Error(`Missing TEST_${role.toUpperCase()}_USER_EMAIL/PASSWORD in .env`);
        }

        await loginViaUi(page, email, password);

        if (role === 'admin') {
            // Sanity-check the admin role actually applied before saving state
            await gotoHydrated(page, '/profile');
            await expect(page.getByTestId('profile-admin-role-chip')).toBeVisible();
        }

        await page.context().storageState({ path: AUTH_FILES[role] });
    });
}
