import { expect, test } from "@playwright/test";

test.describe("GitHubTokenForm Component", () => {
  test("should render the form correctly", async ({ page }) => {
    await page.goto("/");

    // Check if the form elements are visible
    const tokenInput = page.getByLabel(
      "Please enter your Personal Access Token",
    );
    await expect(tokenInput).toBeVisible();

    const rememberCheckbox = page.getByLabel(/Remember me/);
    await expect(rememberCheckbox).toBeVisible();

    const submitButton = page.getByRole("button", { name: "Submit" });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeDisabled(); // Should be disabled initially
  });

  test("should show error for invalid token format", async ({ page }) => {
    await page.goto("/");

    const tokenInput = page.getByLabel(
      "Please enter your Personal Access Token",
    );
    await tokenInput.fill("invalid-token");

    // Check if error message is displayed
    await expect(page.getByText("Invalid token format")).toBeVisible();

    // Submit button should remain disabled
    const submitButton = page.getByRole("button", { name: "Submit" });
    await expect(submitButton).toBeDisabled();
  });

  test("should handle valid token submission", async ({ page }) => {
    await page.goto("/");

    // Mock the GitHub API response for token validation
    await page.route("https://api.github.com/user", (route) => {
      void route.fulfill({
        body: JSON.stringify({
          avatarUrl: "https://avatars.githubusercontent.com/u/12345?v=4",
          login: "testuser",
          name: "Test User",
        }),
        status: 200,
      });
    });

    // Fill in a valid token
    const tokenInput = page.getByLabel(
      "Please enter your Personal Access Token",
    );
    await tokenInput.fill("ghp_validtoken123456789012345678901234567890");

    // Wait for validation to complete and submit button to be enabled
    const submitButton = page.getByRole("button", { name: "Submit" });
    await expect(submitButton).toBeEnabled({ timeout: 5000 });

    // Click the submit button
    await submitButton.click();

    // Check if we're redirected to the dashboard
    await expect(page).toHaveURL("/dashboard");
  });

  test("should handle remember me checkbox", async ({ page }) => {
    await page.goto("/");

    // Check if remember me checkbox is unchecked by default
    const rememberCheckbox = page.getByLabel(/Remember me/);
    await expect(rememberCheckbox).not.toBeChecked();

    // Toggle the checkbox
    await rememberCheckbox.check();
    await expect(rememberCheckbox).toBeChecked();

    // Toggle it again
    await rememberCheckbox.uncheck();
    await expect(rememberCheckbox).not.toBeChecked();
  });

  test("should handle token validation failure", async ({ page }) => {
    await page.goto("/");

    // Mock the GitHub API response for token validation failure
    await page.route("https://api.github.com/user", (route) => {
      void route.fulfill({
        body: JSON.stringify({ message: "Bad credentials" }),
        status: 401,
      });
    });

    // Fill in a token
    const tokenInput = page.getByLabel(
      "Please enter your Personal Access Token",
    );
    await tokenInput.fill("ghp_invalidtoken123456789012345678901234567890");

    // Check if error message is displayed
    await expect(page.getByText("Failed to validate token")).toBeVisible({
      timeout: 5000,
    });

    // Submit button should be disabled
    const submitButton = page.getByRole("button", { name: "Submit" });
    await expect(submitButton).toBeDisabled();
  });
});
