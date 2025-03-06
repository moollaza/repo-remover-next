import { expect, test } from "@playwright/test";

test.describe("Header Component", () => {
  test("should display the header correctly on home page", async ({ page }) => {
    await page.goto("/");

    // Check if the brand is visible
    const brand = page.getByRole("link", { name: "Repo Remover" });
    await expect(brand).toBeVisible();

    // Check if navigation links are visible
    await expect(page.getByRole("link", { name: "Features" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "How It Works" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Get Started" })).toBeVisible();
  });

  test("should not display navigation links on dashboard page", async ({
    page,
  }) => {
    // Set up authentication
    await page.addInitScript(() => {
      localStorage.setItem(
        "pat",
        "ghp_validtoken123456789012345678901234567890",
      );
      localStorage.setItem("login", "testuser");
    });

    // Mock the GitHub API response
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

    await page.goto("/dashboard");

    // Check if the brand is visible
    const brand = page.getByRole("link", { name: "Repo Remover" });
    await expect(brand).toBeVisible();

    // Check that navigation links are not visible
    await expect(
      page.getByRole("link", { name: "Features" }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("link", { name: "How It Works" }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("link", { name: "Get Started" }),
    ).not.toBeVisible();

    // Check that the user dropdown is visible
    await expect(page.getByText("testuser")).toBeVisible();
  });

  test("should show dashboard link when authenticated on home page", async ({
    page,
  }) => {
    // Set up authentication
    await page.addInitScript(() => {
      localStorage.setItem(
        "pat",
        "ghp_validtoken123456789012345678901234567890",
      );
      localStorage.setItem("login", "testuser");
    });

    // Mock the GitHub API response
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

    await page.goto("/");

    // Check if the dashboard link is visible
    const dashboardLink = page.getByRole("link", { name: "Go to Dashboard" });
    await expect(dashboardLink).toBeVisible();
  });

  test("should allow logout from dashboard", async ({ page }) => {
    // Set up authentication
    await page.addInitScript(() => {
      localStorage.setItem(
        "pat",
        "ghp_validtoken123456789012345678901234567890",
      );
      localStorage.setItem("login", "testuser");
    });

    // Mock the GitHub API response
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

    await page.goto("/dashboard");

    // Click on the user dropdown
    await page.getByText("testuser").click();

    // Click on the logout button
    await page.getByText("Log Out").click();

    // Check if we're redirected to the home page
    await expect(page).toHaveURL("/");
  });
});
