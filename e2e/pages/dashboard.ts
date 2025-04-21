import { mockGraphQLRepos } from "@e2e/utils/github-api-mocks";
import { expect, Locator, Page } from "@playwright/test";

import { mockLocalStorage, mockOctokitInit } from "../utils/github-api-mocks";
import { HomePage } from "./home";

export class DashboardPage extends HomePage {
  readonly actionDropdown: Locator;
  readonly archiveButton: Locator;
  readonly cancelButton: Locator;
  readonly confirmationInput: Locator;
  readonly confirmButton: Locator;
  readonly page: Page;
  readonly progressBar: Locator;
  readonly searchInput: Locator;
  readonly selectAllCheckbox: Locator;
  readonly typeFilter: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.searchInput = page.getByLabel("Search");
    this.typeFilter = page.getByLabel("Repo types to show");
    this.selectAllCheckbox = page.getByRole("checkbox", { name: "Select all" });
    this.archiveButton = page.getByRole("button", { name: /archive/i });
    this.actionDropdown = page.getByRole("button", { name: /chevron/i });
    this.confirmButton = page.getByRole("button", { name: /confirm/i });
    this.cancelButton = page.getByRole("button", { name: /cancel/i });
    this.confirmationInput = page.getByPlaceholder(
      /enter your github username/i,
    );
    this.progressBar = page.getByRole("progressbar");
  }

  async archiveSelectedRepos(username: string) {
    await this.archiveButton.click();
    await this.fillConfirmationInput(username);
    await this.confirmButton.click();
  }

  async deleteSelectedRepos(username: string) {
    await this.page.getByRole("button", { name: /delete/i }).click();
    await this.fillConfirmationInput(username);
  }

  async expectConfirmationInputEmpty() {
    await expect(this.confirmationInput).toHaveValue("");
  }

  async expectConfirmButtonDisabled() {
    await expect(this.confirmButton).toBeDisabled();
  }

  async expectConfirmButtonEnabled() {
    await expect(this.confirmButton).toBeEnabled();
  }

  async expectErrorMessage(text: RegExp | string) {
    await expect(this.page.getByText(text)).toBeVisible();
  }

  async expectModalNotVisible() {
    await expect(this.page.getByRole("dialog")).not.toBeVisible();
  }

  async expectModalTitle(text: RegExp | string) {
    await expect(this.page.getByRole("heading", { level: 2 })).toContainText(
      text,
    );
  }

  async expectProgressVisible(count: number) {
    await expect(this.progressBar).toBeVisible();
    await expect(this.page.getByText(`${count} of ${count}`)).toBeVisible();
  }

  async expectRepoVisible(name: string) {
    await expect(this.page.getByText(name)).toBeVisible();
  }

  async expectSuccessMessage(action: string) {
    await expect(
      this.page.getByText(new RegExp(`successfully ${action}`, "i")),
    ).toBeVisible();
  }

  async fillConfirmationInput(username: string) {
    await this.confirmationInput.fill(username);
  }

  async filterByType(type: string) {
    await this.typeFilter.click();
    await this.page.getByRole("option", { name: type }).click();
  }

  async goto() {
    await this.page.goto("/dashboard");
  }

  async searchFor(query: string) {
    await this.searchInput.fill(query);
  }

  async selectAll() {
    await this.selectAllCheckbox.check();
  }

  async selectRepository(name: string) {
    await this.page.getByRole("checkbox", { name }).check();
  }

  async setupMocks() {
    await mockLocalStorage(this.page);
    await mockOctokitInit(this.page);
    await mockGraphQLRepos(this.page);
  }
}
