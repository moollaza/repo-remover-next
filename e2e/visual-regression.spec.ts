import { argosScreenshot } from "@argos-ci/playwright";
import { type Page, test } from "@playwright/test";

import { DashboardPage } from "./pages/dashboard";
import { HomePage } from "./pages/home";

/**
 * CSS injected during screenshots to disable all animations and
 * force framer-motion animated elements to be visible.
 * Framer-motion sets inline styles (opacity, transform) via JS,
 * so we need !important overrides on all elements.
 */
const stabilizationCSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    opacity: 1 !important;
    transform: none !important;
  }
  .animate-spin, .animate-ping, .animate-pulse, .animate-bounce {
    animation: none !important;
  }
`;

/** Force all framer-motion elements visible by clearing inline styles */
async function forceAllVisible(page: Page) {
  await page.evaluate(() => {
    document
      .querySelectorAll("[style*='opacity'], [style*='transform']")
      .forEach((el) => {
        (el as HTMLElement).style.opacity = "1";
        (el as HTMLElement).style.transform = "none";
      });
  });
}

test.describe("Visual Regression", () => {
  test.describe("Landing Page", () => {
    test("light theme", async ({ page }) => {
      const home = new HomePage(page);
      await home.setupMocks();
      await home.goto();
      await page.waitForLoadState("networkidle");

      // Scroll through page to trigger whileInView animations
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);

      await forceAllVisible(page);

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

      // Toggle dark mode
      await page.evaluate(() => {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      });

      // Scroll to trigger animations then force visible
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);

      await forceAllVisible(page);

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
      await dashboard.waitForReposLoaded();

      await argosScreenshot(page, "dashboard-light", {
        argosCSS: stabilizationCSS,
        fullPage: true,
      });
    });

    test("with repos - dark", async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.setupMocks();
      await dashboard.goto();
      await dashboard.waitForReposLoaded();

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

      // Scroll to trigger animations
      await page.locator("#get-started").scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await forceAllVisible(page);

      await argosScreenshot(page, "get-started-form", {
        argosCSS: stabilizationCSS,
        element: page.locator("#get-started"),
      });
    });
  });
});
