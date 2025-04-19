import { expect, test } from "@playwright/test";

test.describe("Footer Component", () => {
  test("should display the footer correctly", async ({ page }) => {
    await page.goto("/");

    // Use a more specific selector for the footer with the container class and test content
    const footer = page.locator("footer.container");
    await expect(footer).toBeVisible();

    // Check for the author name and link
    const authorLink = page.getByRole("link", { name: "Zaahir Moolla" });
    await expect(authorLink).toBeVisible();
    await expect(authorLink).toHaveAttribute("href", "https://zaahir.ca");

    // Check for the copyright text
    await expect(page.getByText("© 2019 All rights reserved.")).toBeVisible();

    // Check for the GitHub link in the footer specifically
    const githubLink = footer.getByRole("link", { name: "GitHub" });
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute(
      "href",
      "https://github.com/moollaza/repo-remover",
    );

    // Check for the social media links in the footer specifically
    const shareSection = footer.filter({ hasText: "Share" });
    await expect(
      shareSection.getByRole("link", { name: "Bluesky" }),
    ).toBeVisible();
    await expect(
      shareSection.getByRole("link", { name: "Reddit" }),
    ).toBeVisible();
    await expect(shareSection.getByRole("link", { name: "X" })).toBeVisible();
    await expect(
      shareSection.getByRole("link", { name: "LinkedIn" }),
    ).toBeVisible();
  });

  test("should have external links with proper attributes", async ({
    page,
  }) => {
    await page.goto("/");

    // Check all links in the footer have the proper external attributes
    const externalLinks = page.locator("footer.container").getByRole("link");
    const count = await externalLinks.count();

    for (let i = 0; i < count; i++) {
      const link = externalLinks.nth(i);
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  test("should have proper section headings", async ({ page }) => {
    await page.goto("/");

    const footer = page.locator("footer.container");
    // Check for the section headings
    await expect(footer.getByText("Contribute")).toBeVisible();
    await expect(footer.getByText("Share")).toBeVisible();
  });
});
