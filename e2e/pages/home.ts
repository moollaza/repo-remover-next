import { mockOctokitInit } from "@e2e/utils/github-api-mocks";
import { expect, type Locator, type Page } from "@playwright/test";

import { BasePage } from "./base-page";

export class HomePage extends BasePage {
  readonly rememberCheckbox: Locator;
  readonly tokenForm: Locator;
  readonly tokenFormError: Locator;
  readonly tokenFormHelp: Locator;
  readonly tokenFormInput: Locator;
  readonly tokenFormSubmit: Locator;
  readonly tokenFormSuccess: Locator;

  constructor(page: Page) {
    super(page);
    this.tokenForm = page.getByTestId("github-token-form");
    this.tokenFormInput = page.getByTestId("github-token-input");
    this.tokenFormSubmit = page.getByTestId("github-token-submit");
    this.rememberCheckbox = page.getByTestId("github-token-remember");
    this.tokenFormError = this.tokenForm.locator('[data-slot="error-message"]');
    this.tokenFormHelp = this.tokenForm.locator('[data-slot="helper-wrapper"]');
    this.tokenFormSuccess = this.tokenForm.locator('[data-slot="description"]');
  }

  async clearToken() {
    await this.tokenFormInput.clear();
  }

  async expectErrorMessage(message: string) {
    // HeroUI Input error-message slot may animate in — wait for text to appear
    await expect(this.tokenFormError).toHaveText(message, { timeout: 5000 });
  }

  async expectHeading(text: string) {
    await expect(this.page.getByRole("heading", { level: 1 })).toContainText(
      text,
    );
  }

  async expectSubmitDisabled() {
    await expect(this.tokenFormSubmit).toBeDisabled();
  }

  async expectSubmitEnabled() {
    await expect(this.tokenFormSubmit).toBeEnabled();
  }

  async expectSubmitLoading() {
    await expect(this.tokenFormSubmit).toHaveAttribute("data-loading", "true");
  }

  async fillToken(token: string) {
    await this.tokenFormInput.fill(token);
  }

  // Override the base method to use the default path
  async goto(path = "/") {
    await this.page.goto(path);
  }

  async setupMocks() {
    await mockOctokitInit(this.page);
  }

  async submit() {
    await this.tokenFormSubmit.click();
  }

  async toggleRememberMe() {
    await this.rememberCheckbox.click();
  }
}
