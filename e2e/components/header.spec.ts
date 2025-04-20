import { expect, test } from "@playwright/test";

import { mockOctokitInit } from "../utils/github-api-mocks";

test.describe("Header Component", () => {
  test("should display the header correctly on home page", async ({ page }) => {
    await page.goto("/");

    // Look for the Navbar containing the brand
    const navbar = page.locator("nav").first();
    await expect(navbar).toBeVisible();

    // Check if the brand link containing "Repo Remover" text is visible
    // Use a more flexible approach to find the brand
    const brand = navbar.getByText("Repo Remover");
    await expect(brand).toBeVisible();

    // Check if navigation links are visible
    await expect(page.getByRole("link", { name: "Features" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "How It Works" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Get Started" })).toBeVisible();
  });

  test("should not display navigation links on dashboard page", async ({
    page,
  }) => {
    // Set up authentication
    await page.addInitScript(() => {
      localStorage.setItem(
        "pat",
        "ghp_validtoken123456789012345678901234567890",
      );
      localStorage.setItem("login", "testuser");
    });

    // Use the mockOctokitInit function for consistent mocking
    await mockOctokitInit(page);

    await page.goto("/dashboard");

    // We need to wait for the page to load and process authentication
    await page.waitForLoadState("networkidle");

    // Check if the brand is visible
    const navbar = page.locator("nav").first();
    await expect(navbar).toBeVisible();

    const brand = navbar.getByText("Repo Remover");
    await expect(brand).toBeVisible();

    // Check that navigation links are not visible
    await expect(
      page.getByRole("link", { name: "Features" }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("link", { name: "How It Works" }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("link", { name: "Get Started" }),
    ).not.toBeVisible();

    // Check that the user avatar is visible - using a more reliable selector
    const userAvatar = page.locator(
      'svg[aria-label="avatar"], span[aria-label="avatar"]',
    );
    await expect(userAvatar).toBeVisible();
  });

  test("should show dashboard link when authenticated on home page", async ({
    page,
  }) => {
    // Set up authentication
    await page.addInitScript(() => {
      localStorage.setItem(
        "pat",
        "ghp_validtoken123456789012345678901234567890",
      );
      localStorage.setItem("login", "testuser");
    });

    // Use the mockOctokitInit function for consistent mocking
    await mockOctokitInit(page);

    await page.goto("/");

    // We need to wait for the page to load and process authentication
    await page.waitForLoadState("networkidle");

    // Check if the dashboard link is visible
    // Use a more general button selector that would match the dashboard link
    const dashboardLink = page
      .getByRole("link", { name: /dashboard/i })
      .or(page.getByRole("button", { name: /dashboard/i }));

    await expect(dashboardLink).toBeVisible();
  });

  test("should allow logout from dashboard", async ({ page }) => {
    // Set up authentication
    await page.addInitScript(() => {
      localStorage.setItem(
        "pat",
        "ghp_validtoken123456789012345678901234567890",
      );
      localStorage.setItem("login", "testuser");
    });

    // Use the mockOctokitInit function for consistent mocking
    await mockOctokitInit(page);

    await page.goto("/dashboard");

    // We need to wait for the page to load and process authentication
    await page.waitForLoadState("networkidle");

    // User avatar should be visible
    const userAvatar = page.locator(
      'svg[aria-label="avatar"], span[aria-label="avatar"]',
    );
    await expect(userAvatar).toBeVisible();

    // Find the dropdown container that has the user avatar
    const dropdownContainer = page.locator('div[aria-haspopup="true"]');
    await expect(dropdownContainer).toBeVisible();

    // Click on the dropdown to open it
    await dropdownContainer.click();

    // Wait for dropdown menu to appear and find the logout option
    const logoutItem = page.getByText("Log Out");
    await expect(logoutItem).toBeVisible({ timeout: 10000 });

    // Click on the logout button
    await logoutItem.click();

    // Check if we're redirected to the home page
    await expect(page).toHaveURL("/");
  });
});
