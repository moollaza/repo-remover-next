import { expect, test } from "@playwright/test";

import {
  mockGraphQLRepos,
  mockLocalStorage,
  mockOctokitInit,
} from "./utils/github-api-mocks";

test.describe("Theme Functionality", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (where theme switcher is located)
    await page.goto("/dashboard");

    // Wait for the page to load
    await page.waitForLoadState("domcontentloaded");
  });

  test("theme switcher displays proper icons", async ({ page }) => {
    // Find the theme switcher button
    const themeSwitcher = page.getByRole("button", { name: /switch to.*theme/i });
    await expect(themeSwitcher).toBeVisible();

    // Check that it contains SVG icons (not emoji text)
    const svg = themeSwitcher.locator("svg");
    await expect(svg).toBeVisible();

    // Should not contain emoji text
    const buttonText = await themeSwitcher.textContent();
    expect(buttonText).not.toMatch(/[🌙☀️]/);
  });

  test("can switch between light and dark themes", async ({ page }) => {
    // Check initial theme (should be light by default)
    const html = page.locator("html");

    // Get theme switcher
    const themeSwitcher = page.getByRole("button", { name: /switch to.*theme/i });

    // Switch to dark theme
    await themeSwitcher.click();

    // Wait for theme change
    await page.waitForTimeout(500);

    // Check that dark class is applied
    await expect(html).toHaveClass(/dark/);

    // Verify dark theme colors are applied (check background color)
    const background = page.locator("body");
    const bgColor = await background.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );

    // Dark theme should have a dark background (not white/light)
    expect(bgColor).not.toBe("rgb(255, 255, 255)");

    // Switch back to light theme
    await themeSwitcher.click();
    await page.waitForTimeout(500);

    // Check that dark class is removed
    await expect(html).not.toHaveClass(/dark/);
  });

  test("theme preference persists across page reloads", async ({ page }) => {
    // Switch to dark theme
    const themeSwitcher = page.getByRole("button", { name: /switch to.*theme/i });
    await themeSwitcher.click();
    await page.waitForTimeout(500);

    // Verify dark theme is active
    const html = page.locator("html");
    await expect(html).toHaveClass(/dark/);

    // Reload the page
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000); // Give theme time to initialize

    // Check that dark theme is still active after reload
    await expect(html).toHaveClass(/dark/);
  });

  test("dark theme has proper contrast and visibility", async ({ page }) => {
    // Set up auth to access dashboard content
    await mockLocalStorage(page);
    await mockOctokitInit(page);
    await mockGraphQLRepos(page);
    await page.goto("/dashboard");
    await page.waitForSelector('[data-testid="repo-table-header"]', { state: 'visible' });

    // Switch to dark theme
    const themeSwitcher = page.getByRole("button", { name: /switch to.*theme/i });
    await themeSwitcher.click();
    await page.waitForTimeout(500);

    // Wait for dark theme to be applied
    const html = page.locator("html");
    await expect(html).toHaveClass(/dark/);

    // Check main content areas have proper dark theme colors using testid
    const titleText = page.getByTestId("repo-table-header");
    await expect(titleText).toBeVisible();

    const textColor = await titleText.evaluate((el) =>
      window.getComputedStyle(el).color
    );

    // Text should be light colored in dark theme (not pure black)
    expect(textColor).not.toBe("rgb(0, 0, 0)"); // Should not be black text

    // Check body background is dark
    const body = page.locator("body");
    const bodyBg = await body.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );

    // Dark theme should not have white background
    expect(bodyBg).not.toBe("rgb(255, 255, 255)");
  });

  test("keyboard shortcuts work in both themes", async ({ page }) => {
    // Set up auth to access dashboard content
    await mockLocalStorage(page);
    await mockOctokitInit(page);
    await mockGraphQLRepos(page);
    await page.goto("/dashboard");

    // Wait for data to load and search input to be available
    await page.waitForSelector('[data-testid="repo-search-input"]', { state: 'visible' });

    // Test in light theme first
    const searchInput = page.getByTestId("repo-search-input");
    await expect(searchInput).toBeVisible();

    // Verify search input is not focused initially
    await expect(searchInput).not.toBeFocused();

    // Use Cmd+K to focus search input
    await page.keyboard.press("Meta+k");
    await expect(searchInput).toBeFocused();

    // Clear focus
    await page.keyboard.press("Escape");

    // Switch to dark theme
    const themeSwitcher = page.getByRole("button", { name: /switch to.*theme/i });
    await themeSwitcher.click();
    await page.waitForTimeout(500);

    // Test keyboard shortcut still works in dark theme
    await expect(searchInput).not.toBeFocused();
    await page.keyboard.press("Meta+k");
    await expect(searchInput).toBeFocused();
  });
});