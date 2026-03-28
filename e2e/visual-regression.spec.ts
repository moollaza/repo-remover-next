import { argosScreenshot } from "@argos-ci/playwright";
import { test } from "@playwright/test";

import { DashboardPage } from "./pages/dashboard";
import { HomePage } from "./pages/home";

/**
 * Visual regression tests using Argos CI.
 *
 * All content renders immediately (no animation gating) via `prefers-reduced-motion: reduce`:
 * 1. `scrollRevealProps()` in motion.ts detects reduced motion and uses `animate="visible"`
 *    instead of `whileInView`, so below-fold content is visible in full-page screenshots.
 * 2. framer-motion's `reducedMotion="user"` (MotionConfig in app.tsx) skips transitions.
 * 3. CSS rule in globals.css disables all CSS animations/transitions.
 */
test.describe("Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    // Disable animations — same path as a11y reduced motion
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test.describe("Landing Page", () => {
    test("light theme", async ({ page }) => {
      const home = new HomePage(page);
      await home.setupMocks();
      await home.goto();
      await page.waitForLoadState("networkidle");

      await argosScreenshot(page, "landing-light", { fullPage: true });
    });

    test("dark theme", async ({ page }) => {
      const home = new HomePage(page);
      await home.setupMocks();
      await home.goto();
      await page.waitForLoadState("networkidle");

      await page.evaluate(() => {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      });
      await page.waitForTimeout(100);

      await argosScreenshot(page, "landing-dark", { fullPage: true });
    });
  });

  test.describe("Dashboard", () => {
    test("with repos - light", async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.setupMocks();
      await dashboard.goto();
      await dashboard.waitForFullDataLoad();

      await argosScreenshot(page, "dashboard-light", { fullPage: true });
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
      await page.waitForTimeout(100);

      await argosScreenshot(page, "dashboard-dark", { fullPage: true });
    });
  });

  test.describe("Get Started Section", () => {
    test("token form", async ({ page }) => {
      const home = new HomePage(page);
      await home.setupMocks();
      await home.goto();

      await page.locator("#get-started").scrollIntoViewIfNeeded();
      await page.waitForTimeout(100);

      await argosScreenshot(page, "get-started-form", {
        element: page.locator("#get-started"),
      });
    });
  });
});
