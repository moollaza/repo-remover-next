import { HomePage } from "@e2e/pages/home";
import { test } from "@playwright/test";

import { mockUser } from "@/mocks/fixtures";

test.describe("Layout Components", () => {
  test.describe("Footer", () => {
    test("renders correctly on home page", async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      // Author link
      await home.expectFooterLink("Zaahir Moolla", "https://zaahir.ca");
      await home.expectText(/© 2019 All rights reserved./);

      // GitHub link
      await home.expectFooterLink(
        "GitHub",
        "https://github.com/moollaza/repo-remover",
      );

      // Section headings
      await home.expectText("Contribute");
      await home.expectText("Share");

      // Social media links
      await home.expectFooterLink("Bluesky", "https://bsky.app");
      await home.expectFooterLink("Reddit", "https://reddit.com");
      await home.expectFooterLink("X", "https://x.com");
      await home.expectFooterLink("LinkedIn", "https://linkedin.com");
    });
  });

  test.describe("Header", () => {
    test("renders correctly on home page", async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      // Brand name
      await home.expectText("Repo Remover");

      // Navigation links
      await home.expectText("Features");
      await home.expectText("How It Works");
      await home.expectText("Get Started");

      // Dashboard button should not be visible when not logged in
      await home.expectNotVisible("Go to Dashboard");
    });

    test("shows dashboard button when logged in", async ({ page }) => {
      const home = new HomePage(page);
      await home.setupAuth();
      await home.goto();

      await home.expectVisible("Go to Dashboard");
    });

    test("shows user profile on dashboard", async ({ page }) => {
      const home = new HomePage(page);
      await home.setupAuth();
      await home.goto("/dashboard");

      // User profile
      await home.expectVisible(mockUser.name);
      await home.expectVisible(mockUser.login);

      // Navigation links should not be visible
      await home.expectNotVisible("Features");
      await home.expectNotVisible("How It Works");
      await home.expectNotVisible("Get Started");
    });

    test("handles logout correctly", async ({ page }) => {
      const home = new HomePage(page);
      await home.setupAuth();
      await home.goto("/dashboard");

      // Open dropdown and logout
      await home.clickText(mockUser.name);
      await home.clickText("Log Out");

      // Should redirect to home
      await home.expectCurrentPath("/");
    });
  });
});
