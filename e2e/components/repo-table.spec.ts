import { Repository } from "@octokit/graphql-schema";
import { expect, test } from "@playwright/test";

test.describe("RepoTable Component", () => {
  // Mock repository data
  const mockRepos = [
    {
      description: "First test repo",
      id: "repo1",
      isArchived: false,
      isDisabled: false,
      isFork: false,
      isInOrganization: false,
      isMirror: false,
      isPrivate: true,
      isTemplate: false,
      name: "test-repo-1",
      owner: {
        __typename: "User",
        id: "user1",
        login: "testuser",
        url: "https://github.com/testuser",
      },
      updatedAt: new Date().toISOString(),
      url: "https://github.com/testuser/test-repo-1",
    },
    {
      description: "Second test repo",
      id: "repo2",
      isArchived: false,
      isDisabled: false,
      isFork: false,
      isInOrganization: true,
      isMirror: false,
      isPrivate: false,
      isTemplate: false,
      name: "test-repo-2",
      owner: {
        __typename: "User",
        id: "user1",
        login: "testuser",
        url: "https://github.com/testuser",
      },
      updatedAt: new Date().toISOString(),
      url: "https://github.com/testuser/test-repo-2",
    },
  ] as Repository[];

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

    // Mock the GitHub API responses
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

    // Mock the GraphQL API for repositories
    await page.route("https://api.github.com/graphql", (route) => {
      void route.fulfill({
        body: JSON.stringify({
          data: {
            viewer: {
              repositories: {
                nodes: mockRepos,
                pageInfo: {
                  endCursor: "cursor",
                  hasNextPage: false,
                },
                totalCount: mockRepos.length,
              },
            },
          },
        }),
        status: 200,
      });
    });

    // Navigate to the dashboard
    await page.goto("/dashboard");
  });

  test("should display the repo table with repositories", async ({ page }) => {
    // Check if the table header is visible
    await expect(page.getByTestId("repo-table-header")).toBeVisible();
    await expect(page.getByTestId("repo-table-header")).toHaveText(
      "Select Repos to Modify",
    );

    // Check if the repositories are displayed
    const repoLinks = page.getByTestId("repo-link");
    await expect(repoLinks).toHaveCount(2);
    await expect(repoLinks.nth(0)).toContainText("test-repo-1");
    await expect(repoLinks.nth(1)).toContainText("test-repo-2");
  });

  test("should filter repositories by search query", async ({ page }) => {
    // Enter search query
    const searchInput = page.getByTestId("repo-search-input");
    await searchInput.fill("test-repo-1");

    // Check if only the matching repository is displayed
    const repoLinks = page.getByTestId("repo-link");
    await expect(repoLinks).toHaveCount(1);
    await expect(repoLinks.nth(0)).toContainText("test-repo-1");
  });

  test("should filter repositories by type", async ({ page }) => {
    // Open the repo types dropdown
    await page.getByTestId("repo-types-select").click();

    // Unselect the Private type
    await page.getByTestId("repo-type-isPrivate").click();

    // Check if only the non-private repository is displayed
    const repoLinks = page.getByTestId("repo-link");
    await expect(repoLinks).toHaveCount(1);
    await expect(repoLinks.nth(0)).toContainText("test-repo-2");
  });

  test("should change the number of repositories per page", async ({
    page,
  }) => {
    // Open the per page dropdown
    await page.getByTestId("per-page-select").click();

    // Select 10 per page
    await page.getByTestId("per-page-option-10").click();

    // Check if the per page selection is applied
    // Since we only have 2 mock repos, both should still be visible
    const repoLinks = page.getByTestId("repo-link");
    await expect(repoLinks).toHaveCount(2);
  });

  test("should select repositories and enable action button", async ({
    page,
  }) => {
    // Check if the action button is initially disabled
    const actionButton = page.getByTestId("repo-action-button");
    await expect(actionButton).toBeDisabled();

    // Select the first repository
    await page
      .locator("table")
      .getByRole("row")
      .nth(1)
      .getByRole("checkbox")
      .click();

    // Check if the action button is now enabled
    await expect(actionButton).toBeEnabled();
  });

  test("should open confirmation modal when action button is clicked", async ({
    page,
  }) => {
    // Select the first repository
    await page
      .locator("table")
      .getByRole("row")
      .nth(1)
      .getByRole("checkbox")
      .click();

    // Click the action button
    await page.getByTestId("repo-action-button").click();

    // Check if the confirmation modal is displayed
    await expect(page.getByTestId("repo-confirmation-modal")).toBeVisible();
  });
});
