import { Page } from "@playwright/test";

import { mockRepos, mockUser } from "@/mocks/fixtures";

export async function mockArchiveRepo(
  page: Page,
  repoName: string,
  options: { error?: string; success?: boolean } = {},
) {
  await page.route(`**/repos/testuser/${repoName}/archive`, (route) => {
    if (options.success === false) {
      void route.fulfill({
        body: JSON.stringify({
          message: options.error ?? "Repository archiving failed",
        }),
        status: 403,
      });
    } else {
      void route.fulfill({ status: 200 });
    }
  });
}

export async function mockBulkActions(
  page: Page,
  options: { error?: string; success?: boolean } = {},
) {
  await page.route("**/repos/testuser/**", (route) => {
    if (options.success === false) {
      void route.fulfill({
        body: JSON.stringify({
          message: options.error ?? "Bulk action failed",
        }),
        status: 403,
      });
    } else {
      void route.fulfill({ status: 204 });
    }
  });
}

export async function mockDeleteRepo(
  page: Page,
  repoName: string,
  options: { error?: string; success?: boolean } = {},
) {
  await page.route(`**/repos/testuser/${repoName}`, (route) => {
    if (route.request().method() === "DELETE") {
      if (options.success === false) {
        void route.fulfill({
          body: JSON.stringify({
            message: options.error ?? "Repository deletion failed",
          }),
          status: 403,
        });
      } else {
        void route.fulfill({ status: 204 });
      }
    }
  });
}

export async function mockGraphQLRepos(page: Page) {
  await page.route("https://api.github.com/graphql", (route) => {
    const body = JSON.parse(route.request().postData() ?? "{}") as {
      query: string;
    };
    if (body.query.includes("GetRepos")) {
      void route.fulfill({
        body: JSON.stringify({
          data: {
            user: {
              ...mockUser,
              repositories: {
                nodes: mockRepos,
                pageInfo: {
                  endCursor: null,
                  hasNextPage: false,
                },
                totalCount: mockRepos.length,
              },
            },
          },
        }),
        status: 200,
      });
    }
  });
}

/**
 * Mock GitHub API for token validation failure
 * @param page Playwright page
 * @param errorMessage Optional error message (defaults to "Bad credentials")
 */
export async function mockInvalidToken(
  page: Page,
  errorMessage = "Bad credentials",
) {
  await page.route("https://api.github.com/user", (route) => {
    if (route.request().method() === "GET") {
      void route.fulfill({
        body: JSON.stringify({
          documentation_url: "https://docs.github.com/rest",
          message: errorMessage,
        }),
        status: 401,
      });
    } else {
      void route.continue();
    }
  });
}

// Add support for throttled Octokit instance in mocks
export async function mockOctokitInit(page: Page) {
  await page.route("https://api.github.com/user", (route) => {
    void route.fulfill({
      body: JSON.stringify(mockUser),
      status: 200,
    });
  });
}
