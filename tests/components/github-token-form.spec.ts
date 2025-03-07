import { expect, test } from "@playwright/test";

// Define the window augmentation for TypeScript
declare global {
  interface Window {
    mockOctokit?: boolean;
    mockOctokitError?: {
      message: string;
      response: { status: number };
    };
    mockOctokitResponse?: {
      data: {
        avatar_url: string;
        login: string;
        name: string;
      };
    };
  }
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

    // Mock the Octokit API response for token validation
    await page.addInitScript(() => {
      // Define the mock objects on window
      window.mockOctokitResponse = {
        data: {
          avatar_url: "https://avatars.githubusercontent.com/u/12345?v=4",
          login: "testuser",
          name: "Test User",
        },
      };

      // Flag to indicate we want to use mocks
      window.mockOctokit = true;
    });

    // Intercept the module import and replace with mock
    await page.route("**/@octokit/rest.js", async (route) => {
      await route.fulfill({
        body: `
          export class Octokit {
            constructor() {
              this.users = {
                getAuthenticated: async () => {
                  if (window.mockOctokit) {
                    return window.mockOctokitResponse;
                  }
                  throw new Error('No mock defined');
                }
              };
            }
          }
        `,
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

    // Check for success message
    await expect(
      page.getByText(/Token is valid. Welcome testuser/),
    ).toBeVisible();

    // Click the submit button
    await submitButton.click();

    // Check if we're redirected to the dashboard
    await expect(page).toHaveURL("/dashboard");
  });

  test("should handle remember me checkbox", async ({ page }) => {
    await page.goto("/");

    // Check if remember me checkbox is checked by default (as per the component)
    const rememberCheckbox = page.getByLabel(/Remember me/);
    await expect(rememberCheckbox).toBeChecked();

    // Toggle the checkbox
    await rememberCheckbox.uncheck();
    await expect(rememberCheckbox).not.toBeChecked();

    // Toggle it again
    await rememberCheckbox.check();
    await expect(rememberCheckbox).toBeChecked();
  });

  test("should handle token validation failure", async ({ page }) => {
    await page.goto("/");

    // Mock the Octokit API response for token validation failure
    await page.addInitScript(() => {
      // Define the mock error on window
      window.mockOctokitError = {
        message: "Bad credentials",
        response: { status: 401 },
      };

      // Flag to indicate we want to use mocks
      window.mockOctokit = true;
    });

    // Intercept the module import and replace with mock
    await page.route("**/@octokit/rest.js", async (route) => {
      await route.fulfill({
        body: `
          export class Octokit {
            constructor() {
              this.users = {
                getAuthenticated: async () => {
                  if (window.mockOctokit) {
                    throw window.mockOctokitError;
                  }
                  throw new Error('No mock defined');
                }
              };
            }
          }
        `,
        status: 200,
      });
    });

    // Fill in a token
    const tokenInput = page.getByLabel(
      "Please enter your Personal Access Token",
    );
    await tokenInput.fill("ghp_invalidtoken123456789012345678901234567");

    // Check if error message is displayed
    await expect(page.getByText("Invalid or expired token")).toBeVisible({
      timeout: 5000,
    });

    // Submit button should be disabled
    const submitButton = page.getByRole("button", { name: "Submit" });
    await expect(submitButton).toBeDisabled();
  });
});
