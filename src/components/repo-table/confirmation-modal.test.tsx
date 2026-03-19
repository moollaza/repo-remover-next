import { type Repository } from "@octokit/graphql-schema";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GitHubContext, GitHubContextType } from "@/contexts/github-context";
import { createMockRepo } from "@/mocks/static-fixtures";
import { fireEvent, render, screen } from "@/utils/test-utils";

import ConfirmationModal from "./confirmation-modal";

vi.mock("@/utils/github-utils", async () => {
  const actual = await vi.importActual("@/utils/github-utils");
  return {
    ...actual,
    createThrottledOctokit: vi.fn(() => ({ request: vi.fn() })),
    processRepo: vi.fn().mockResolvedValue(undefined),
  };
});

// Import after mock setup so we can reference the mocked functions
const { createThrottledOctokit, processRepo } = await import(
  "@/utils/github-utils"
);

const mockRepos: Repository[] = [
  createMockRepo({ id: "1", name: "repo1" }),
  createMockRepo({ id: "2", name: "repo2" }),
];

const mockProps = {
  action: "archive" as const,
  isOpen: true,
  login: "testuser",
  onClose: vi.fn(),
  repos: mockRepos,
};

const mockContextValue: GitHubContextType = {
  error: null,
  hasPartialData: false,
  isAuthenticated: true,
  isError: false,
  isInitialized: true,
  isLoading: false,
  login: "testuser",
  logout: vi.fn(),
  mutate: vi.fn(),
  pat: "fake-token",
  progress: null,
  refetchData: vi.fn(),
  repos: mockRepos,
  setLogin: vi.fn(),
  setPat: vi.fn(),
  user: null,
};

describe("ConfirmationModal", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders confirmation screen initially", () => {
    render(
      <GitHubContext.Provider value={mockContextValue}>
        <ConfirmationModal {...mockProps} />
      </GitHubContext.Provider>,
    );

    expect(screen.getByText(/Confirm Archival/)).toBeInTheDocument();
    expect(screen.getByText(/repo1/)).toBeInTheDocument();
    expect(screen.getByText(/repo2/)).toBeInTheDocument();
    expect(screen.getByTestId("confirmation-modal-input")).toBeInTheDocument();
  });

  it("enables confirm button when username matches login", () => {
    render(
      <GitHubContext.Provider value={mockContextValue}>
        <ConfirmationModal {...mockProps} />
      </GitHubContext.Provider>,
    );

    const usernameInput = screen.getByTestId("confirmation-modal-input");
    const confirmButton = screen.getByTestId("confirmation-modal-confirm");

    // Initially disabled
    expect(confirmButton).toBeDisabled();

    // Enter incorrect username
    fireEvent.change(usernameInput, { target: { value: "wronguser" } });
    expect(confirmButton).toBeDisabled();

    // Enter correct username
    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    expect(confirmButton).not.toBeDisabled();
  });

  it("transitions to progress mode on confirm and processes each repo exactly once", async () => {
    vi.mocked(processRepo).mockReset();
    vi.mocked(processRepo).mockResolvedValue(undefined);

    render(
      <GitHubContext.Provider value={mockContextValue}>
        <ConfirmationModal {...mockProps} />
      </GitHubContext.Provider>,
    );

    // Type correct username
    const input = screen.getByTestId("confirmation-modal-input");
    fireEvent.change(input, { target: { value: "testuser" } });

    // Click confirm — START_PROCESSING dispatch is synchronous before the first await
    const confirmButton = screen.getByTestId("confirmation-modal-confirm");
    fireEvent.click(confirmButton);

    // Advance timers to complete processing (1s per repo + 3s minimum)
    await vi.advanceTimersByTimeAsync(10000);

    // Each repo should be processed exactly once
    expect(processRepo).toHaveBeenCalledTimes(2);
  });

  it("prevents double-submit when confirm is clicked rapidly", async () => {
    vi.mocked(processRepo).mockReset();
    vi.mocked(processRepo).mockResolvedValue(undefined);

    render(
      <GitHubContext.Provider value={mockContextValue}>
        <ConfirmationModal {...mockProps} />
      </GitHubContext.Provider>,
    );

    // Type correct username
    const input = screen.getByTestId("confirmation-modal-input");
    fireEvent.change(input, { target: { value: "testuser" } });

    // Click confirm button twice rapidly
    const confirmButton = screen.getByTestId("confirmation-modal-confirm");
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);

    // Advance timers to complete all processing
    await vi.advanceTimersByTimeAsync(10000);

    // Should still only process each repo once (2 repos = 2 calls, not 4)
    expect(processRepo).toHaveBeenCalledTimes(2);
  });

  it("shows correct success count on result screen (BUG-030: processedCount, not total)", async () => {
    vi.mocked(processRepo).mockReset();
    // First repo succeeds, second repo fails
    vi.mocked(processRepo)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("403 Forbidden"));

    render(
      <GitHubContext.Provider value={mockContextValue}>
        <ConfirmationModal {...mockProps} />
      </GitHubContext.Provider>,
    );

    // Type correct username and confirm
    const input = screen.getByTestId("confirmation-modal-input");
    fireEvent.change(input, { target: { value: "testuser" } });
    const confirmButton = screen.getByTestId("confirmation-modal-confirm");
    fireEvent.click(confirmButton);

    // Advance timers to complete processing (1s per repo + 3s minimum)
    await vi.advanceTimersByTimeAsync(10000);

    // Result screen should show: 1 success out of 2 processed
    // BUG-030: previously showed "count - errorCount" using repos.length as count
    // which would be wrong if processing was stopped early (skipped repos counted as successes)
    expect(screen.getByTestId("result-modal-header")).toBeInTheDocument();
    expect(
      screen.getByText(/1 out of 2 repos archived successfully/),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 error/)).toBeInTheDocument();
  });

  it("memoizes octokit instance — does not recreate on re-render (BUG-011)", () => {
    vi.mocked(createThrottledOctokit).mockClear();

    const { rerender } = render(
      <GitHubContext.Provider value={mockContextValue}>
        <ConfirmationModal {...mockProps} />
      </GitHubContext.Provider>,
    );

    // Should create exactly one instance on initial render
    expect(createThrottledOctokit).toHaveBeenCalledTimes(1);

    // Re-render with same pat — should NOT create a new instance
    rerender(
      <GitHubContext.Provider value={mockContextValue}>
        <ConfirmationModal {...mockProps} />
      </GitHubContext.Provider>,
    );

    // Still only one call — memoized
    expect(createThrottledOctokit).toHaveBeenCalledTimes(1);
  });
});
