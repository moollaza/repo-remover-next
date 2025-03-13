import { DashboardPage } from "@e2e/pages/dashboard";
import {
  mockArchiveRepo,
  mockBulkActions,
  mockDeleteRepo,
  mockGraphQLRepos,
} from "@e2e/utils/github-api-mocks";
import { test } from "@playwright/test";

import { mockRepos } from "@/mocks/fixtures";

test.describe("Dashboard Page", () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    // Setup mocks for Octokit and GitHub API
    await dashboard.setupMocks();
    await mockGraphQLRepos(page);
    await dashboard.goto();
  });

  test("should display repository list", async () => {
    await dashboard.expectRepoVisible("test-repo-1");
    await dashboard.expectRepoVisible("test-repo-2");
    await dashboard.expectRepoVisible("Private");
    await dashboard.expectRepoVisible("Fork");
    await dashboard.expectRepoVisible("Archived");
  });

  test("should filter repositories", async () => {
    // Search functionality
    await dashboard.searchFor("test-repo-1");
    await dashboard.expectRepoVisible("test-repo-1");
    await dashboard.expectRepoNotVisible("test-repo-2");

    // Clear search
    await dashboard.clearSearch();

    // Filter by type
    await dashboard.filterByType("Private");
    await dashboard.expectRepoNotVisible("test-repo-1");
    await dashboard.expectRepoVisible("test-repo-2");
  });

  test("should handle successful repository archiving", async ({ page }) => {
    await mockArchiveRepo(page, "test-repo-1");
    await dashboard.selectRepository("test-repo-1");
    await dashboard.archiveSelectedRepos("testuser");
    await dashboard.expectSuccessMessage("archived");
  });

  test("should handle failed repository archiving", async ({ page }) => {
    await mockArchiveRepo(page, "test-repo-1", {
      error: "Repository access denied",
      success: false,
    });
    await dashboard.selectRepository("test-repo-1");
    await dashboard.archiveSelectedRepos("testuser");
    await dashboard.expectErrorMessage("Repository access denied");
  });

  test("should handle successful repository deletion", async ({ page }) => {
    await mockDeleteRepo(page, "test-repo-1");
    await dashboard.selectRepository("test-repo-1");
    await dashboard.deleteSelectedRepos("testuser");
    await dashboard.expectSuccessMessage("deleted");
  });

  test("should handle failed repository deletion", async ({ page }) => {
    await mockDeleteRepo(page, "test-repo-1", {
      error: "Repository access denied",
      success: false,
    });
    await dashboard.selectRepository("test-repo-1");
    await dashboard.deleteSelectedRepos("testuser");
    await dashboard.expectErrorMessage("Repository access denied");
  });

  test("should handle successful bulk actions", async ({ page }) => {
    await mockBulkActions(page);
    await dashboard.selectAllCheckbox.check();
    await dashboard.archiveSelectedRepos("testuser");
    await dashboard.expectProgressVisible(mockRepos.length);
    await dashboard.expectSuccessMessage("archived");
  });

  test("should handle failed bulk actions", async ({ page }) => {
    await mockBulkActions(page, {
      error: "Bulk action failed",
      success: false,
    });
    await dashboard.selectAllCheckbox.check();
    await dashboard.archiveSelectedRepos("testuser");
    await dashboard.expectErrorMessage("Bulk action failed");
  });

  test("should handle pagination", async () => {
    // Change items per page
    await dashboard.page.getByLabel("Repos Per page").click();
    await dashboard.page.getByText("5").click();

    // Verify pagination controls
    await dashboard.page.getByRole("button", { name: /next/i }).isDisabled();
    await dashboard.page.getByText("1 of 1").isVisible();
  });

  test("should handle sorting", async () => {
    // Sort by name
    await dashboard.page.getByRole("columnheader", { name: "Name" }).click();

    // Verify sort order
    const repos = await dashboard.page.getByRole("row").all();
    const firstRepo = await repos[1].textContent();
    expect(firstRepo).toContain("test-repo-1");

    // Sort in reverse
    await dashboard.page.getByRole("columnheader", { name: "Name" }).click();
    const reposReversed = await dashboard.page.getByRole("row").all();
    const firstRepoReversed = await reposReversed[1].textContent();
    expect(firstRepoReversed).toContain("test-repo-2");
  });

  test.describe("Confirmation Modal", () => {
    test.beforeEach(async () => {
      // Select a repository and open archive modal
      await dashboard.selectRepository("test-repo-1");
      await dashboard.archiveButton.click();
    });

    test("renders confirmation dialog with repository list", async () => {
      await dashboard.expectModalTitle(/Are you sure you want to archive/i);
      await dashboard.expectRepoVisible("test-repo-1");
      await dashboard.expectConfirmButtonDisabled();
    });

    test("requires correct username for confirmation", async () => {
      // Enter incorrect username
      await dashboard.fillConfirmationInput("wronguser");
      await dashboard.expectConfirmButtonDisabled();

      // Enter correct username
      await dashboard.fillConfirmationInput("testuser");
      await dashboard.expectConfirmButtonEnabled();
    });

    test("shows progress during repository processing", async () => {
      // Mock slow processing
      await mockArchiveRepo(dashboard.page, "test-repo-1", { delay: 1000 });

      // Confirm action
      await dashboard.fillConfirmationInput("testuser");
      await dashboard.confirmButton.click();

      // Check progress display
      await dashboard.expectText(/Archiving Repositories/i);
      await dashboard.expectProgressVisible(1);
    });

    test("handles successful repository processing", async () => {
      await mockArchiveRepo(dashboard.page, "test-repo-1");
      await dashboard.fillConfirmationInput("testuser");
      await dashboard.confirmButton.click();
      await dashboard.expectSuccessMessage("archived");
    });

    test("handles repository processing errors", async () => {
      await mockArchiveRepo(dashboard.page, "test-repo-1", {
        error: "Processing failed",
        success: false,
      });
      await dashboard.fillConfirmationInput("testuser");
      await dashboard.confirmButton.click();
      await dashboard.expectErrorMessage(/Failed to process/i);
    });

    test("handles modal close", async () => {
      await dashboard.cancelButton.click();
      await dashboard.expectModalNotVisible();
    });

    test("shows different text for delete action", async () => {
      // Close archive modal and open delete modal
      await dashboard.cancelButton.click();
      await dashboard.deleteSelectedRepos("testuser");
      await dashboard.expectModalTitle(/Are you sure you want to delete/i);
      await dashboard.expectText(/I understand the consequences, delete/i);
    });

    test("resets state when closed and reopened", async () => {
      // Fill username
      await dashboard.fillConfirmationInput("testuser");

      // Close and reopen modal
      await dashboard.cancelButton.click();
      await dashboard.archiveButton.click();

      // Username should be reset
      await dashboard.expectConfirmationInputEmpty();
    });

    test("shows singular/plural text correctly", async () => {
      // Test with single repo
      await dashboard.expectModalTitle(
        /Are you sure you want to archive the following 1 repository/i,
      );

      // Test with multiple repos
      await dashboard.cancelButton.click();
      await dashboard.selectRepository("test-repo-2");
      await dashboard.archiveButton.click();
      await dashboard.expectModalTitle(
        /Are you sure you want to archive the following 2 repositories/i,
      );
    });
  });
});
