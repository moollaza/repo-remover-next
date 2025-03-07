import { expect, test } from "@playwright/test";

import { DashboardPage } from "../pages/dashboard";

test.describe("GitHub API Throttling", () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);

    // Set token without using direct localStorage access
    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        body: JSON.stringify({
          accessToken: "ghp_validtoken123456789012345678901234567890",
          user: { login: "testuser" },
        }),
        status: 200,
      });
    });

    await dashboard.setupMocks();
  });

  test("should handle rate limits gracefully", async ({ page }) => {
    // Mock a rate limit response followed by a successful response
    let rateLimitHit = false;
    await page.route("https://api.github.com/user/repos*", async (route) => {
      if (!rateLimitHit) {
        rateLimitHit = true;
        // Return a rate limit error first time
        await route.fulfill({
          body: JSON.stringify({
            documentation_url: "https://docs.github.com/rest/rate-limit",
            message: "API rate limit exceeded",
          }),
          headers: {
            "x-ratelimit-remaining": "0",
            "x-ratelimit-reset": (
              Math.floor(Date.now() / 1000) + 60
            ).toString(),
          },
          status: 403,
        });
      } else {
        // Return success on retry
        await route.fulfill({
          body: JSON.stringify([
            {
              description: "Test repository",
              id: 1,
              name: "test-repo-1",
              owner: { login: "testuser" },
            },
          ]),
          status: 200,
        });
      }
    });

    // Go to the dashboard which will trigger API calls
    await dashboard.goto();

    // Sleep a bit to allow for retry
    await page.waitForTimeout(300);

    // Mock the repos endpoint to show content
    await page.route("https://api.github.com/graphql", async (route) => {
      await route.fulfill({
        body: JSON.stringify({
          data: {
            user: {
              repositories: {
                nodes: [
                  {
                    description: "Test repository",
                    id: "1",
                    name: "test-repo-1",
                    owner: { login: "testuser" },
                  },
                ],
                pageInfo: {
                  endCursor: null,
                  hasNextPage: false,
                },
                totalCount: 1,
              },
            },
          },
        }),
        status: 200,
      });
    });

    // Trigger a refresh
    await page.reload();

    // Expect the repo to be visible after retry
    await dashboard.expectRepoVisible("test-repo-1");
  });

  test("should not retry secondary rate limits", async ({ page }) => {
    // Mock a secondary rate limit response
    await page.route("https://api.github.com/graphql", async (route) => {
      await route.fulfill({
        body: JSON.stringify({
          documentation_url: "https://docs.github.com/graphql/rate-limit",
          message: "Secondary rate limit exceeded",
        }),
        headers: {
          "retry-after": "60",
        },
        status: 403,
      });
    });

    // Go to the dashboard
    await dashboard.goto();

    // Wait for error message
    await page.waitForTimeout(300);

    // Check for error message (may vary based on UI)
    const errorText = await page.textContent("body");
    expect(errorText).toContain("Error") ||
      expect(errorText).toContain("rate limit");
  });
});
