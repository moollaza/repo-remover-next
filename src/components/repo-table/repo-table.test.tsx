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

  test("does not expose repos on window in production mode", () => {
    // In production, window.repos must not be set (security: exposes private repo data)
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
});
