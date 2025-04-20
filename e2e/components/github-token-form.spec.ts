import { expect, test } from "@playwright/test";

import { mockOctokitInit } from "../utils/github-api-mocks";

// Add a mock for token validation failure
async function mockInvalidToken(page) {
  await page.route("https://api.github.com/user", (route) => {
    void route.fulfill({
      body: JSON.stringify({
        documentation_url: "https://docs.github.com/rest",
        message: "Bad credentials",
      }),
      status: 401,
    });
  });
}

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
    await tokenInput.fill("invalid-token-format");

    // Check if error message is displayed
    await expect(page.getByText("Invalid GitHub token format")).toBeVisible();

    // Submit button should remain disabled
    const submitButton = page.getByRole("button", { name: "Submit" });
    await expect(submitButton).toBeDisabled();
  });

  test("should handle valid token submission", async ({ page }) => {
    await page.goto("/");

    // Use the mockOctokitInit function for consistent mocking
    await mockOctokitInit(page);

    // Fill in a valid token with the correct format
    const tokenInput = page.getByLabel(
      "Please enter your Personal Access Token",
    );
    await tokenInput.fill("ghp_abcdefghijklmnopqrstuvwxyz1234567890");

    // Check for input description area which should contain our success message
    const inputDescription = page.locator(".heroui-input-description");
    await expect(inputDescription).toContainText("Token is valid", {
      timeout: 5000,
    });
    await expect(inputDescription).toContainText("Welcome testuser", {
      timeout: 5000,
    });

    // Now the submit button should be enabled
    const submitButton = page.getByRole("button", { name: "Submit" });
    await expect(submitButton).toBeEnabled({ timeout: 5000 });

    // Click the submit button
    await submitButton.click();

    // Check if we're redirected to the dashboard
    await expect(page).toHaveURL("/dashboard");
  });

  test("should handle remember me checkbox (Note: Currently hardcoded)", async ({
    page,
  }) => {
    await page.goto("/");

    // Check if remember me checkbox is visible
    const rememberCheckbox = page.getByLabel(/Remember me/);
    await expect(rememberCheckbox).toBeVisible();

    // Note: The checkbox is hardcoded to true in the component with a TODO comment
    const checkboxInfo = page.getByText(
      "Remember me (token is stored locally, on your device)",
    );
    await expect(checkboxInfo).toBeVisible();

    // Since the checkbox is hardcoded to true, we should expect it to be checked
    await expect(rememberCheckbox).toBeChecked();
  });

  test("should handle token validation failure", async ({ page }) => {
    await page.goto("/");

    // Use the mockInvalidToken function to simulate invalid token
    await mockInvalidToken(page);

    // Fill in a token with correct format but invalid
    const tokenInput = page.getByLabel(
      "Please enter your Personal Access Token",
    );
    await tokenInput.fill("ghp_abcdefghijklmnopqrstuvwxyz1234567890");

    // Check if the error message is visible in the error message area
    const errorElement = page.locator(".heroui-input-error-message");
    await expect(errorElement).toContainText("Invalid or expired token", {
      timeout: 5000,
    });

    // Submit button should be disabled
    const submitButton = page.getByRole("button", { name: "Submit" });
    await expect(submitButton).toBeDisabled();
  });
});
