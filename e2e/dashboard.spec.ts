import { DashboardPage } from "@e2e/pages/dashboard";
import { mockArchiveRepo } from "@e2e/utils/github-api-mocks";
import { expect, test } from "@playwright/test";

import { MOCK_REPO_TEMPLATES } from "@/mocks/fixture-utils";

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
    await dashboard.paginationFilter.click();
    await dashboard.page.getByTestId("per-page-option-10").click();

    // Verify pagination controls
    await dashboard.nextPageButton.isDisabled();
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

  test("should change action button when selecting different actions", async () => {
    // First select a repository so the action buttons are enabled
    await dashboard.selectRepository("repo-1");

    // By default, archive action should be selected
    await dashboard.expectRepoActionButton("archive");

    // When opening the dropdown, we should see both options
    await dashboard.openRepoActionDropdown();
    await expect(dashboard.repoActionDropdownItemArchive).toBeVisible();
    await expect(dashboard.repoActionDropdownItemDelete).toBeVisible();

    // When selecting delete action, the button should change
    await dashboard.selectDeleteAction();
    await dashboard.expectRepoActionButton("delete");

    // And we should be able to change back to archive
    await dashboard.selectArchiveAction();
    await dashboard.expectRepoActionButton("archive");
  });

  test.describe("Confirmation Modal", () => {
    test.beforeEach(async () => {
      // Select a repository
      await dashboard.selectRepository("repo-1");
    });

    test("should show different modals for archive and delete actions", async () => {
      // Open archive confirmation modal
      await dashboard.archiveButton.click();
      await dashboard.expectModalInMode("confirmation");
      await dashboard.expectModalTitle(/Confirm Archival/i);
      await dashboard.expectRepoInConfirmationModal("repo-1");

      // Close the modal
      await dashboard.cancelConfirmation();

      // Select delete action and open delete confirmation modal
      await dashboard.selectDeleteAction();
      await dashboard.deleteButton.click();

      // Should have different title and messaging
      await dashboard.expectModalInMode("confirmation");
      await dashboard.expectModalTitle(/Confirm Deletion/i);
      await dashboard.expectRepoInConfirmationModal("repo-1");
      await dashboard.expectText(/I understand the consequences, delete/i);
    });

    test("renders confirmation dialog with repository list", async () => {
      // Open the archive modal for this test
      await dashboard.archiveButton.click();

      await dashboard.expectModalTitle(/Confirm Archival/i);
      await dashboard.expectRepoInConfirmationModal("repo-1");
      await dashboard.expectConfirmButtonDisabled();
    });

    test("requires correct username for confirmation", async () => {
      // Open the archive modal for this test
      await dashboard.archiveButton.click();

      // Enter incorrect username
      await dashboard.fillConfirmationInput("wronguser");
      await dashboard.expectConfirmButtonDisabled();

      await dashboard.clearConfirmationInput();

      // Enter correct username
      await dashboard.fillConfirmationInput("testuser");
      await dashboard.expectConfirmButtonEnabled();
    });

    test("shows progress during repository processing", async () => {
      // Open the archive modal for this test
      await dashboard.archiveButton.click();

      // Mock slow processing
      await mockArchiveRepo(dashboard.page, "repo-1");

      // Confirm action
      await dashboard.confirmAction("testuser");

      // Check progress display
      await dashboard.expectModalInMode("progress");
      await expect(dashboard.progressModalHeader).toContainText(
        /Archiving Repositories/i,
      );
      await dashboard.expectProgressVisible(1);
    });

    test("handles successful repository processing", async () => {
      // Open the archive modal for this test
      await dashboard.archiveButton.click();

      await mockArchiveRepo(dashboard.page, "repo-1");
      await dashboard.confirmAction("testuser");
      await dashboard.expectModalInMode("result");
      await expect(dashboard.resultModalHeader).toContainText(
        /Archival Complete/i,
      );
      await dashboard.expectSuccessMessage("archived");
    });

    test("handles repository processing errors", async () => {
      // Open the archive modal for this test
      await dashboard.archiveButton.click();

      await mockArchiveRepo(dashboard.page, "repo-1", {
        error: "Processing failed",
        success: false,
      });
      await dashboard.confirmAction("testuser");
      await dashboard.expectModalInMode("result");
      await dashboard.page
        .getByText("1 error occurred while archiving the following repository:")
        .isVisible();

      await dashboard.page
        .getByText(
          'repo-1: Failed to archive repo-1:  {"message":"Processing failed"}',
        )
        .isVisible();
    });

    test("handles modal close", async () => {
      // Open the archive modal for this test
      await dashboard.archiveButton.click();

      await dashboard.cancelConfirmation();
      await dashboard.expectModalNotVisible();
    });

    test("shows different text for delete action", async () => {
      await dashboard.selectRepository("repo-1");
      await dashboard.selectDeleteAction();
      await dashboard.deleteButton.click();
      await dashboard.expectModalInMode("confirmation");
      await dashboard.expectModalBody(/Are you sure you want to delete/i);
      await dashboard.expectText(/I understand the consequences, delete/i);
    });

    test("resets state when closed and reopened", async () => {
      // Open the archive modal for this test
      await dashboard.archiveButton.click();

      // Fill username
      await dashboard.fillConfirmationInput("testuser");

      // Close and reopen modal
      await dashboard.cancelConfirmation();
      await dashboard.archiveButton.click();

      // Username should be reset
      await dashboard.expectConfirmationInputEmpty();
    });

    test("shows singular/plural text correctly", async () => {
      // Open the archive modal for this test
      await dashboard.archiveButton.click();

      // Test with single repo
      await dashboard.expectModalBody(
        /Are you sure you want to archive the following 1 repository/i,
      );

      // Test with multiple repos
      await dashboard.cancelConfirmation();
      await dashboard.selectRepository("repo-2");
      await dashboard.archiveButton.click();
      await dashboard.expectModalBody(
        /Are you sure you want to archive the following 2 repositories/i,
      );
    });

    test("can close the result modal", async () => {
      // Open the archive modal for this test
      await dashboard.archiveButton.click();

      // Complete the archiving process
      await mockArchiveRepo(dashboard.page, "repo-1");
      await dashboard.confirmAction("testuser");

      // Check we're in result mode
      await dashboard.expectModalInMode("result");

      // Close the result modal
      await dashboard.closeModalResult();

      // Modal should be gone
      await dashboard.expectModalNotVisible();
    });
  });
});
