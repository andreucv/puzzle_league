import { expect, test, AUTH_FILES } from '../fixtures';
import { gotoHydrated } from '../utils/navigation';

test.describe('Anonymous user mobile navigation', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('GivenMobileLandingPage_WhenPageLoads_ThenHamburgerMenuIsVisible', async ({ page }) => {
        await gotoHydrated(page, '/');
        await expect(page.locator('#states-button')).toBeVisible();
    });

    test('GivenMobileLandingPage_WhenClickingHamburgerMenu_ThenDrawerOpens', async ({ page }) => {
        await gotoHydrated(page, '/');
        await page.locator('#states-button').click();
        await expect(page.getByTestId('nav-drawer-home')).toBeVisible();
    });

    test('GivenMobileDrawerOpen_WhenClickingCloseButton_ThenDrawerCloses', async ({ page }) => {
        await gotoHydrated(page, '/');
        await page.locator('#states-button').click();
        await expect(page.getByTestId('nav-drawer-home')).toBeVisible();

        await page.getByTestId('nav-drawer-close-button').click();
        await expect(page.getByTestId('nav-drawer-home')).not.toBeVisible();
    });

    test('GivenMobileDrawerOpen_WhenClickingHomeLink_ThenNavigatesToHomeAndClosesDrawer', async ({ page }) => {
        await gotoHydrated(page, '/login');
        await page.locator('#states-button').click();
        await page.getByTestId('nav-drawer-home').click();

        await page.waitForURL('/');
        await expect(page.getByTestId('nav-drawer-home')).not.toBeVisible();
    });
});

test.describe('Organizer user mobile navigation', () => {
    test.use({ storageState: AUTH_FILES.organizer });

    test('GivenOrganizerMobile_WhenClickingCreateCompetition_ThenNavigatesToEditPage', async ({ page }) => {
        await gotoHydrated(page, '/');
        await page.locator('#states-button').click();
        await page.getByTestId('nav-drawer-create-competition').click();

        await page.waitForURL('/competition/edit');
        await expect(page.getByTestId('create-competition-heading')).toBeVisible();
    });
});

test.describe('Admin user mobile navigation', () => {
    test.use({ storageState: AUTH_FILES.admin });

    test('GivenAdminMobile_WhenClickingReviewRequests_ThenNavigatesToAdminPage', async ({ page }) => {
        await gotoHydrated(page, '/');
        await page.locator('#states-button').click();
        await page.getByTestId('nav-drawer-review-permissions-requests').click();

        await page.waitForURL('/admin/review_requests');
    });
});

test.describe('Mobile touch interactions', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('GivenMobileViewport_WhenTappingOutsideDrawer_ThenDrawerCloses', async ({ page }) => {
        await gotoHydrated(page, '/');
        await page.locator('#states-button').click();
        await expect(page.getByTestId('nav-drawer-home')).toBeVisible();

        await page.getByTestId('nav-drawer-close-button').click();

        // Drawer should close
        await expect(page.getByTestId('nav-drawer-home')).not.toBeVisible();
    });

    test('GivenMobileViewport_WhenNavigatingViaDrawer_ThenPageScrollsToTop', async ({ page }) => {
        await gotoHydrated(page, '/');

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
