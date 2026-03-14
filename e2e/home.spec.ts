import { expect, test } from "@playwright/test";

import { getValidPersonalAccessToken } from "@/mocks/static-fixtures";

import { HomePage } from "./pages/home";
import { mockGraphQLRepos, mockInvalidToken } from "./utils/github-api-mocks";

test.describe("Home Page", () => {
  let home: HomePage;
  const validToken = getValidPersonalAccessToken();

  test.beforeEach(async ({ page }) => {
    home = new HomePage(page);
    await home.setupMocks();
    await home.goto();
  });

  test("should display with correct initial state", async () => {
    // Check that navigation is visible
    await expect(home.navbar).toBeVisible();
    await expect(home.navbar.getByText("Repo Remover")).toBeVisible();
    await expect(home.navbar.getByText("Test User")).not.toBeVisible();

    await home.expectHeading("Archive or Delete Multiple GitHub Repos,");

    // Token form is now in the "Get Started" section further down the page
    // Scroll down to verify it's there
    await home.page.getByText("Ready to start?").scrollIntoViewIfNeeded();
    await home.expectSubmitDisabled();
  });

  test("should show error for invalid token format", async () => {
    // Test invalid format (too short)
    await home.fillToken("short");
    await home.expectErrorMessage("Invalid GitHub token format");
    await home.expectSubmitDisabled();

    // Test invalid format (wrong prefix)
    await home.fillToken("invalid_token_123456789012345678901234567890123456");
    await home.expectErrorMessage("Invalid GitHub token format");
    await home.expectSubmitDisabled();

    // Test empty input
    await home.clearToken();
    await home.expectSubmitDisabled();
  });

  test("should show error for invalid token", async () => {
    await mockInvalidToken(home.page);
    await home.fillToken(validToken);

    // Should show error state after API response
    await home.expectErrorMessage("Invalid or expired token");
    await home.expectSubmitDisabled();
  });

  test("should handle successful token validation", async () => {
    await mockGraphQLRepos(home.page);
    await home.fillToken(validToken);

    // Should enable submit after successful validation
    await home.expectSubmitEnabled();

    // Submit should navigate to dashboard
    await home.submit();
    await expect(home.page).toHaveURL("/dashboard");
  });

  // TODO: Add fix remember me checkbox
  // TODO: Switch to opt-in for remember me
  test.skip("should handle remember me checkbox", async () => {
    // Should be checked by default
    await expect(home.rememberCheckbox).toBeChecked();

    // Should be toggleable
    await home.toggleRememberMe();
    await expect(home.rememberCheckbox).not.toBeChecked();
  });
});
