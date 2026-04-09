import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show login page for unauthenticated users', async ({ page }) => {
    await expect(page.locator('[data-testid=login-form]')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Login');
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.fill('[data-testid=email]', 'test@example.com');
    await page.fill('[data-testid=password]', 'password123');
    await page.click('[data-testid=login-button]');

    await expect(page.locator('[data-testid=dashboard]')).toBeVisible();
    await expect(page.url()).toContain('/dashboard');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.fill('[data-testid=email]', 'invalid@example.com');
    await page.fill('[data-testid=password]', 'wrongpassword');
    await page.click('[data-testid=login-button]');

    await expect(page.locator('[data-testid=error-message]')).toBeVisible();
    await expect(page.locator('[data-testid=error-message]')).toContainText('Invalid credentials');
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.click('[data-testid=register-link]');
    
    await expect(page.url()).toContain('/register');
    await expect(page.locator('[data-testid=register-form]')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('[data-testid=email]', 'test@example.com');
    await page.fill('[data-testid=password]', 'password123');
    await page.click('[data-testid=login-button]');
    await page.waitForURL('**/dashboard');

    // Then logout
    await page.click('[data-testid=user-menu]');
    await page.click('[data-testid=logout-button]');

    await expect(page.locator('[data-testid=login-form]')).toBeVisible();
    await expect(page.url()).toContain('/login');
  });

  test('should remember user session', async ({ page }) => {
    await page.fill('[data-testid=email]', 'test@example.com');
    await page.fill('[data-testid=password]', 'password123');
    await page.check('[data-testid=remember-me]');
    await page.click('[data-testid=login-button]');

    await page.waitForURL('**/dashboard');

    // Reload page
    await page.reload();

    await expect(page.locator('[data-testid=dashboard]')).toBeVisible();
  });
});
