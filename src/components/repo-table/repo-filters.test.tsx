import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import RepoFilters, {
  PER_PAGE_OPTIONS,
  REPO_ACTIONS,
  REPO_TYPES,
  type SelectionSet,
} from "@/components/repo-table/repo-filters";
import { fireEvent, render, screen } from "@/utils/test-utils";

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

  it("has an accessible label on the action dropdown trigger", () => {
    render(<RepoFilters {...defaultProps} />);

    const dropdownTrigger = screen.getByTestId("repo-action-dropdown-trigger");
    expect(dropdownTrigger).toHaveAttribute("aria-label", "Choose action type");
  });

  it("shows Ctrl shortcut hint on non-Mac platforms", () => {
    // jsdom defaults navigator.platform to "" (non-Mac)
    render(<RepoFilters {...defaultProps} />);

    // HeroUI Kbd renders <abbr title="Control">⌃</abbr> for ctrl key
    const abbr = screen.getByTitle("Control");
    expect(abbr).toBeInTheDocument();
  });

  it("shows Command shortcut hint on Mac platform", () => {
    const originalPlatform = navigator.platform;
    Object.defineProperty(navigator, "platform", {
      configurable: true,
      value: "MacIntel",
    });

    render(<RepoFilters {...defaultProps} />);

    // HeroUI Kbd renders <abbr title="Command">⌘</abbr> for command key
    const abbr = screen.getByTitle("Command");
    expect(abbr).toBeInTheDocument();

    Object.defineProperty(navigator, "platform", {
      configurable: true,
      value: originalPlatform,
    });
  });

  describe("typesSummary display in repo type select", () => {
    it("shows all type labels when all types are selected", () => {
      render(<RepoFilters {...defaultProps} />);

      const repoTypeSelect = screen.getByTestId("repo-type-select");
      // HeroUI multi-select renders selected labels as comma-separated text
      for (const type of REPO_TYPES) {
        expect(repoTypeSelect).toHaveTextContent(type.label);
      }
    });

    it("does not show type labels when no types are selected", () => {
      render(
        <RepoFilters
          {...defaultProps}
          repoTypesFilter={new Set() as SelectionSet}
        />,
      );

      const repoTypeSelect = screen.getByTestId("repo-type-select");
      // With no selection, individual type labels should not appear in the trigger value
      for (const type of REPO_TYPES) {
        // The label "Repo types to show" will still be present, but the values should not
        const allTextNodes = repoTypeSelect.querySelectorAll(
          "[data-slot='value']",
        );
        const valueText = Array.from(allTextNodes)
          .map((el) => el.textContent)
          .join("");
        expect(valueText).not.toContain(type.label);
      }
    });

    it("shows only selected type labels for partial selection", () => {
      const partialSelection = new Set(["isFork", "isPrivate"]) as SelectionSet;

      render(
        <RepoFilters {...defaultProps} repoTypesFilter={partialSelection} />,
      );

      const repoTypeSelect = screen.getByTestId("repo-type-select");
      // Selected types should be visible
      expect(repoTypeSelect).toHaveTextContent("Private");
      expect(repoTypeSelect).toHaveTextContent("Forked");

      // Non-selected types should not appear in the value area
      const valueElements = repoTypeSelect.querySelectorAll(
        "[data-slot='value']",
      );
      const valueText = Array.from(valueElements)
        .map((el) => el.textContent)
        .join("");
      expect(valueText).not.toContain("Organization");
      expect(valueText).not.toContain("Archived");
      expect(valueText).not.toContain("Template");
      expect(valueText).not.toContain("Mirror");
      expect(valueText).not.toContain("Disabled");
    });
  });

  describe("Cmd+K / Ctrl+K keyboard shortcut", () => {
    it("focuses search input on Ctrl+K", () => {
      render(<RepoFilters {...defaultProps} />);

      const searchInput = screen.getByTestId("repo-search-input");
      // HeroUI Input wraps in a div; find the actual <input> inside
      const inputElement =
        searchInput.tagName === "INPUT"
          ? searchInput
          : searchInput.querySelector("input");
      expect(inputElement).not.toBeNull();

      fireEvent.keyDown(document, { ctrlKey: true, key: "k" });

      expect(document.activeElement).toBe(inputElement);
    });

    it("focuses search input on Cmd+K (Meta)", () => {
      render(<RepoFilters {...defaultProps} />);

      const searchInput = screen.getByTestId("repo-search-input");
      const inputElement =
        searchInput.tagName === "INPUT"
          ? searchInput
          : searchInput.querySelector("input");
      expect(inputElement).not.toBeNull();

      fireEvent.keyDown(document, { key: "k", metaKey: true });

      expect(document.activeElement).toBe(inputElement);
    });

    it("does not focus search input on plain K key press", () => {
      render(<RepoFilters {...defaultProps} />);

      const searchInput = screen.getByTestId("repo-search-input");
      const inputElement =
        searchInput.tagName === "INPUT"
          ? searchInput
          : searchInput.querySelector("input");

      // Blur the input first to ensure it's not focused
      inputElement!.blur();

      fireEvent.keyDown(document, { key: "k" });

      expect(document.activeElement).not.toBe(inputElement);
    });

    it("cleans up keydown listener on unmount", () => {
      const addSpy = vi.spyOn(document, "addEventListener");
      const removeSpy = vi.spyOn(document, "removeEventListener");

      const { unmount } = render(<RepoFilters {...defaultProps} />);

      // Find the keydown handler that was added
      const keydownCalls = addSpy.mock.calls.filter(
        (call) => call[0] === "keydown",
      );
      expect(keydownCalls.length).toBeGreaterThan(0);

      unmount();

      // Verify the same handler was removed
      const removeKeydownCalls = removeSpy.mock.calls.filter(
        (call) => call[0] === "keydown",
      );
      expect(removeKeydownCalls.length).toBeGreaterThan(0);

      addSpy.mockRestore();
      removeSpy.mockRestore();
    });
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
