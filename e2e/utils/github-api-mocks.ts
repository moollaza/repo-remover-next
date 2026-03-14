import { type GraphQlQueryResponseData } from "@octokit/graphql";
import { type Page } from "@playwright/test";

import {
  getValidPersonalAccessToken,
  mockRepos,
  mockUser,
} from "@/mocks/static-fixtures";

export async function mockArchiveRepo(
  page: Page,
  repoName: string,
  options: { delay?: number; error?: string; success?: boolean } = {},
) {
  await page.route(`**/repos/**/${repoName}`, (route) => {
    if (route.request().method() !== "PATCH") {
      void route.continue();
      return;
    }

    const fulfill = () => {
      if (options.success === false) {
        void route.fulfill({
          json: { message: options.error ?? "Repository archiving failed" },
          status: 403,
        });
      } else {
        void route.fulfill({ json: { archived: true }, status: 200 });
      }
    };

    if (options.delay) {
      setTimeout(fulfill, options.delay);
    } else {
      fulfill();
    }
  });
}

export async function mockBulkActions(
  page: Page,
  options: { error?: string; success?: boolean } = {},
) {
  await page.route("**/repos/**", (route) => {
    if (options.success === false) {
      void route.fulfill({
        json: { message: options.error ?? "Bulk action failed" },
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
  await page.route(`**/repos/**/${repoName}`, (route) => {
    if (route.request().method() !== "DELETE") {
      void route.continue();
      return;
    }

    if (options.success === false) {
      void route.fulfill({
        json: { message: options.error ?? "Repository deletion failed" },
        status: 403,
      });
    } else {
      void route.fulfill({ status: 204 });
    }
  });
}

export async function mockGraphQLRepos(page: Page): Promise<void> {
  await page.route("https://api.github.com/graphql", (route) => {
    const json: GraphQlQueryResponseData = {
      data: {
        user: {
          ...mockUser,
          repositories: {
            nodes: mockRepos,
            pageInfo: {
              endCursor: "blah",
              hasNextPage: false,
            },
          },
        },
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    void route.fulfill({ json });
  });
}

export async function mockGraphQLReposEmpty(page: Page): Promise<void> {
  await page.route("https://api.github.com/graphql", (route) => {
    const json: GraphQlQueryResponseData = {
      data: {
        user: {
          ...mockUser,
          repositories: {
            nodes: [],
            pageInfo: {
              endCursor: null,
              hasNextPage: false,
            },
          },
        },
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    void route.fulfill({ json });
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
        json: {
          documentation_url: "https://docs.github.com/rest",
          message: errorMessage,
        },
        status: 401,
      });
    } else {
      void route.continue();
    }
  });
}

export async function mockLocalStorage(page: Page) {
  const validToken = getValidPersonalAccessToken();

  // Use the secure_ prefix to match secureStorage key convention
  await page.addInitScript((token) => {
    window.localStorage.setItem("secure_pat", token);
    window.localStorage.setItem("secure_login", "testuser");
  }, validToken);
}

export async function mockOctokitInit(page: Page) {
  await page.route("https://api.github.com/user", (route) => {
    void route.fulfill({
      json: mockUser,
      status: 200,
    });
  });
}
