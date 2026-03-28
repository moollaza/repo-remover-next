import { argosScreenshot } from "@argos-ci/playwright";
import { test } from "@playwright/test";

import { DashboardPage } from "./pages/dashboard";
import { HomePage } from "./pages/home";
import { mockGraphQLRepos, mockOctokitInit } from "./utils/github-api-mocks";
import { mockLocalStorage } from "./utils/github-api-mocks";

/** CSS injected during screenshots to disable animations and ensure stability */
const stabilizationCSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
  .animate-spin, .animate-ping, .animate-pulse, .animate-bounce {
    animation: none !important;
  }
`;

test.describe("Visual Regression", () => {
  test.describe("Landing Page", () => {
    test("light theme", async ({ page }) => {
      const home = new HomePage(page);
      await home.setupMocks();
      await home.goto();
      await page.waitForLoadState("networkidle");

      await argosScreenshot(page, "landing-light", {
        argosCSS: stabilizationCSS,
        fullPage: true,
      });
    });

    test("dark theme", async ({ page }) => {
      const home = new HomePage(page);
      await home.setupMocks();
      await home.goto();
      await page.waitForLoadState("networkidle");

      // Toggle to dark mode via class strategy
      await page.evaluate(() => {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      });
      // Wait for theme transition
      await page.waitForTimeout(300);

      await argosScreenshot(page, "landing-dark", {
        argosCSS: stabilizationCSS,
        fullPage: true,
      });
    });
  });

  test.describe("Dashboard", () => {
    test("with repos - light", async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.setupMocks();
      await dashboard.goto();
      await dashboard.waitForFullDataLoad();

      await argosScreenshot(page, "dashboard-light", {
        argosCSS: stabilizationCSS,
        fullPage: true,
      });
    });

    test("with repos - dark", async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.setupMocks();
      await dashboard.goto();
      await dashboard.waitForFullDataLoad();

      await page.evaluate(() => {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      });
      await page.waitForTimeout(300);

      await argosScreenshot(page, "dashboard-dark", {
        argosCSS: stabilizationCSS,
        fullPage: true,
      });
    });
  });

  test.describe("Get Started Section", () => {
    test("token form", async ({ page }) => {
      const home = new HomePage(page);
      await home.setupMocks();
      await home.goto();

      // Scroll to get-started section
      await page.locator("#get-started").scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);

      await argosScreenshot(page, "get-started-form", {
        argosCSS: stabilizationCSS,
        element: page.locator("#get-started"),
      });
    });
  });
});
