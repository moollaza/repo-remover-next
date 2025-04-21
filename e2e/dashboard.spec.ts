import { DashboardPage } from "@e2e/pages/dashboard";
import {
  mockArchiveRepo,
  mockBulkActions,
  mockDeleteRepo,
} from "@e2e/utils/github-api-mocks";
import { expect, test } from "@playwright/test";

import { MOCK_REPO_TEMPLATES } from "@/mocks/fixture-utils";
import { mockRepos } from "@/mocks/fixtures";

test.describe("Dashboard Page", () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    // Setup mocks for Octokit and GitHub API
    await dashboard.setupMocks();

    await dashboard.goto();
  });

  test("should display administerable repositories on first page", async ({
    page,
  }) => {
    // Get all repo rows
    const repoRows = page.locator('[data-testid="repo-row"]');

    // We should have 5 repos per page
    await expect(repoRows).toHaveCount(5);

    // Check repos 1-5 are displayed (all have viewerCanAdminister: true)
    for (let i = 0; i < 5; i++) {
      const template = MOCK_REPO_TEMPLATES[i];
      await dashboard.expectRepoNameVisible(template.name);
    }

    // Verify repos 6 and 8 are NOT visible since viewerCanAdminister is false
    await dashboard.expectRepoNotVisible(MOCK_REPO_TEMPLATES[5].name); // repo-6
    await dashboard.expectRepoNotVisible(MOCK_REPO_TEMPLATES[7].name); // repo-8
  });

  test("should display correct tags for each repository", async () => {
    // Check appropriate tags for each visible repository on first page
    for (let i = 0; i < 5; i++) {
      const template = MOCK_REPO_TEMPLATES[i];

      if (template.isPrivate) {
        await dashboard.expectRepoHasTag(template.name, "Private");
      }

      if (template.isFork) {
        await dashboard.expectRepoHasTag(template.name, "Fork");
      }

      if (template.isArchived) {
        await dashboard.expectRepoHasTag(template.name, "Archived");
      }

      if (template.isInOrganization) {
        await dashboard.expectRepoHasTag(template.name, "Organization");
      }

      // Verify owner information when it's not the current user
      if (template.ownerType !== "current-user") {
        await dashboard.expectRepoHasOwner(template.name);
      }
    }
  });

  test("should properly paginate repositories", async ({ page }) => {
    await dashboard.expectRepoVisible("repo-1");

    // Get all repo rows on first page
    const repoRows = page.locator('[data-testid="repo-row"]');
    await expect(repoRows).toHaveCount(5);

    // Test pagination - go to page 2 using our new helper method
    await dashboard.goToNextPage();

    // Check that we're on page 2 using our new helper method
    await dashboard.expectCurrentPage(2);

    // The administerable repositories on page 2 should be repo-7, repo-9, and repo-10
    // (skipping repo-6 and repo-8 which have viewerCanAdminister: false)
    await dashboard.expectRepoNameVisible(MOCK_REPO_TEMPLATES[6].name); // repo-7
    await dashboard.expectRepoNameVisible(MOCK_REPO_TEMPLATES[8].name); // repo-9
    await dashboard.expectRepoNameVisible(MOCK_REPO_TEMPLATES[9].name); // repo-10

    // Verify repos from page 1 are not visible on page 2
    await dashboard.expectRepoNotVisible(MOCK_REPO_TEMPLATES[0].name); // repo-1

    // Test going back to page 1
    await dashboard.goToPrevPage();
    await dashboard.expectCurrentPage(1);

    // Check first page repos are visible again
    await dashboard.expectRepoNameVisible(MOCK_REPO_TEMPLATES[0].name); // repo-1
    await dashboard.expectRepoNotVisible(MOCK_REPO_TEMPLATES[6].name); // repo-7
  });

  test("should filter repositories", async () => {
    await dashboard.expectRepoVisible("repo-1");

    // Search functionality
    await dashboard.searchFor("repo-1");
    await dashboard.expectRepoVisible("repo-1");
    await dashboard.expectRepoNotVisible("repo-2");

    // Clear search
    await dashboard.clearSearch();

    // Filter by type
    await dashboard.filterByType("Private");
    await dashboard.expectRepoNotVisible("repo-2");
  });

  test("should handle pagination", async () => {
    await dashboard.expectRepoVisible("repo-1");

    // Change items per page
    await dashboard.repoPagination.click();
    await dashboard.page.getByTestId("per-page-option-10").click();

    // Verify pagination controls
    await dashboard.page.getByRole("button", { name: /next/i }).isDisabled();
    await dashboard.page.getByText("1 of 1").isVisible();
  });

  test("should handle sorting", async () => {
    await dashboard.expectRepoVisible("repo-1");

    // Sort by name
    await dashboard.page.getByRole("columnheader", { name: "Name" }).click();
    // Verify ascending sort
    await dashboard.expectRepoAtPosition(1, "repo-1");

    // Sort by name in reverse
    await dashboard.page.getByRole("columnheader", { name: "Name" }).click();
    // Verify descending sort
    await dashboard.expectRepoAtPosition(1, "repo-9");

    // Sort by last updated
    const lastUpdatedHeader = dashboard.page.getByRole("columnheader", {
      name: "Last updated",
    });
    await lastUpdatedHeader.click();
    // Verify descending sort by last updated
    await dashboard.expectRepoAtPosition(1, "repo-10");

    // Sort by last updated in reverse
    await lastUpdatedHeader.click();
    // Verify ascending sort by last updated
    await dashboard.expectRepoAtPosition(1, "repo-1");
  });

  test.describe("Confirmation Modal", () => {
    test.beforeEach(async () => {
      // Select a repository and open archive modal
      await dashboard.selectRepository("repo-1");
      await dashboard.archiveButton.click();
    });

    test("renders confirmation dialog with repository list", async () => {
      await dashboard.expectModalTitle(/Are you sure you want to archive/i);
      await dashboard.expectRepoVisible("repo-1");
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
      await mockArchiveRepo(dashboard.page, "repo-1");

      // Confirm action
      await dashboard.fillConfirmationInput("testuser");
      await dashboard.confirmButton.click();

      // Check progress display
      await dashboard.expectText(/Archiving Repositories/i);
      await dashboard.expectProgressVisible(1);
    });

    test("handles successful repository processing", async () => {
      await mockArchiveRepo(dashboard.page, "repo-1");
      await dashboard.fillConfirmationInput("testuser");
      await dashboard.confirmButton.click();
      await dashboard.expectSuccessMessage("archived");
    });

    test("handles repository processing errors", async () => {
      await mockArchiveRepo(dashboard.page, "repo-1", {
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
      await dashboard.selectRepository("repo-2");
      await dashboard.archiveButton.click();
      await dashboard.expectModalTitle(
        /Are you sure you want to archive the following 2 repositories/i,
      );
    });
  });
});
