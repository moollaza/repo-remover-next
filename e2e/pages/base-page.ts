// filepath: /Users/zaahirmoolla/projects/repo-remover-next/e2e/pages/base-page.ts
import { expect, type Locator, type Page } from "@playwright/test";

export class BasePage {
  readonly footer: Locator;
  readonly footerLinks: Locator;
  readonly navbar: Locator;
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.navbar = page.getByTestId("navbar");
    this.footer = page.getByTestId("footer");
    this.footerLinks = this.footer.getByRole("link");
  }

  // Header assertions
  async expectBrandVisible() {
    await expect(
      this.navbar.getByRole("link", { name: "Repo Remover" }),
    ).toBeVisible();
  }

  async expectDashboardButtonNotVisible() {
    await expect(this.page.getByText("Go to Dashboard")).not.toBeVisible();
  }

  async expectDashboardButtonVisible() {
    await expect(this.page.getByText("Go to Dashboard")).toBeVisible();
  }

  async expectFooterCopyright() {
    await expect(
      this.page.getByText(/© 2019-2025 All rights reserved./),
    ).toBeVisible();
  }

  // Footer assertions
  async expectFooterLink(text: string, href: string) {
    const link = this.page.getByRole("link", { exact: true, name: text });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", href);
  }

  async expectFooterSectionHeading(text: string) {
    await expect(this.footer.getByText(text)).toBeVisible();
  }

  async expectNavLinkNotVisible(name: string) {
    await expect(this.navbar.getByRole("link", { name })).not.toBeVisible();
  }

  async expectNavLinkVisible(name: string) {
    await expect(this.navbar.getByRole("link", { name })).toBeVisible();
  }

  async expectUserProfileNotVisible(name: string, login: string) {
    await expect(this.page.getByText(name)).not.toBeVisible();
    await expect(this.page.getByText(login)).not.toBeVisible();
  }

  async expectUserProfileVisible(name: string, login: string) {
    await expect(this.page.getByText(name)).toBeVisible();
    await expect(this.page.getByText(login)).toBeVisible();
  }

  // Navigation methods
  async goto(path = "/") {
    await this.page.goto(path);
  }

  async logout() {
    // Open user dropdown and click logout
    await this.page.getByText("Test User").click();
    await this.page.getByText("Log Out").click();
    await expect(this.page).toHaveURL("/");
  }

  async verifyCommonFooterElements() {
    // Author link
    await this.expectFooterLink("Zaahir Moolla", "https://zaahir.ca");
    await this.expectFooterCopyright();

    // GitHub link
    await this.expectFooterLink(
      "GitHub",
      "https://github.com/moollaza/repo-remover",
    );

    // Section headings
    await this.expectFooterSectionHeading("Contribute");
    await this.expectFooterSectionHeading("Share");

    // Social media links
    await this.expectFooterLink("Bluesky", "https://bsky.app");
    await this.expectFooterLink("Reddit", "https://reddit.com");
    await this.expectFooterLink("X", "https://x.com");
    await this.expectFooterLink("LinkedIn", "https://linkedin.com");
  }
}
