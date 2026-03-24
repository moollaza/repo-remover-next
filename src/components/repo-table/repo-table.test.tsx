import { type Repository } from "@octokit/graphql-schema";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { createMockRepo } from "@/mocks/static-fixtures";
import { render, screen } from "@/utils/test-utils";

import RepoTable from "./repo-table";

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

// Mock ConfirmationModal — capture props so tests can assert on them
const { MockConfirmationModal } = vi.hoisted(() => {
  const MockConfirmationModal = vi
    .fn()
    .mockImplementation(
      ({ action, isOpen }: { action: string; isOpen: boolean }) =>
        isOpen ? (
          <div data-action={action} data-testid="repo-confirmation-modal"></div>
        ) : null,
    );
  return { MockConfirmationModal };
});
vi.mock("./confirmation-modal", () => ({
  default: MockConfirmationModal,
}));

describe("RepoTable", () => {
  const mockLogin = "testuser";
  const mockRepos: Repository[] = [
    createMockRepo({
      description: "First test repo",
      id: "test-repo-1",
      isInOrganization: false,
      isPrivate: true,
      name: "test-repo-1",
      url: "https://github.com/testuser/test-repo-1",
    }),
    createMockRepo({
      description: "Second test repo",
      id: "test-repo-2",
      isInOrganization: true,
      isPrivate: false,
      name: "test-repo-2",
      url: "https://github.com/testuser/test-repo-2",
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Clean up window.repos before each test
    delete (window as unknown as Record<string, unknown>).repos;
  });

  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).repos;
  });

  test("renders table with repos", () => {
    render(<RepoTable login={mockLogin} repos={mockRepos} />);

    expect(screen.getByTestId("repo-table")).toBeInTheDocument();
    expect(screen.getByText("test-repo-1")).toBeInTheDocument();
    expect(screen.getByText("test-repo-2")).toBeInTheDocument();
  });

  test("displays empty state when no repos are available", () => {
    render(<RepoTable login={mockLogin} repos={[]} />);

    expect(screen.getByTestId("repo-table")).toBeInTheDocument();
    expect(screen.queryByText("test-repo-1")).not.toBeInTheDocument();
    expect(screen.queryByText("test-repo-2")).not.toBeInTheDocument();

    // Check for empty state message
    expect(screen.queryByText("No repos to display.")).toBeInTheDocument();
  });

  test("disables archived repos when archive action is selected", () => {
    const mockReposWithArchived: Repository[] = [
      createMockRepo({
        description: "Active repo",
        id: "active-repo",
        isArchived: false,
        name: "active-repo",
      }),
      createMockRepo({
        description: "Archived repo",
        id: "archived-repo",
        isArchived: true,
        name: "archived-repo",
      }),
    ];

    render(<RepoTable login={mockLogin} repos={mockReposWithArchived} />);

    // Find archived repo and verify its row has disabled styling
    expect(screen.getByText("active-repo")).toBeInTheDocument();
    expect(screen.getByText("archived-repo")).toBeInTheDocument();

    // The archived repo should be disabled when archive action is selected (which is the default)
    // Check for disabled styling on the archived repo row
    const archivedRepoRow = screen
      .getByText("archived-repo")
      .closest('[data-testid="repo-row"]');
    expect(archivedRepoRow).toHaveClass("pointer-events-none");
    expect(archivedRepoRow).toHaveClass("opacity-50");

    // Active repo should not have these classes
    const activeRepoRow = screen
      .getByText("active-repo")
      .closest('[data-testid="repo-row"]');
    expect(activeRepoRow).not.toHaveClass("opacity-50");
    expect(activeRepoRow).not.toHaveClass("pointer-events-none");
  });

  test("passes a valid action prop to ConfirmationModal (defaults to archive)", () => {
    render(<RepoTable login={mockLogin} repos={mockRepos} />);

    // ConfirmationModal should receive "archive" as default action, never undefined
    const modal = screen.getByTestId("repo-confirmation-modal");
    expect(modal).toHaveAttribute("data-action", "archive");
  });

  test("removes archived repos from selection when switching from delete to archive action", async () => {
    const user = userEvent.setup();

    const activeRepo = createMockRepo({
      id: "active-repo",
      isArchived: false,
      name: "active-repo",
    });
    const archivedRepo = createMockRepo({
      id: "archived-repo",
      isArchived: true,
      name: "archived-repo",
    });

    render(<RepoTable login={mockLogin} repos={[activeRepo, archivedRepo]} />);

    // Step 1: Switch to "delete" action so archived repos are selectable
    const dropdownTrigger = screen.getByTestId("repo-action-dropdown-trigger");
    await user.click(dropdownTrigger);
    const deleteOption = await screen.findByTestId(
      "repo-action-dropdown-item-delete",
    );
    await user.click(deleteOption);

    // Step 2: Select all repos (including the archived one, now selectable in delete mode)
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]); // select-all checkbox

    // Verify both repos are selected (archived repo is in the selection)
    const callsBeforeSwitch = MockConfirmationModal.mock.calls;
    const propsBeforeSwitch =
      callsBeforeSwitch[callsBeforeSwitch.length - 1][0];
    expect(
      propsBeforeSwitch.repos.some((r: Repository) => r.id === "archived-repo"),
    ).toBe(true);

    // Step 3: Switch back to "archive" action
    await user.click(dropdownTrigger);
    const archiveOption = await screen.findByTestId(
      "repo-action-dropdown-item-archive",
    );
    await user.click(archiveOption);

    // Step 4: Verify the archived repo is removed from selection
    const callsAfterSwitch = MockConfirmationModal.mock.calls;
    const propsAfterSwitch = callsAfterSwitch[callsAfterSwitch.length - 1][0];
    expect(
      propsAfterSwitch.repos.some((r: Repository) => r.id === "archived-repo"),
    ).toBe(false);
    // Active repo should still be selected
    expect(
      propsAfterSwitch.repos.some((r: Repository) => r.id === "active-repo"),
    ).toBe(true);

    // Step 5: Verify disabledKeys — archived repo row should be disabled again
    const archivedRow = screen
      .getByText("archived-repo")
      .closest('[data-testid="repo-row"]');
    expect(archivedRow).toHaveClass("pointer-events-none");
    expect(archivedRow).toHaveClass("opacity-50");
  });

  test("selected repos persist after search filter hides them", async () => {
    const user = userEvent.setup();

    // Create repos with distinct names so search can isolate one
    const alphaRepo = createMockRepo({
      description: "Alpha project",
      id: "alpha-repo",
      name: "alpha-project",
    });
    const betaRepo = createMockRepo({
      description: "Beta project",
      id: "beta-repo",
      name: "beta-project",
    });

    render(<RepoTable login={mockLogin} repos={[alphaRepo, betaRepo]} />);

    // Step 1: Select all repos
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]); // select-all checkbox

    // Verify both repos are passed to ConfirmationModal
    let calls = MockConfirmationModal.mock.calls;
    let lastProps = calls[calls.length - 1][0];
    expect(lastProps.repos).toHaveLength(2);
    expect(lastProps.repos.some((r: Repository) => r.id === "alpha-repo")).toBe(
      true,
    );
    expect(lastProps.repos.some((r: Repository) => r.id === "beta-repo")).toBe(
      true,
    );

    // Step 2: Type in search to filter — only "alpha" should be visible
    const searchInput = screen.getByTestId("repo-search-input");
    await user.type(searchInput, "alpha");

    // Verify only alpha-project is visible in the table
    expect(screen.getByText("alpha-project")).toBeInTheDocument();
    expect(screen.queryByText("beta-project")).not.toBeInTheDocument();

    // Step 3: Verify that selectedRepos still includes the now-hidden beta repo
    // (selectedRepos is derived from the full repos list, not filteredRepos)
    calls = MockConfirmationModal.mock.calls;
    lastProps = calls[calls.length - 1][0];
    expect(lastProps.repos.some((r: Repository) => r.id === "alpha-repo")).toBe(
      true,
    );
    expect(lastProps.repos.some((r: Repository) => r.id === "beta-repo")).toBe(
      true,
    );
  });

  describe("sort column click behavior", () => {
    // Repos with distinct names and dates for verifiable sort order
    const sortableRepos: Repository[] = [
      createMockRepo({
        description: "Alpha project",
        id: "alpha-id",
        name: "alpha-repo",
        updatedAt: "2023-01-01T00:00:00Z",
      }),
      createMockRepo({
        description: "Charlie project",
        id: "charlie-id",
        name: "charlie-repo",
        updatedAt: "2023-03-01T00:00:00Z",
      }),
      createMockRepo({
        description: "Beta project",
        id: "beta-id",
        name: "beta-repo",
        updatedAt: "2023-02-01T00:00:00Z",
      }),
    ];

    function getRepoNameOrder(): string[] {
      return screen.getAllByTestId("repo-row").map((row) => {
        const nameEl = row.querySelector('[data-testid="repo-name"]');
        return nameEl?.textContent ?? "";
      });
    }

    test("default sort is by Last Updated descending", () => {
      render(<RepoTable login={mockLogin} repos={sortableRepos} />);

      // Default: updatedAt descending → charlie (Mar), beta (Feb), alpha (Jan)
      expect(getRepoNameOrder()).toEqual([
        "charlie-repo",
        "beta-repo",
        "alpha-repo",
      ]);

      // Last Updated column should have aria-sort="descending"
      const lastUpdatedHeader = screen.getByRole("columnheader", {
        name: /last updated/i,
      });
      expect(lastUpdatedHeader).toHaveAttribute("aria-sort", "descending");
    });

    test("clicking Name column sorts ascending, then toggles to descending", async () => {
      const user = userEvent.setup();
      render(<RepoTable login={mockLogin} repos={sortableRepos} />);

      const nameHeader = screen.getByRole("columnheader", { name: /^name$/i });

      // Click Name header → ascending
      await user.click(nameHeader);

      expect(getRepoNameOrder()).toEqual([
        "alpha-repo",
        "beta-repo",
        "charlie-repo",
      ]);
      expect(nameHeader).toHaveAttribute("aria-sort", "ascending");

      // Click Name header again → descending
      await user.click(nameHeader);

      expect(getRepoNameOrder()).toEqual([
        "charlie-repo",
        "beta-repo",
        "alpha-repo",
      ]);
      expect(nameHeader).toHaveAttribute("aria-sort", "descending");
    });

    test("clicking Last Updated after Name switches sort column back", async () => {
      const user = userEvent.setup();
      render(<RepoTable login={mockLogin} repos={sortableRepos} />);

      const nameHeader = screen.getByRole("columnheader", { name: /^name$/i });
      const lastUpdatedHeader = screen.getByRole("columnheader", {
        name: /last updated/i,
      });

      // Sort by name first
      await user.click(nameHeader);
      expect(nameHeader).toHaveAttribute("aria-sort", "ascending");

      // Switch to Last Updated
      await user.click(lastUpdatedHeader);

      // aria-sort should move to the Last Updated column
      expect(lastUpdatedHeader).toHaveAttribute("aria-sort");
      // Name column should no longer have aria-sort
      expect(nameHeader).not.toHaveAttribute("aria-sort", "ascending");
      expect(nameHeader).not.toHaveAttribute("aria-sort", "descending");
    });
  });

  describe("pagination rendering and navigation", () => {
    // Default perPage is 5 (PER_PAGE_OPTIONS[0]), so we need >5 repos for pagination
    const paginatedRepos: Repository[] = Array.from({ length: 12 }, (_, i) =>
      createMockRepo({
        description: `Repo ${i + 1} description`,
        id: `paginated-repo-${i + 1}`,
        name: `paginated-repo-${String(i + 1).padStart(2, "0")}`,
        updatedAt: `2023-${String(12 - i).padStart(2, "0")}-01T00:00:00Z`,
      }),
    );

    test("pagination renders only when totalPages > 1", () => {
      // With 12 repos and perPage=5 → 3 pages → pagination should render
      render(<RepoTable login={mockLogin} repos={paginatedRepos} />);
      expect(
        screen.getByRole("navigation", { name: /pagination/i }),
      ).toBeInTheDocument();
    });

    test("pagination does not render when all items fit on one page", () => {
      // 2 repos with perPage=5 → 1 page → no pagination
      render(<RepoTable login={mockLogin} repos={mockRepos} />);
      expect(
        screen.queryByRole("navigation", { name: /pagination/i }),
      ).not.toBeInTheDocument();
    });

    test("clicking a page number updates displayed repos", async () => {
      const user = userEvent.setup();
      render(<RepoTable login={mockLogin} repos={paginatedRepos} />);

      // Page 1: should show first 5 repos
      const rows = screen.getAllByTestId("repo-row");
      expect(rows).toHaveLength(5);

      // Click page 2 button (HeroUI uses "pagination item N" aria-labels)
      const page2Button = screen.getByRole("button", {
        name: "pagination item 2",
      });
      await user.click(page2Button);

      // Should still have 5 rows on page 2
      const page2Rows = screen.getAllByTestId("repo-row");
      expect(page2Rows).toHaveLength(5);
    });

    test("clicking next navigates to the next page", async () => {
      const user = userEvent.setup();
      render(<RepoTable login={mockLogin} repos={paginatedRepos} />);

      // Click "next page button" control (HeroUI label)
      const nextButton = screen.getByRole("button", {
        name: "next page button",
      });
      await user.click(nextButton);

      // Verify we moved to page 2 — page 2 button should now be active
      const page2Button = screen.getByRole("button", {
        name: /pagination item 2/,
      });
      expect(page2Button).toHaveAttribute("aria-current", "true");
    });

    test("clicking previous navigates to the previous page", async () => {
      const user = userEvent.setup();
      render(<RepoTable login={mockLogin} repos={paginatedRepos} />);

      // Navigate to page 2 first
      const nextButton = screen.getByRole("button", {
        name: "next page button",
      });
      await user.click(nextButton);

      // Click "previous page button" control (HeroUI label)
      const prevButton = screen.getByRole("button", {
        name: "previous page button",
      });
      await user.click(prevButton);

      // Verify we're back on page 1 — page 1 button should be active
      const page1Button = screen.getByRole("button", {
        name: /pagination item 1/,
      });
      expect(page1Button).toHaveAttribute("aria-current", "true");
    });

    test("last page shows remaining items (not a full page)", async () => {
      const user = userEvent.setup();
      render(<RepoTable login={mockLogin} repos={paginatedRepos} />);

      // Navigate to page 3 (12 repos / 5 per page = 3 pages, last page has 2)
      const page3Button = screen.getByRole("button", {
        name: "pagination item 3",
      });
      await user.click(page3Button);

      const rows = screen.getAllByTestId("repo-row");
      expect(rows).toHaveLength(2);
    });
  });

  describe("window.repos dev guard", () => {
    test("does not expose repos on window in production mode", () => {
      const originalDev = import.meta.env.DEV;
      import.meta.env.DEV = false;

      try {
        render(<RepoTable login={mockLogin} repos={mockRepos} />);
        expect(
          (window as unknown as Record<string, unknown>).repos,
        ).toBeUndefined();
      } finally {
        import.meta.env.DEV = originalDev;
      }
    });

    test("exposes repos on window in dev mode", () => {
      // DEV is true by default in Vitest
      expect(import.meta.env.DEV).toBe(true);

      render(<RepoTable login={mockLogin} repos={mockRepos} />);
      expect((window as unknown as Record<string, unknown>).repos).toBe(
        mockRepos,
      );
    });
  });
});
