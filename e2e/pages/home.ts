import { expect, type Locator, type Page } from "@playwright/test";

import { mockUser } from "@/mocks/fixtures";

export class HomePage {
  readonly page: Page;
  readonly rememberCheckbox: Locator;
  readonly submitButton: Locator;
  readonly tokenInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tokenInput = page.getByLabel(
      "Please enter your Personal Access Token",
    );
    this.submitButton = page.getByRole("button", { name: /submit/i });
    this.rememberCheckbox = page.getByLabel(/remember me/i);
  }

  async clearToken() {
    await this.tokenInput.clear();
  }

  async clickText(text: string) {
    await this.page.getByText(text).click();
  }

  async expectCurrentPath(path: string) {
    await expect(this.page).toHaveURL(new RegExp(path.replace("/", "\\/")));
  }

  async expectErrorMessage(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  async expectFooterLink(text: string, href: string) {
    const link = this.page.getByRole("link", { name: text });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", href);
  }

  async expectHeading(text: string) {
    await expect(this.page.getByRole("heading", { level: 1 })).toContainText(
      text,
    );
  }

  async expectNotVisible(text: string) {
    await expect(this.page.getByText(text)).not.toBeVisible();
  }

  async expectOnDashboard() {
    await this.expectCurrentPath("/dashboard");
  }

  async expectSubmitDisabled() {
    await expect(this.submitButton).toBeDisabled();
  }

  async expectSubmitEnabled() {
    await expect(this.submitButton).toBeEnabled();
  }

  async expectSubmitLoading() {
    await expect(this.submitButton).toHaveAttribute("data-loading", "true");
  }

  async expectText(text: RegExp | string) {
    await expect(this.page.getByText(text)).toBeVisible();
  }

  async expectVisible(text: string) {
    await expect(this.page.getByText(text)).toBeVisible();
  }

  async fillToken(token: string) {
    await this.tokenInput.fill(token);
  }

  async goto(path = "/") {
    await this.page.goto(path);
  }

  async mockInvalidToken(token: string) {
    await this.page.route("https://api.github.com/user", (route) => {
      const headers = route.request().headers();
      if (headers.authorization === `Bearer ${token}`) {
        void route.fulfill({
          body: JSON.stringify({ message: "Bad credentials" }),
          status: 401,
        });
      }
    });
  }

  async mockValidToken(token: string) {
    await this.page.route("https://api.github.com/user", (route) => {
      const headers = route.request().headers();
      if (headers.authorization === `Bearer ${token}`) {
        void route.fulfill({
          body: JSON.stringify(mockUser),
          status: 200,
        });
      }
    });
  }

  async setupAuth() {
    await this.page.route("https://api.github.com/user", (route) => {
      void route.fulfill({
        body: JSON.stringify(mockUser),
        status: 200,
      });
    });

    await this.page.addInitScript(() => {
      localStorage.setItem(
        "pat",
        "ghp_validtoken123456789012345678901234567890",
      );
      localStorage.setItem("login", "testuser");
    });
  }

  async submit() {
    await this.submitButton.click();
  }

  async toggleRememberMe() {
    await this.rememberCheckbox.click();
  }
}
