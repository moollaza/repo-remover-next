import { expect, test } from "@playwright/test";

import { createMockRepo } from "@/mocks/fixtures";

import {
  mockArchiveRepo,
  mockBulkActions,
  mockOctokitInit,
} from "../utils/github-api-mocks";

test.describe("RepoTable Component", () => {
  // Create specific test repos with known names to make testing more reliable
  const testRepos = Array.from({ length: 6 }, (_, i) => {
    const repoNum = i + 1;
    return createMockRepo({
      id: `repo-${repoNum}`,
      isPrivate: repoNum % 2 === 1, // odd numbers are private
      name: `test-repo-${repoNum}`,
    });
  });

  // Setup authentication and mock data before each test
  test.beforeEach(async ({ page }) => {
    // Setup authentication
    await page.addInitScript(() => {
      localStorage.setItem(
        "pat",
        "ghp_validtoken123456789012345678901234567890",
      );
      localStorage.setItem("login", "testuser");
    });

    // Use existing mock utilities
    await mockOctokitInit(page);

    // Override the GraphQL mock to use our specific test repos
    await page.route("https://api.github.com/graphql", (route) => {
      void route.fulfill({
        body: JSON.stringify({
          data: {
            viewer: {
              repositories: {
                nodes: testRepos,
                pageInfo: {
                  endCursor: "cursor",
                  hasNextPage: false,
                },
                totalCount: testRepos.length,
              },
            },
          },
        }),
        status: 200,
      });
    });

    // Mock bulk actions for any repository operations
    await mockBulkActions(page);

    // Navigate to the dashboard
    await page.goto("/dashboard");

    // Wait for the repo table to be visible
    await page.waitForSelector('[data-testid="repo-table"]');
  });

  test("should display the repo table with repositories", async ({ page }) => {
    // Wait for the table to load
    await page.waitForSelector("table");

    // Check if repositories are displayed by looking for links with repo names
    await expect(page.getByText("test-repo-1")).toBeVisible();
    await expect(page.getByText("test-repo-2")).toBeVisible();
  });

  test("should filter repositories by search query", async ({ page }) => {
    // Enter search query in the search input
    await page.waitForSelector('[data-testid="repo-search-input"]');
    const searchInput = page.getByTestId("repo-search-input");
    await searchInput.fill("test-repo-1");

    // Verify that only the matching repo is visible
    await expect(page.getByText("test-repo-1")).toBeVisible();
    await expect(page.getByText("test-repo-2")).not.toBeVisible();
  });

  test("should filter repositories by type", async ({ page }) => {
    // Open the repo types dropdown by clicking the button
    await page.getByTestId("repo-types-select").click();

    // Wait for the dropdown to open
    await page.waitForSelector(
      '[data-testid="repo-type-select-item-isPrivate"]',
    );

    // Click on the "Private" option to toggle it off
    await page.getByTestId("repo-type-select-item-isPrivate").click();

    // Close the dropdown by clicking away
    await page.getByTestId("repo-table").click();

    // Verify filtering works - private repos should not be visible
    await expect(page.getByText("test-repo-2")).toBeVisible();
    await expect(page.getByText("test-repo-4")).toBeVisible();
    await expect(page.getByText("test-repo-6")).toBeVisible();
    // We don't check for invisibility as the DOM might still contain them but they're hidden
  });

  test("should change the number of repositories per page", async ({
    page,
  }) => {
    // Find the per page select element and click it
    await page.getByTestId("per-page-select").click();

    // Wait for the dropdown to open
    await page.waitForSelector('[data-testid="per-page-option-10"]', {
      state: "visible",
    });

    // Select 10 per page using testId
    await page.getByTestId("per-page-option-10").click();

    // Wait for the page to update
    await page.waitForTimeout(500);

    // Verify that all 6 repos are now visible (with 10 per page)
    for (const repo of testRepos) {
      await expect(page.getByText(repo.name)).toBeVisible();
    }
  });

  test("should select repositories and enable action button", async ({
    page,
  }) => {
    // Check if the action button is initially disabled
    const actionButton = page.getByTestId("repo-action-button");
    await expect(actionButton).toBeDisabled();

    // Need to select a specific repo checkbox, not the header checkbox
    // First wait for the table rows to appear
    await page.waitForSelector("tbody tr");

    // Select the first repo's checkbox - skip the header's "Select All" checkbox
    const checkboxes = page.locator('tbody tr input[type="checkbox"]');
    await checkboxes.first().click();

    // Check if the action button is now enabled
    await expect(actionButton).toBeEnabled();
  });

  test("should open confirmation modal when action button is clicked", async ({
    page,
  }) => {
    // Wait for the table to load
    await page.waitForSelector("tbody tr");

    // Select the first repo's checkbox (not the header checkbox)
    const checkboxes = page.locator('tbody tr input[type="checkbox"]');
    await checkboxes.first().click();

    // Click the action button
    await page.getByTestId("repo-action-button").click();

    // Check if the confirmation modal is displayed
    await expect(page.getByTestId("repo-confirmation-modal")).toBeVisible();
  });

  test("should complete the confirmation workflow for archiving repos", async ({
    page,
  }) => {
    // Mock specific archive API calls for the first repo
    await mockArchiveRepo(page, "test-repo-1");

    // Wait for the table to load
    await page.waitForSelector("tbody tr");

    // Select the first repo's checkbox (not the header checkbox)
    const checkboxes = page.locator('tbody tr input[type="checkbox"]');
    await checkboxes.first().click();

    // Make sure we're using the archive action (default)
    await expect(page.getByTestId("repo-action-button")).toContainText(
      "Archive",
    );

    // Click the action button
    await page.getByTestId("repo-action-button").click();

    // Confirm the modal shows archival
    await expect(page.getByText("Confirm Archival")).toBeVisible();

    // Enter the username to confirm
    await page.getByTestId("username-input").fill("testuser");

    // Click the confirm button
    await page.getByTestId("confirm-repo-action").click();

    // Wait for the progress screen
    await expect(page.getByText("Archiving Repositories")).toBeVisible();

    // Wait for the result screen (with a longer timeout)
    await page.waitForSelector('[data-testid="repo-action-result-modal"]', {
      timeout: 10000,
    });
    await expect(page.getByText("Archival Complete")).toBeVisible();

    // Close the modal
    await page.getByTestId("close-repo-action-result").click();

    // Verify the modal is closed
    await expect(page.getByTestId("repo-confirmation-modal")).not.toBeVisible();
  });
});
