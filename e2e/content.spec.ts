import { test, expect } from '@playwright/test';

test.describe('Content Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid=email]', 'test@example.com');
    await page.fill('[data-testid=password]', 'password123');
    await page.click('[data-testid=login-button]');
    await page.waitForURL('**/dashboard');
  });

  test('should display content grid', async ({ page }) => {
    await page.goto('/dashboard');
    
    await expect(page.locator('[data-testid=content-grid]')).toBeVisible();
    await expect(page.locator('[data-testid=content-card]')).toHaveCount.greaterThan(0);
  });

  test('should search for content', async ({ page }) => {
    await page.goto('/dashboard');
    
    await page.fill('[data-testid=search-input]', 'Inception');
    await page.click('[data-testid=search-button]');

    await expect(page.locator('[data-testid=search-results]')).toBeVisible();
    await expect(page.locator('[data-testid=content-card]')).toContainText('Inception');
  });

  test('should filter content by genre', async ({ page }) => {
    await page.goto('/dashboard');
    
    await page.click('[data-testid=genre-filter]');
    await page.click('[data-testid=genre-science-fiction]');

    await expect(page.locator('[data-testid=content-grid]')).toBeVisible();
    // Verify filtered results contain only science fiction
    const cards = page.locator('[data-testid=content-card]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should play content when clicking play button', async ({ page }) => {
    await page.goto('/dashboard');
    
    await page.click('[data-testid=content-card]:first-child [data-testid=play-button]');

    await expect(page.locator('[data-testid=video-player]')).toBeVisible();
    await expect(page.url()).toContain('/watch');
  });

  test('should update watch progress', async ({ page }) => {
    await page.goto('/dashboard');
    
    await page.click('[data-testid=content-card]:first-child [data-testid=play-button]');
    
    // Wait for video to load
    await page.waitForSelector('[data-testid=video-player]');
    
    // Simulate watching for 5 seconds
    await page.waitForTimeout(5000);
    
    // Check if progress is updated
    await page.click('[data-testid=back-button]');
    
    const progressCard = page.locator('[data-testid=continue-watching-card]:first-child');
    await expect(progressCard).toBeVisible();
    await expect(progressCard).toContainText('50%');
  });

  test('should add to favorites', async ({ page }) => {
    await page.goto('/dashboard');
    
    const firstCard = page.locator('[data-testid=content-card]:first-child');
    await firstCard.click('[data-testid=favorite-button]');

    await expect(firstCard.locator('[data-testid=favorite-button]')).toHaveClass('active');
    
    // Verify in favorites section
    await page.click('[data-testid=favorites-tab]');
    await expect(page.locator('[data-testid=favorites-grid]')).toBeVisible();
    await expect(page.locator('[data-testid=content-card]')).toHaveCount.greaterThan(0);
  });

  test('should show content details', async ({ page }) => {
    await page.goto('/dashboard');
    
    await page.click('[data-testid=content-card]:first-child [data-testid=details-button]');

    await expect(page.locator('[data-testid=content-details]')).toBeVisible();
    await expect(page.locator('[data-testid=content-title]')).toBeVisible();
    await expect(page.locator('[data-testid=content-description]')).toBeVisible();
    await expect(page.locator('[data-testid=content-metadata]')).toBeVisible();
  });

  test('should handle infinite scroll', async ({ page }) => {
    await page.goto('/dashboard');
    
    const initialCount = await page.locator('[data-testid=content-card]').count();
    
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Wait for more content to load
    await page.waitForTimeout(2000);
    
    const newCount = await page.locator('[data-testid=content-card]').count();
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('should work on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    
    await expect(page.locator('[data-testid=mobile-menu]')).toBeVisible();
    await expect(page.locator('[data-testid=content-grid]')).toBeVisible();
    
    // Test mobile navigation
    await page.click('[data-testid=mobile-menu]');
    await expect(page.locator('[data-testid=mobile-nav]')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('**/api/content', route => route.abort());
    
    await page.goto('/dashboard');
    
    await expect(page.locator('[data-testid=error-state]')).toBeVisible();
    await expect(page.locator('[data-testid=error-message]')).toContainText('Failed to load content');
    
    // Test retry functionality
    await page.click('[data-testid=retry-button]');
    
    // Should show loading state
    await expect(page.locator('[data-testid=loading-spinner]')).toBeVisible();
  });
});
