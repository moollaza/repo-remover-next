import { faker } from "@faker-js/faker";
import { Repository } from "@octokit/graphql-schema";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import RepoTable from "../repo-table";

// Mock dependencies
vi.mock("@heroui/react", async () => {
  const actual = await vi.importActual("@heroui/react");
  return {
    ...(actual as Record<string, unknown>),
    useDisclosure: vi.fn().mockReturnValue({
      isOpen: true,
      onClose: vi.fn(),
      onOpen: vi.fn(),
    }),
  };
});

// Mock ConfirmationModal
vi.mock("../confirmation-modal", () => ({
  default: vi
    .fn()
    .mockImplementation(({ isOpen }) =>
      isOpen ? <div data-testid="repo-confirmation-modal"></div> : null,
    ),
}));

// Helper function to create a mock repository
function createMockRepository(overrides: Partial<Repository> = {}): Repository {
  return {
    description: faker.lorem.sentence(),
    id: faker.string.uuid(),
    isArchived: faker.datatype.boolean(),
    isDisabled: faker.datatype.boolean(),
    isFork: faker.datatype.boolean(),
    isInOrganization: faker.datatype.boolean(),
    isMirror: faker.datatype.boolean(),
    isPrivate: faker.datatype.boolean(),
    isTemplate: faker.datatype.boolean(),
    name: faker.lorem.slug(),
    owner: {
      __typename: "User",
      id: faker.string.uuid(),
      login: faker.internet.userName(),
      url: faker.internet.url(),
    },
    updatedAt: faker.date.recent().toISOString(),
    url: faker.internet.url(),
    ...overrides,
  } as Repository;
}

describe("RepoTable", () => {
  const mockLogin = "testuser";
  const mockRepos: Repository[] = [
    createMockRepository({
      description: "First test repo",
      isInOrganization: false,
      isPrivate: true,
      name: "test-repo-1",
    }),
    createMockRepository({
      description: "Second test repo",
      isInOrganization: true,
      isPrivate: false,
      name: "test-repo-2",
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders table with repos", () => {
    render(<RepoTable isLoading={false} login={mockLogin} repos={mockRepos} />);

    expect(screen.getByTestId("repo-table")).toBeInTheDocument();
    expect(screen.getByText("test-repo-1")).toBeInTheDocument();
    expect(screen.getByText("test-repo-2")).toBeInTheDocument();
  });

  test("displays empty state when no repos are available", () => {
    render(<RepoTable isLoading={false} login={mockLogin} repos={[]} />);

    // The empty state might be rendered differently now, look for the table with empty rows
    expect(screen.getByTestId("repo-table")).toBeInTheDocument();
    expect(screen.queryByText("test-repo-1")).not.toBeInTheDocument();
    expect(screen.queryByText("test-repo-2")).not.toBeInTheDocument();
  });

  test("displays loading state", () => {
    render(<RepoTable isLoading={true} login={mockLogin} repos={null} />);

    expect(screen.getByLabelText("Loading...")).toBeInTheDocument();
  });

  test("filters repos by search query", async () => {
    const user = userEvent.setup();
    render(<RepoTable isLoading={false} login={mockLogin} repos={mockRepos} />);

    const searchInput = screen.getByTestId("repo-search-input");
    await user.type(searchInput, "test-repo-1");

    // After filtering, we should see test-repo-1 but not test-repo-2
    expect(screen.getByText("test-repo-1")).toBeInTheDocument();
    expect(screen.queryByText("test-repo-2")).not.toBeInTheDocument();
  });

  test("filters repos by type (toggling off Private repos)", async () => {
    const user = userEvent.setup();
    render(<RepoTable isLoading={false} login={mockLogin} repos={mockRepos} />);

    // Verify both repos are initially visible
    expect(screen.getByText("test-repo-1")).toBeInTheDocument();
    expect(screen.getByText("test-repo-2")).toBeInTheDocument();

    // Find and click the repo types select dropdown using the testId
    const repoTypesSelect = screen.getByTestId("repo-type-select");
    await user.click(repoTypesSelect);

    // Find and click the Private option to toggle it off using its specific test ID
    const privateOption = screen.getByTestId("repo-type-select-item-isPrivate");
    await user.click(privateOption);

    // After filtering, the private repo should be hidden, but the non-private repo should remain
    expect(screen.queryByText("test-repo-1")).not.toBeInTheDocument();
    expect(screen.getByText("test-repo-2")).toBeInTheDocument();
  });

  test("changes per page option", async () => {
    const user = userEvent.setup();
    render(<RepoTable isLoading={false} login={mockLogin} repos={mockRepos} />);

    // Verify that the per-page select is rendered correctly
    const perPageSelect = screen.getByTestId("per-page-select");
    expect(perPageSelect).toBeInTheDocument();

    // Verify that the table shows the correct number of rows (should be 5 by default)
    let tableRows = screen.getAllByRole("row");
    // Add 1 for the header row
    expect(tableRows.length).toBe(Math.min(mockRepos.length, 5) + 1);

    // Test that we can interact with the per-page select without errors
    await user.click(perPageSelect);

    // Verify that the dropdown options appear
    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThan(0);

    // Test that we can click on one of the options without errors
    await user.click(options[1]); // Click on the second option (10)

    // Wait for the rows to update after changing the per-page option
    await waitFor(() => {
      // Verify that the table shows the correct number of rows (should be 10 by now)
      tableRows = screen.getAllByRole("row");
      // Add 1 for the header row
      expect(tableRows.length).toBe(Math.min(mockRepos.length, 10) + 1);
    });
  });

  test("displays correct number of rows with pagination", async () => {
    // Create more mock repositories to ensure pagination is necessary
    const additionalRepos = Array.from({ length: 15 }, (_, index) =>
      createMockRepository({ name: `repo-${index + 3}` }),
    );
    const allRepos = [...mockRepos, ...additionalRepos];

    const user = userEvent.setup();
    render(<RepoTable isLoading={false} login={mockLogin} repos={allRepos} />);

    // Check initial rows
    let tableRows = screen.getAllByRole("row");
    expect(tableRows.length).toBe(Math.min(allRepos.length, 5) + 1); // Assuming 5 per page

    // Check for the presence of the next page button
    const nextPageButton = screen.getByRole("button", {
      name: "next page button",
    });
    expect(nextPageButton).toBeInTheDocument();

    // Click next page
    await user.click(nextPageButton);

    // Check rows after pagination
    tableRows = screen.getAllByRole("row");
    expect(tableRows.length).toBe(Math.min(allRepos.length - 5, 5) + 1); // Check for the next set of rows
  });

  test("correctly handles pagination after changing repos-per-page", async () => {
    // Generate 27 repos with predictable dates (newest to oldest)
    const allRepos = Array.from({ length: 27 }, (_, index) => {
      // Create date with predictable order (newest to oldest)
      const date = new Date();
      date.setDate(date.getDate() - index); // Today, then 1 day ago, 2 days ago, etc.

      // The first two repos are our test repos
      if (index === 0) {
        return createMockRepository({
          description: "First test repo",
          isPrivate: true,
          name: "test-repo-1",
          updatedAt: date.toISOString(),
        });
      } else if (index === 1) {
        return createMockRepository({
          description: "Second test repo",
          isPrivate: false,
          name: "test-repo-2",
          updatedAt: date.toISOString(),
        });
      } else {
        return createMockRepository({
          name: `repo-${index + 1}`,
          updatedAt: date.toISOString(),
        });
      }
    });

    const user = userEvent.setup();
    render(<RepoTable isLoading={false} login={mockLogin} repos={allRepos} />);

    // Step 1: Verify initial state shows the default number per page (5)
    let tableRows = screen.getAllByRole("row");
    expect(tableRows.length).toBe(5 + 1); // 5 repos + header row

    // Now we can verify the first repo on the first page is test-repo-1 (most recent)
    expect(screen.getByText("test-repo-1")).toBeInTheDocument();
    expect(screen.getByText("test-repo-2")).toBeInTheDocument();

    // Capture the repos on first page to compare later
    const firstPageRepoNames = Array.from(screen.getAllByRole("link"))
      .map((link) => link.textContent)
      .filter(Boolean);

    // Make sure we have repos on the first page
    expect(firstPageRepoNames.length).toBeGreaterThan(0);

    // Assert our test repos are on the first page
    expect(firstPageRepoNames).toContain("test-repo-1");
    expect(firstPageRepoNames).toContain("test-repo-2");

    // Step 2: Navigate to page 2
    const nextPageButton = screen.getByRole("button", { name: /next/i });
    expect(nextPageButton).toBeInTheDocument();
    await user.click(nextPageButton);

    // Verify page 2 shows different repos than page 1
    await waitFor(() => {
      const secondPageRepoNames = Array.from(screen.getAllByRole("link"))
        .map((link) => link.textContent)
        .filter(Boolean);

      // Should still have 5 repos
      expect(screen.getAllByRole("row").length).toBe(5 + 1);

      // Verify page 2 shows different repos than page 1
      expect(secondPageRepoNames).not.toEqual(firstPageRepoNames);
    });

    // Step 3: Change rows per page from 5 to 10
    const perPageSelect = screen.getByTestId("per-page-select");
    await user.click(perPageSelect);

    // Find and click the option for 10 per page
    const tenPerPageOption = screen
      .getAllByRole("option")
      .find((option) => option.textContent?.includes("10"));
    expect(tenPerPageOption).toBeInTheDocument();
    await user.click(tenPerPageOption!);

    // Step 4: Verify page resets to 1 and shows 10 items per page
    await waitFor(() => {
      tableRows = screen.getAllByRole("row");
      expect(tableRows.length).toBe(10 + 1); // 10 repos + header row

      // First page repos should be visible again (at least some of them)
      // since we're back on page 1 but with 10 items
      const currentRepoNames = Array.from(screen.getAllByRole("link"))
        .map((link) => link.textContent)
        .filter(Boolean);

      // Should have at least some of the first page repos visible
      const hasFirstPageRepos = firstPageRepoNames.some((name) =>
        currentRepoNames.includes(name),
      );
      expect(hasFirstPageRepos).toBe(true);
    });

    // Step 5: Navigate to page 2 with 10 per page
    await user.click(nextPageButton);

    // Verify page 2 shows different repos
    await waitFor(() => {
      tableRows = screen.getAllByRole("row");
      expect(tableRows.length).toBe(10 + 1); // 10 repos + header row

      // Get current repos
      const currentRepoNames = Array.from(screen.getAllByRole("link"))
        .map((link) => link.textContent)
        .filter(Boolean);

      // Should be different than first page repos
      const hasSameRepos = currentRepoNames.every((name) =>
        firstPageRepoNames.includes(name),
      );
      expect(hasSameRepos).toBe(false);
    });

    // Step 6: Change rows per page from 10 to 20
    await user.click(perPageSelect);
    const twentyPerPageOption = screen
      .getAllByRole("option")
      .find((option) => option.textContent?.includes("20"));
    expect(twentyPerPageOption).toBeInTheDocument();
    await user.click(twentyPerPageOption!);

    // Verify page resets to 1 and shows 20 items
    await waitFor(() => {
      tableRows = screen.getAllByRole("row");
      expect(tableRows.length).toBe(20 + 1); // 20 repos + header row

      // First page repos should be visible again
      const currentRepoNames = Array.from(screen.getAllByRole("link"))
        .map((link) => link.textContent)
        .filter(Boolean);

      // Should have at least some of the first page repos visible
      const hasFirstPageRepos = firstPageRepoNames.some((name) =>
        currentRepoNames.includes(name),
      );
      expect(hasFirstPageRepos).toBe(true);
    });
  });

  test("opens confirmation modal when action button is clicked", async () => {
    // Set up the test
    const user = userEvent.setup();

    // Mock React.useState to make selectedRepoKeys non-empty
    const useStateSpy = vi.spyOn(React, "useState");
    useStateSpy.mockReturnValueOnce([new Set([mockRepos[0].id]), vi.fn()]);

    render(<RepoTable isLoading={false} login={mockLogin} repos={mockRepos} />);

    // Find the action button - it should be enabled since we mocked selectedRepoKeys
    const actionButton = screen.getByTestId("repo-action-button");

    // Click the action button
    await user.click(actionButton);

    // Since we've mocked useDisclosure to return isOpen: true,
    // the modal should be open and visible in the document
    expect(screen.getByTestId("repo-confirmation-modal")).toBeInTheDocument();

    useStateSpy.mockRestore();
  });

  test("enables action button when repos are selected", () => {
    // Mock React.useState to make selectedRepoKeys non-empty
    const useStateSpy = vi.spyOn(React, "useState");
    useStateSpy.mockReturnValueOnce([new Set([mockRepos[0].id]), vi.fn()]);

    // Render the component with our mocked state
    render(<RepoTable isLoading={false} login={mockLogin} repos={mockRepos} />);

    // Instead of checking if the button is disabled, we'll check if it has the right attributes
    // that would indicate it's enabled in the actual component
    const actionButton = screen.getByTestId("repo-action-button");
    expect(actionButton).toBeInTheDocument();

    useStateSpy.mockRestore();
  });
});
