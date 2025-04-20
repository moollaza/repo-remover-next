import { expect, test } from "@playwright/test";

import { mockInvalidToken, mockOctokitInit } from "../utils/github-api-mocks";

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
    // First set up the mock before navigating to the page
    await mockOctokitInit(page);

    // Now navigate to the page
    await page.goto("/");

    // Get the token input element
    const tokenInput = page.getByLabel(
      "Please enter your Personal Access Token",
    );

    // Use a valid token that matches the expected format (40 chars with prefix)
    const validToken = "ghp_1234567890abcdefghijklmnopqrstuvwxyz";

    // Set up request interception to verify the API call
    const apiRequestPromise = page.waitForRequest((request) => {
      // Verify that the request is going to the correct endpoint
      const isGitHubUserEndpoint =
        request.url() === "https://api.github.com/user";

      // Verify that the Authorization header contains our token
      const hasCorrectAuth =
        request.headers().authorization === `token ${validToken}`;

      return isGitHubUserEndpoint && hasCorrectAuth;
    });

    // Set up response interception to verify the API response
    const apiResponsePromise = page.waitForResponse((response) => {
      return (
        response.url() === "https://api.github.com/user" &&
        response.status() === 200
      );
    });

    // Clear the input and type the token
    await tokenInput.clear();
    await tokenInput.fill(validToken);

    // Wait for the API request and response to be made
    await apiRequestPromise;
    await apiResponsePromise;

    // Instead of looking for the exact message, check if the submit button becomes enabled
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
    // First set up the mock before navigating to the page
    await mockInvalidToken(page);

    // Now navigate to the page
    await page.goto("/");

    // Get the token input element
    const tokenInput = page.getByLabel(
      "Please enter your Personal Access Token",
    );

    // Use a valid format token but that will fail validation due to our mock
    const validFormatToken = "ghp_1234567890abcdefghijklmnopqrstuvwxyz";

    // Set up request interception to verify the API call
    const apiRequestPromise = page.waitForRequest((request) => {
      // Verify that the request is going to the correct endpoint
      const isGitHubUserEndpoint =
        request.url() === "https://api.github.com/user";

      // Verify that the Authorization header contains our token
      const hasCorrectAuth =
        request.headers().authorization === `token ${validFormatToken}`;

      return isGitHubUserEndpoint && hasCorrectAuth;
    });

    // Set up response interception to verify the API response
    const apiResponsePromise = page.waitForResponse((response) => {
      return (
        response.url() === "https://api.github.com/user" &&
        response.status() === 401
      );
    });

    // Clear the input and type the token
    await tokenInput.clear();
    await tokenInput.fill(validFormatToken);

    // Wait for the API request and response to be made
    await apiRequestPromise;
    await apiResponsePromise;

    // Check if the error message is visible anywhere on the page
    await expect(page.getByText("Invalid or expired token")).toBeVisible({
      timeout: 5000,
    });

    // Submit button should be disabled
    const submitButton = page.getByRole("button", { name: "Submit" });
    await expect(submitButton).toBeDisabled();
  });
});
