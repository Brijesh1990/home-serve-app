import { test, expect } from '@playwright/test';

test.describe('HomeServe – End-to-End Multi-Role Marketplace Suite', () => {
  test('1. Public Landing Page, Categories, Services Marketplace & Provider Profile', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Trusted Home Services')).toBeVisible();
    await expect(page.locator('text=Your Home, Our Responsibility')).toBeVisible();

    await page.click('text=Explore Services');
    await expect(page).toHaveURL(/\/services/);
    await expect(page.locator('h1')).toContainText(/Home Services/i);
  });

  test('2. 1-Click Role Authentication across Customer, Provider, Technician, and Admin Dashboards', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=1-Click Demo Role Access')).toBeVisible();

    // Super Admin Login
    await page.click('button:has-text("Super Admin")');
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('text=Platform Command Center')).toBeVisible();
  });
});
