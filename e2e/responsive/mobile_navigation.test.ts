import { expect, test, devices } from '@playwright/test';

test.describe('Anonymous user mobile navigation', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('GivenMobileLandingPage_WhenPageLoads_ThenHamburgerMenuIsVisible', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#states-button')).toBeVisible();
    });

    test('GivenMobileLandingPage_WhenClickingHamburgerMenu_ThenDrawerOpens', async ({ page }) => {
        await page.goto('/');
        await page.locator('#states-button').click();
        await expect(page.getByTestId('nav-drawer-home')).toBeVisible();
    });

    test('GivenMobileDrawerOpen_WhenClickingCloseButton_ThenDrawerCloses', async ({ page }) => {
        await page.goto('/');
        await page.locator('#states-button').click();
        await expect(page.getByTestId('nav-drawer-home')).toBeVisible();

        // Click the close button (icon-park:close)
        await page.getByRole('navigation').locator('div').filter({ hasText: 'PuzzLigas' }).getByRole('button').first().click();
        await expect(page.getByTestId('nav-drawer-home')).not.toBeVisible();
    });

    test('GivenMobileDrawerOpen_WhenClickingHomeLink_ThenNavigatesToHomeAndClosesDrawer', async ({ page }) => {
        await page.goto('/login');
        await page.locator('#states-button').click();
        await page.getByTestId('nav-drawer-home').click();

        await page.waitForURL('/');
        await expect(page.getByTestId('nav-drawer-home')).not.toBeVisible();
    });
});

test.describe('Organizer user mobile navigation', () => {
    test.use({ storageState: 'playwright/.auth/organizer_user.json' });

    test('GivenOrganizerMobile_WhenClickingCreateCompetition_ThenNavigatesToEditPage', async ({ page }) => {
        await page.goto('/');
        await page.locator('#states-button').click();
        await page.getByTestId('nav-drawer-create-competition').click();

        await page.waitForURL('/competition/edit');
        await expect(page.getByRole('heading', { name: 'Create new competition' })).toBeVisible();
    });
});

test.describe('Admin user mobile navigation', () => {
    test.use({ storageState: 'playwright/.auth/admin_user.json' });

    test('GivenAdminMobile_WhenClickingReviewRequests_ThenNavigatesToAdminPage', async ({ page }) => {
        await page.goto('/');
        await page.locator('#states-button').click();
        await page.getByRole('link', { name: 'Review Permissions Requests', exact: true }).click();

        await page.waitForURL('/admin/review_requests');
    });
});

test.describe('Mobile touch interactions', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('GivenMobileViewport_WhenTappingOutsideDrawer_ThenDrawerCloses', async ({ page }) => {
        await page.goto('/');
        await page.locator('#states-button').click();
        await expect(page.getByTestId('nav-drawer-home')).toBeVisible();

        // Click outside the drawer (on the backdrop)
        await page.getByTestId('nav-drawer-close-button').click();

        // Drawer should close
        await expect(page.getByTestId('nav-drawer-home')).not.toBeVisible({ timeout: 5000 });
    });

    test('GivenMobileViewport_WhenNavigatingViaDrawer_ThenPageScrollsToTop', async ({ page }) => {
        await page.goto('/');

        // Scroll down first
        await page.evaluate(() => window.scrollTo(0, 500));

        await page.locator('#states-button').click();
        await page.getByTestId('nav-drawer-home').click();
        await page.waitForURL('/');

        // Check scroll position is at top
        const scrollY = await page.evaluate(() => window.scrollY);
        expect(scrollY).toBe(0);
    });
});
