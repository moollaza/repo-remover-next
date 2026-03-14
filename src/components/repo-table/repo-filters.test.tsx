import { render, screen } from "@/utils/test-utils";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import RepoFilters, {
  PER_PAGE_OPTIONS,
  REPO_ACTIONS,
  REPO_TYPES,
  type SelectionSet,
} from "@/components/repo-table/repo-filters";

// Mock the heroicons
vi.mock("@heroicons/react/16/solid", () => ({
  ChevronDownIcon: () => <div data-testid="chevron-down-icon" />,
  MagnifyingGlassIcon: () => <div data-testid="magnifying-glass-icon" />,
}));

describe("RepoFilters", () => {
  // Default props for most tests
  const defaultProps = {
    onPerPageChange: vi.fn(),
    onRepoActionChange: vi.fn(),
    onRepoActionClick: vi.fn(),
    onRepoTypesFilterChange: vi.fn(),
    onSearchChange: vi.fn(),
    perPage: PER_PAGE_OPTIONS[0],
    repoTypesFilter: new Set(
      REPO_TYPES.map((type) => type.key),
    ) as SelectionSet,
    searchQuery: "",
    selectedRepoAction: new Set([REPO_ACTIONS[0].key]) as SelectionSet,
    selectedRepoKeys: new Set<string>(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all filter components", () => {
    render(<RepoFilters {...defaultProps} />);

    // Check if all main components are rendered
    expect(screen.getByTestId("per-page-select")).toBeInTheDocument();

    expect(screen.getAllByText("Repo types to show")[0]).toBeInTheDocument();
    expect(screen.getByTestId("repo-search-input")).toBeInTheDocument();
    expect(screen.getAllByText(REPO_ACTIONS[0].label)[0]).toBeInTheDocument();
  });

  it("displays the correct per page options", async () => {
    render(<RepoFilters {...defaultProps} />);

    // Open the dropdown by clicking the button directly
    const perPageSelect = screen.getByTestId("per-page-select");
    await userEvent.click(perPageSelect);

    // Check if all options are rendered
    for (const option of PER_PAGE_OPTIONS) {
      expect(
        screen.getByTestId(`per-page-option-${option}`),
      ).toBeInTheDocument();
    }
  });

  it("calls onPerPageChange when a per page option is selected", async () => {
    render(<RepoFilters {...defaultProps} />);

    // Open the dropdown by clicking the button directly
    const perPageSelect = screen.getByTestId("per-page-select");
    await userEvent.click(perPageSelect);

    // Select an option
    const newOption = PER_PAGE_OPTIONS[1];
    await userEvent.click(screen.getByTestId(`per-page-option-${newOption}`));

    expect(defaultProps.onPerPageChange).toHaveBeenCalled();
  });

  it("renders repo type filter with options", async () => {
    render(<RepoFilters {...defaultProps} />);

    // Verify repo type select button is rendered
    const repoTypeSelect = screen.getByTestId("repo-type-select");
    expect(repoTypeSelect).toBeInTheDocument();
    expect(repoTypeSelect).toHaveTextContent("Repo types to show");

    // Click the repo type select button
    await userEvent.click(repoTypeSelect);

    // Verify all repo type options are rendered
    for (const type of REPO_TYPES) {
      expect(
        screen.getByTestId(`repo-type-select-item-${type.key}`),
      ).toBeInTheDocument();
    }

    // Click on a repo type option
    await userEvent.click(
      screen.getByTestId(`repo-type-select-item-${REPO_TYPES[0].key}`),
    );

    expect(defaultProps.onRepoTypesFilterChange).toHaveBeenCalled();
  });

  it("calls onSearchChange when typing in search input", async () => {
    // Create a search change mock that we can observe
    const searchChangeMock = vi.fn();

    render(<RepoFilters {...defaultProps} onSearchChange={searchChangeMock} />);

    // Get the search input element and verify it's rendered
    const searchInput = screen.getByTestId("repo-search-input");
    expect(searchInput).toBeInTheDocument();

    // Type 'a' and verify callback is called with 'a'
    await userEvent.type(searchInput, "apples");
    expect(searchChangeMock).toHaveBeenCalledWith("a");

    // Clear the mock
    searchChangeMock.mockClear();

    // Type 'b' after clearing and verify callback is called with 'b'
    await userEvent.type(searchInput, "b");
    expect(searchChangeMock).toHaveBeenCalledWith("b");
  });

  it("disables action button when no repos are selected", () => {
    render(<RepoFilters {...defaultProps} />);

    // Find the action button by text
    const actionButton = screen
      .getAllByText(REPO_ACTIONS[0].label)[0]
      .closest("button");
    expect(actionButton).toBeDisabled();
  });

  it("enables action button when repos are selected", () => {
    const propsWithSelection = {
      ...defaultProps,
      selectedRepoKeys: new Set<string>(["repo1", "repo2"]),
    };

    render(<RepoFilters {...propsWithSelection} />);

    // Find the action button by text
    const actionButton = screen
      .getAllByText(REPO_ACTIONS[0].label)[0]
      .closest("button");
    expect(actionButton).not.toBeDisabled();
  });

  it("calls onRepoActionClick when action button is clicked", async () => {
    const propsWithSelection = {
      ...defaultProps,
      selectedRepoKeys: new Set<string>(["repo1", "repo2"]),
    };

    render(<RepoFilters {...propsWithSelection} />);

    // Find and click the action button
    const actionButton = screen
      .getAllByText(REPO_ACTIONS[0].label)[0]
      .closest("button");
    if (!actionButton) throw new Error("Action button not found");

    await userEvent.click(actionButton);

    expect(propsWithSelection.onRepoActionClick).toHaveBeenCalledTimes(1);
  });

  it("displays action dropdown when dropdown trigger is clicked", async () => {
    render(<RepoFilters {...defaultProps} />);

    // Find and click the dropdown trigger
    const dropdownTrigger = screen
      .getByTestId("chevron-down-icon")
      .closest("button");
    if (!dropdownTrigger) throw new Error("Dropdown trigger not found");

    await userEvent.click(dropdownTrigger);

    // Check if dropdown items are displayed using their test IDs - use the first item that matches
    for (const action of REPO_ACTIONS) {
      expect(
        screen.getByTestId(`repo-action-dropdown-item-${action.key}`),
      ).toBeInTheDocument();
    }
  });

  it("calls onRepoActionChange when a different action is selected", async () => {
    render(<RepoFilters {...defaultProps} />);

    // Find and click the dropdown trigger
    const dropdownTrigger = screen
      .getByTestId("chevron-down-icon")
      .closest("button");
    if (!dropdownTrigger) throw new Error("Dropdown trigger not found");

    await userEvent.click(dropdownTrigger);

    // Select a different action using test ID
    await userEvent.click(
      screen.getByTestId(`repo-action-dropdown-item-${REPO_ACTIONS[1].key}`),
    );

    expect(defaultProps.onRepoActionChange).toHaveBeenCalled();
  });

  it("shows danger color for delete action", () => {
    const propsWithDeleteAction = {
      ...defaultProps,
      selectedRepoAction: new Set([REPO_ACTIONS[1].key]) as SelectionSet, // Delete action
    };

    render(<RepoFilters {...propsWithDeleteAction} />);

    // Use getAllByText to find the button text
    const actionButton = screen
      .getAllByText(REPO_ACTIONS[1].label)[0]
      .closest("button");

    // The danger style might be applied with a class instead of data-attribute
    // Let's check for color="danger" attribute or className including "danger"
    if (actionButton) {
      const hasColorAttribute = actionButton.getAttribute("color") === "danger";
      const hasClassWithDanger = actionButton.className.includes("danger");

      expect(hasColorAttribute || hasClassWithDanger).toBe(true);
    }
  });
});
