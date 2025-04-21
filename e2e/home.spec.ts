import { test } from "@playwright/test";

import { HomePage } from "./pages/home";

test.describe("Home Page", () => {
  let home: HomePage;

  test.beforeEach(async ({ page }) => {
    home = new HomePage(page);
    await home.goto();
  });

  test("should display the landing page correctly", async () => {
    await home.expectHeading(
      "Archive or Delete Multiple GitHub Repos, Instantly.",
    );
    await home.expectSubmitDisabled();
  });

  test("should show error for invalid token format", async () => {
    // Test invalid format (too short)
    await home.fillToken("short");
    await home.expectErrorMessage("Invalid token format");
    await home.expectSubmitDisabled();

    // Test invalid format (wrong prefix)
    await home.fillToken("invalid_token_123456789012345678901234567890123456");
    await home.expectErrorMessage("Invalid token format");
    await home.expectSubmitDisabled();

    // Test empty input
    await home.clearToken();
    await home.expectSubmitDisabled();
  });

  test("should show error for expired/invalid token", async () => {
    const invalidToken = "ghp_validformatbutexpiredtoken12345678901234";
    await home.mockInvalidToken(invalidToken);
    await home.fillToken(invalidToken);

    // Should show loading state initially
    await home.expectSubmitLoading();

    // Should show error state after API response
    await home.expectErrorMessage("Failed to validate token");
    await home.expectSubmitDisabled();
  });

  test("should handle successful token validation", async () => {
    const validToken = "ghp_abcdefghijklmnopqrstuvwxyz1234567890";
    await home.mockValidToken(validToken);
    await home.fillToken(validToken);

    // Should show loading state initially
    await home.expectSubmitLoading();

    // Should enable submit after successful validation
    await home.expectSubmitEnabled();

    // Submit should navigate to dashboard
    await home.submit();
    await home.expectOnDashboard();
  });

  test("should handle remember me checkbox", async () => {
    // Should be unchecked by default
    await home.rememberCheckbox
      .isChecked()
      .then((checked) => expect(checked).toBe(false));

    // Should be toggleable
    await home.toggleRememberMe();
    await home.rememberCheckbox
      .isChecked()
      .then((checked) => expect(checked).toBe(true));

    await home.toggleRememberMe();
    await home.rememberCheckbox
      .isChecked()
      .then((checked) => expect(checked).toBe(false));
  });
});
