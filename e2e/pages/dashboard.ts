import { mockGraphQLRepos } from "@e2e/utils/github-api-mocks";
import { expect, Locator, Page } from "@playwright/test";

import { mockLocalStorage, mockOctokitInit } from "../utils/github-api-mocks";
import { HomePage } from "./home";

export class DashboardPage extends HomePage {
  readonly actionDropdown: Locator;
  readonly archiveButton: Locator;
  readonly cancelButton: Locator;
  readonly checkboxes: Locator;
  readonly confirmationInput: Locator;
  readonly confirmationModal: Locator;
  readonly confirmationModalBody: Locator;
  readonly confirmationModalCancel: Locator;
  readonly confirmationModalConfirm: Locator;
  readonly confirmationModalHeader: Locator;
  readonly confirmationModalInput: Locator;
  readonly confirmationModalRepoList: Locator;
  readonly confirmationModalResultClose: Locator;
  readonly confirmButton: Locator;
  readonly deleteButton: Locator;
  readonly nextPageButton: Locator;
  readonly page: Page;
  readonly pagination: Locator;
  readonly paginationFilter: Locator;
  readonly prevPageButton: Locator;
  readonly progressBar: Locator;
  readonly progressModalHeader: Locator;
  readonly repoActionDropdownItemArchive: Locator;
  readonly repoActionDropdownItemDelete: Locator;
  readonly resultModalHeader: Locator;
  readonly searchInput: Locator;
  readonly selectAllCheckbox: Locator;
  readonly table: Locator;
  readonly tableRows: Locator;
  readonly typeFilter: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.searchInput = page.getByLabel("Search");
    this.typeFilter = page.getByTestId("repo-type-select");
    this.selectAllCheckbox = page.getByRole("checkbox", { name: "Select all" });
    this.archiveButton = page.getByTestId("repo-action-button-archive");
    this.deleteButton = page.getByTestId("repo-action-button-delete");
    this.actionDropdown = page.getByTestId("repo-action-dropdown-trigger");
    this.confirmButton = page.getByTestId("confirmation-modal-confirm");
    this.cancelButton = page.getByTestId("confirmation-modal-cancel");
    this.confirmationInput = page.getByTestId("confirmation-modal-input");
    this.progressBar = page.getByRole("progressbar");
    this.paginationFilter = page.getByTestId("per-page-select");
    this.pagination = page.getByTestId("table-pagination");
    this.nextPageButton = this.pagination.getByLabel("next");
    this.prevPageButton = this.pagination.getByLabel("prev");
    this.table = page.getByTestId("repo-table");
    this.tableRows = this.table.locator("tbody tr");
    this.checkboxes = this.table.locator("tbody tr input[type='checkbox']");
    this.repoActionDropdownItemArchive = page.getByTestId(
      "repo-action-dropdown-item-archive",
    );
    this.repoActionDropdownItemDelete = page.getByTestId(
      "repo-action-dropdown-item-delete",
    );
    this.confirmationModal = page.getByTestId("repo-confirmation-modal");
    this.confirmationModalHeader = page.getByTestId(
      "confirmation-modal-header",
    );
    this.confirmationModalBody = page.getByTestId("confirmation-modal-body");
    this.confirmationModalRepoList = page
      .getByTestId("confirmation-modal-body")
      .locator("ol");
    this.confirmationModalInput = page.getByTestId("confirmation-modal-input");
    this.confirmationModalCancel = page.getByTestId(
      "confirmation-modal-cancel",
    );
    this.confirmationModalConfirm = page.getByTestId(
      "confirmation-modal-confirm",
    );
    this.confirmationModalResultClose = page.getByTestId(
      "repo-action-result-close",
    );
    this.progressModalHeader = page.getByTestId("progress-modal-header");
    this.resultModalHeader = page.getByTestId("result-modal-header");
  }

  async archiveSelectedRepos(username: string) {
    await this.selectArchiveAction();
    await this.archiveButton.click();
    await this.fillConfirmationInput(username);
    await this.confirmationModalConfirm.click();
  }

  /**
   * Cancels the confirmation dialog
   */
  async cancelConfirmation() {
    await this.confirmationModalCancel.click();
  }

  async clearConfirmationInput() {
    await this.confirmationModalInput.fill("");
  }

  async clearSearch() {
    await this.searchInput.clear();
  }

  /**
   * Closes the confirmation modal result by clicking the close button
   */
  async closeModalResult() {
    await this.confirmationModalResultClose.click();
  }

  /**
   * Confirms the action in the confirmation dialog after entering username
   * @param username The GitHub username to enter for confirmation
   */
  async confirmAction(username: string) {
    await this.fillConfirmationInput(username);
    await this.confirmationModalConfirm.click();
  }

  async deleteSelectedRepos(username: string) {
    await this.selectDeleteAction();
    await this.deleteButton.click();
    await this.fillConfirmationInput(username);
  }

  async expectConfirmationInputEmpty() {
    await expect(this.confirmationModalInput).toHaveValue("");
  }

  async expectConfirmButtonDisabled() {
    await expect(this.confirmationModalConfirm).toBeDisabled();
  }

  async expectConfirmButtonEnabled() {
    await expect(this.confirmationModalConfirm).toBeEnabled();
  }

  async expectCurrentPage(pageNumber: number | string) {
    await expect(this.pagination.locator('[aria-current="true"]')).toHaveText(
      pageNumber.toString(),
    );
  }

  async expectModalBody(text: RegExp | string) {
    await expect(this.confirmationModalBody).toContainText(text);
  }

  /**
   * Checks if the confirmation modal is in a specific mode
   * @param mode The expected mode of the modal: "confirmation", "progress", or "result"
   */
  async expectModalInMode(mode: "confirmation" | "progress" | "result") {
    await expect(
      this.page.getByTestId(`confirmation-modal-${mode}`),
    ).toBeVisible();
  }

  async expectModalNotVisible() {
    await expect(this.confirmationModal).not.toBeVisible();
  }

  async expectModalTitle(text: RegExp | string) {
    await expect(this.confirmationModalHeader).toContainText(text);
  }

  async expectProgressVisible(count: number) {
    await expect(this.progressBar).toBeVisible();
    await expect(this.page.getByText(`Progress: ${count}`)).toBeVisible();
  }

  /**
   * Verifies the repo action button shows the correct text
   * @param action The expected action (archive or delete)
   */
  async expectRepoActionButton(action: "archive" | "delete") {
    if (action === "archive") {
      await expect(this.archiveButton).toBeVisible();
      await expect(this.deleteButton).not.toBeVisible();
    } else {
      await expect(this.deleteButton).toBeVisible();
      await expect(this.archiveButton).not.toBeVisible();
    }
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

  async expectRepoInConfirmationModal(repoName: string) {
    // Find the list item in the ordered list within the modal body
    await expect(
      this.confirmationModalRepoList.locator("li", { hasText: repoName }),
    ).toBeVisible();
  }

  async expectRepoNameVisible(name: string) {
    // Use more specific testid selector for repo name
    const repoNameLocator = this.page.getByTestId("repo-name").filter({
      hasText: name,
    });
    await expect(repoNameLocator).toBeVisible();
  }

  async expectRepoNotInConfirmationModal(repoName: string) {
    // Make sure the repo is not in the confirmation modal list
    await expect(
      this.confirmationModalRepoList.locator("li", { hasText: repoName }),
    ).not.toBeVisible();
  }

  async expectRepoNotVisible(name: string) {
    await expect(this.page.getByText(name, { exact: true })).not.toBeVisible();
  }

  async expectRepoVisible(name: string) {
    await expect(this.page.getByText(name, { exact: true })).toBeVisible();
  }

  async expectSuccessMessage(action: string) {
    await expect(
      this.page.getByText(new RegExp(`${action} successfully`, "i")),
    ).toBeVisible();
  }

  async expectText(text: RegExp | string) {
    await expect(this.page.getByText(text)).toBeVisible();
  }

  async fillConfirmationInput(username: string) {
    await this.confirmationModalInput.pressSequentially(username);
  }

  async filterByType(type: string) {
    await this.typeFilter.click();
    await this.page.getByRole("option", { name: type }).click();
  }

  async getCurrentPage() {
    return await this.pagination.locator('[aria-current="true"]').textContent();
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
    await this.pagination.getByLabel("next").click();
  }

  async goToPrevPage() {
    await this.pagination.getByLabel("prev").click();
  }

  /**
   * Opens the repo action dropdown menu
   */
  async openRepoActionDropdown() {
    await this.actionDropdown.click();
  }

  async searchFor(query: string) {
    await this.searchInput.fill(query);
  }

  async selectAll() {
    await this.selectAllCheckbox.check();
  }

  /**
   * Selects the "Archive" action from the dropdown menu
   */
  async selectArchiveAction() {
    await this.openRepoActionDropdown();
    await this.repoActionDropdownItemArchive.click();

    await Promise.all([
      // Wait for the archive button to be visible
      expect(this.archiveButton).toBeVisible(),
      // Wait for the delete button to be not visible
      expect(this.deleteButton).not.toBeVisible(),
      expect(this.repoActionDropdownItemDelete).not.toBeVisible(),
    ]);
  }

  /**
   * Selects the "Delete" action from the dropdown menu
   */
  async selectDeleteAction() {
    await this.openRepoActionDropdown();
    await this.repoActionDropdownItemDelete.click();

    await Promise.all([
      // Wait for the delete button to be visible
      expect(this.deleteButton).toBeVisible(),
      // Wait for the archive button to be not visible
      expect(this.archiveButton).not.toBeVisible(),
      expect(this.repoActionDropdownItemArchive).not.toBeVisible(),
    ]);
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
