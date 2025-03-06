import { Repository } from "@octokit/graphql-schema";
import { expect, test } from "@playwright/test";

test.describe("Dashboard Page", () => {
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

  test("should redirect to home page if not authenticated", async ({
    page,
  }) => {
    // Navigate to dashboard without authentication
    await page.goto("/dashboard");

    // Should be redirected to the home page
    await expect(page).toHaveURL("/");
  });

  test("should display dashboard with repositories when authenticated", async ({
    page,
  }) => {
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

    // Check if we're on the dashboard page
    await expect(page).toHaveURL("/dashboard");

    // Check if the repo table is displayed
    await expect(page.getByTestId("repo-table")).toBeVisible();

    // Check if repositories are displayed
    const repoLinks = page.getByTestId("repo-link");
    await expect(repoLinks).toHaveCount(2);
    await expect(repoLinks.nth(0)).toContainText("test-repo-1");
    await expect(repoLinks.nth(1)).toContainText("test-repo-2");
  });

  test("should display error message when API request fails", async ({
    page,
  }) => {
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

    // Mock the GraphQL API to return an error
    await page.route("https://api.github.com/graphql", (route) => {
      void route.fulfill({
        body: JSON.stringify({ message: "Internal Server Error" }),
        status: 500,
      });
    });

    // Navigate to the dashboard
    await page.goto("/dashboard");

    // Check if we're on the dashboard page
    await expect(page).toHaveURL("/dashboard");

    // Check if the error message is displayed
    await expect(page.getByText("Error!")).toBeVisible();
  });

  test("should display loading state initially", async ({ page }) => {
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

    // Mock the GraphQL API with a delay to show loading state
    await page.route("https://api.github.com/graphql", async (route) => {
      // Add a delay to simulate loading
      await new Promise((resolve) => setTimeout(resolve, 1000));
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

    // Check if we're on the dashboard page
    await expect(page).toHaveURL("/dashboard");

    // Check if the loading spinner is displayed initially
    await expect(page.getByLabel("Loading...")).toBeVisible();
  });
});
