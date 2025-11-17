/**
 * E2E tests for homepage
 *
 * Uses mocked API responses via Playwright route interception
 * to avoid making real network requests during testing.
 */

import { test, expect, mockUsers } from './fixtures';

test.describe('Homepage', () => {
  test('displays the top users leaderboard', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page.getByRole('heading', { name: 'Layer3 Top Users' })).toBeVisible();

    // Check description
    await expect(page.getByText('Celebrating our most active community members')).toBeVisible();
  });

  test('shows top 3 users in podium view', async ({ page }) => {
    await page.goto('/');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Should show user avatars for our mocked users
    const avatars = page.locator('[alt*="avatar"]');
    await expect(avatars.first()).toBeVisible();

    // Should have at least 3 users (our mock data)
    const avatarCount = await avatars.count();
    expect(avatarCount).toBeGreaterThanOrEqual(3);
  });

  test('allows navigation to user detail page', async ({ page }) => {
    await page.goto('/');

    // Wait for data to load
    await page.waitForLoadState('networkidle');

    // Click on the first user
    const userLink = page.locator('a[href^="/user/"]').first();
    await userLink.click();

    // Should navigate to user page with valid address format
    await expect(page).toHaveURL(/\/user\/0x[a-fA-F0-9]{40}/);

    // Should show back link
    await expect(page.getByText('← Back to leaderboard')).toBeVisible();
  });
});

test.describe('User Detail Page', () => {
  test('displays 404 for invalid address', async ({ page }) => {
    // Use Next.js's 404 page check
    const response = await page.goto('/user/0xinvalidaddress');

    // Should return 404 status
    expect(response?.status()).toBe(404);
  });

  test('displays user details for valid address', async ({ page }) => {
    // Use the first mock user's address
    await page.goto(`/user/${mockUsers[0].address}`);

    // Should show back link
    await expect(page.getByText('← Back to leaderboard')).toBeVisible();

    // Should show username
    await expect(page.getByText(mockUsers[0].username)).toBeVisible();

    // Should show wallet info section
    await expect(page.getByText(/wallet/i)).toBeVisible();
  });
});
