import { expect, test } from "@playwright/test";

import {
  mockGraphQLRepos,
  mockLocalStorage,
  mockOctokitInit,
} from "./utils/github-api-mocks";

test.describe("Authentication Redirects", () => {
  test("unauthenticated user navigating to /dashboard is redirected to /", async ({
    page,
  }) => {
    // Navigate directly to /dashboard without setting up auth
    await page.goto("/dashboard");

    // Should be redirected to home page
    await expect(page).toHaveURL("/");
  });

  test("authenticated user stays on /dashboard", async ({ page }) => {
    // Set up auth mocks before navigation
    await mockLocalStorage(page);
    await mockOctokitInit(page);
    await mockGraphQLRepos(page);

    await page.goto("/dashboard");

    // Should remain on dashboard
    await expect(page).toHaveURL("/dashboard");

    // Should see dashboard content
    await expect(page.getByText("Select Repos to Modify")).toBeVisible();
  });
});
