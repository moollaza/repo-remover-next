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
  readonly deleteButton: Locator;
  readonly page: Page;
  readonly progressBar: Locator;
  readonly repoPagination: Locator;
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
    this.deleteButton = page.getByTestId("repo-action-button-delete");
    this.actionDropdown = page.getByRole("button", { name: /chevron/i });
    this.confirmButton = page.getByRole("button", { name: /confirm/i });
    this.cancelButton = page.getByRole("button", { name: /cancel/i });
    this.confirmationInput = page.getByPlaceholder(
      /enter your github username/i,
    );
    this.progressBar = page.getByRole("progressbar");
    this.repoPagination = page.getByTestId("repo-pagination");
  }

  async archiveSelectedRepos(username: string) {
    await this.archiveButton.click();
    await this.fillConfirmationInput(username);
    await this.confirmButton.click();
  }

  async clearSearch() {
    await this.searchInput.clear();
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

  async expectCurrentPage(pageNumber: number | string) {
    await expect(
      this.repoPagination.locator('[aria-current="true"]'),
    ).toHaveText(pageNumber.toString());
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

  /**
   * Expects a specific repository to be at a specific position in the repository table.
   * @param position The position in the table (1-based)
   * @param repoName The name of the repository expected at that position
   */
  async expectRepoAtPosition(position: number, repoName: string) {
    // Get all repo rows using getByTestId
    const repoRows = this.page.getByTestId("repo-row");

    // Get the specific row at the position (adjusting for 0-based indexing)
    const targetRow = repoRows.nth(position - 1);

    // Within that row, check the repo name
    const repoNameInRow = targetRow.getByTestId("repo-name");

    // Verify the repo name is displayed at the expected position
    await expect(repoNameInRow).toContainText(repoName);
  }

  async expectRepoHasOwner(repoName: string) {
    // Find the repo row containing the repo name
    const repoRow = this.page.getByTestId("repo-row").filter({
      has: this.page.getByTestId("repo-name").filter({ hasText: repoName }),
    });

    // Check for the owner information
    const ownerLocator = repoRow.getByTestId("repo-owner");
    await expect(ownerLocator).toBeVisible();
  }

  async expectRepoHasTag(repoName: string, tagName: string) {
    // First find the repo row containing the repo name
    const repoRow = this.page.getByTestId("repo-row").filter({
      has: this.page.getByTestId("repo-name").filter({ hasText: repoName }),
    });

    // Then within that row, check for the tag in the repo-tags section
    const tagLocator = repoRow.getByTestId("repo-tags").filter({
      hasText: tagName,
    });

    await expect(tagLocator).toBeVisible();
  }

  async expectRepoNameVisible(name: string) {
    // Use more specific testid selector for repo name
    const repoNameLocator = this.page.getByTestId("repo-name").filter({
      hasText: name,
    });
    await expect(repoNameLocator).toBeVisible();
  }

  async expectRepoNotVisible(name: string) {
    await expect(this.page.getByText(name, { exact: true })).not.toBeVisible();
  }

  async expectRepoVisible(name: string) {
    await expect(this.page.getByText(name, { exact: true })).toBeVisible();
  }

  async expectSuccessMessage(action: string) {
    await expect(
      this.page.getByText(new RegExp(`successfully ${action}`, "i")),
    ).toBeVisible();
  }

  async expectText(text: RegExp | string) {
    await expect(this.page.getByText(text)).toBeVisible();
  }

  async fillConfirmationInput(username: string) {
    await this.confirmationInput.fill(username);
  }

  async filterByType(type: string) {
    await this.typeFilter.click();
    await this.page.getByRole("option", { name: type }).click();
  }

  async getCurrentPage() {
    return await this.repoPagination
      .locator('[aria-current="true"]')
      .textContent();
  }

  /**
   * Gets the current sort direction for a column
   * @param column The column to check: 'name' or 'updatedAt'
   * @returns The current sort direction or null if not sorted
   */
  async getSortDirection(
    column: "name" | "updatedAt",
  ): Promise<"ascending" | "descending" | null> {
    const columnName = column === "name" ? "Name" : "Last Updated";
    const columnHeader = this.page.getByRole("columnheader", {
      name: columnName,
    });

    const sortDirection = await columnHeader.getAttribute("aria-sort");
    if (sortDirection === "ascending" || sortDirection === "descending") {
      return sortDirection;
    }
    return null;
  }

  async goto() {
    await this.page.goto("/dashboard");
  }

  async goToNextPage() {
    await this.repoPagination.getByLabel("next").click();
  }

  async goToPrevPage() {
    await this.repoPagination.getByLabel("prev").click();
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

  /**
   * Sorts the repository table by the specified column
   * @param column The column to sort by: 'name' or 'updatedAt'
   * @param direction Optional direction to sort by. If not provided, it toggles the current direction
   */
  async sortBy(
    column: "name" | "updatedAt",
    direction?: "ascending" | "descending",
  ) {
    const columnName = column === "name" ? "Name" : "Last Updated";
    const columnHeader = this.page.getByRole("columnheader", {
      name: columnName,
    });

    // If a specific direction is requested, we may need to click twice
    if (direction) {
      // First click to ensure we're sorting by the right column
      await columnHeader.click();

      // Get the current sort direction from the aria-sort attribute
      const currentDirection = await columnHeader.getAttribute("aria-sort");

      // If current direction doesn't match the requested direction, click again to toggle
      if (
        (currentDirection === "descending" && direction === "ascending") ||
        (currentDirection === "ascending" && direction === "descending")
      ) {
        await columnHeader.click();
      }
    } else {
      // Simple toggle sort - just click once
      await columnHeader.click();
    }

    // Wait for the table to update
    await this.page.waitForTimeout(100);
  }
}
