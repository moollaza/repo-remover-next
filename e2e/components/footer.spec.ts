import { expect, test } from "@playwright/test";

test.describe("Footer Component", () => {
  test("should display the footer correctly", async ({ page }) => {
    await page.goto("/");

    // Check if the footer is visible
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    // Check for the author name and link
    const authorLink = page.getByRole("link", { name: "Zaahir Moolla" });
    await expect(authorLink).toBeVisible();
    await expect(authorLink).toHaveAttribute("href", "https://zaahir.ca");

    // Check for the copyright text
    await expect(page.getByText("© 2019 All rights reserved.")).toBeVisible();

    // Check for the GitHub link
    const githubLink = page.getByRole("link", { name: "GitHub" });
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute(
      "href",
      "https://github.com/moollaza/repo-remover",
    );

    // Check for the social media links
    await expect(page.getByRole("link", { name: "Bluesky" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Reddit" })).toBeVisible();
    await expect(page.getByRole("link", { name: "X" })).toBeVisible();
    await expect(page.getByRole("link", { name: "LinkedIn" })).toBeVisible();
  });

  test("should have external links with proper attributes", async ({
    page,
  }) => {
    await page.goto("/");

    // Check all links in the footer have the proper external attributes
    const externalLinks = page.locator("footer").getByRole("link");
    const count = await externalLinks.count();

    for (let i = 0; i < count; i++) {
      const link = externalLinks.nth(i);
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  test("should have proper section headings", async ({ page }) => {
    await page.goto("/");

    // Check for the section headings
    await expect(page.getByText("Contribute")).toBeVisible();
    await expect(page.getByText("Share")).toBeVisible();
  });
});
