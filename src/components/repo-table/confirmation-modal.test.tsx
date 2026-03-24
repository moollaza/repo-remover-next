import { type Repository } from "@octokit/graphql-schema";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GitHubContext, GitHubContextType } from "@/contexts/github-context";
import { createMockRepo } from "@/mocks/static-fixtures";
import { fireEvent, render, screen } from "@/utils/test-utils";

import ConfirmationModal from "./confirmation-modal";

vi.mock("@/utils/analytics", async () => {
  const actual = await vi.importActual("@/utils/analytics");
  return {
    ...actual,
    analytics: {
      trackArchiveActionSubmitted: vi.fn(),
      trackDeleteActionSubmitted: vi.fn(),
      trackGetStartedClick: vi.fn(),
      trackRepoArchived: vi.fn(),
      trackRepoDeleted: vi.fn(),
      trackTokenValidated: vi.fn(),
    },
  };
});

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
const { analytics } = await import("@/utils/analytics");

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

  it("shows correct success count on result screen (processedCount, not total)", async () => {
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
    // Previously showed "count - errorCount" using repos.length as count
    // which would be wrong if processing was stopped early (skipped repos counted as successes)
    expect(screen.getByTestId("result-modal-header")).toBeInTheDocument();
    expect(
      screen.getByText(/1 out of 2 repos archived successfully/),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 error/)).toBeInTheDocument();
  });

  it("renders repo list as <ul> not <ol> for bullet-styled lists", () => {
    render(
      <GitHubContext.Provider value={mockContextValue}>
        <ConfirmationModal {...mockProps} />
      </GitHubContext.Provider>,
    );

    // The repo list should be an unordered list since it uses list-disc (bullets)
    const lists = screen
      .getByTestId("confirmation-modal-body")
      .querySelectorAll("ul");
    expect(lists.length).toBeGreaterThanOrEqual(1);

    // No <ol> elements should exist — bullets belong on <ul>, not <ol>
    const orderedLists = screen
      .getByTestId("confirmation-modal-body")
      .querySelectorAll("ol");
    expect(orderedLists.length).toBe(0);
  });

  it("does not call mutate when cancelling without processing", () => {
    render(
      <GitHubContext.Provider value={mockContextValue}>
        <ConfirmationModal {...mockProps} />
      </GitHubContext.Provider>,
    );

    // Click cancel without confirming any repos
    const cancelButton = screen.getByTestId("confirmation-modal-cancel");
    fireEvent.click(cancelButton);

    // mutate() should NOT be called — no repos were processed
    expect(mockContextValue.mutate).not.toHaveBeenCalled();

    // onClose should still be called
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it("memoizes octokit instance — does not recreate on re-render", () => {
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

  it("fires trackArchiveActionSubmitted on archive confirm", async () => {
    vi.mocked(processRepo).mockReset();
    vi.mocked(processRepo).mockResolvedValue(undefined);

    render(
      <GitHubContext.Provider value={mockContextValue}>
        <ConfirmationModal {...mockProps} action="archive" />
      </GitHubContext.Provider>,
    );

    const input = screen.getByTestId("confirmation-modal-input");
    fireEvent.change(input, { target: { value: "testuser" } });
    fireEvent.click(screen.getByTestId("confirmation-modal-confirm"));

    await vi.advanceTimersByTimeAsync(10000);

    expect(analytics.trackArchiveActionSubmitted).toHaveBeenCalledTimes(1);
    expect(analytics.trackArchiveActionSubmitted).toHaveBeenCalledWith(2);
    expect(analytics.trackDeleteActionSubmitted).not.toHaveBeenCalled();
  });

  it("fires trackDeleteActionSubmitted on delete confirm", async () => {
    vi.mocked(processRepo).mockReset();
    vi.mocked(processRepo).mockResolvedValue(undefined);

    render(
      <GitHubContext.Provider value={mockContextValue}>
        <ConfirmationModal {...mockProps} action="delete" />
      </GitHubContext.Provider>,
    );

    const input = screen.getByTestId("confirmation-modal-input");
    fireEvent.change(input, { target: { value: "testuser" } });
    fireEvent.click(screen.getByTestId("confirmation-modal-confirm"));

    await vi.advanceTimersByTimeAsync(10000);

    expect(analytics.trackDeleteActionSubmitted).toHaveBeenCalledTimes(1);
    expect(analytics.trackDeleteActionSubmitted).toHaveBeenCalledWith(2);
    expect(analytics.trackArchiveActionSubmitted).not.toHaveBeenCalled();
  });

  it("calls mutate and onClose when closing from result screen", async () => {
    vi.mocked(processRepo).mockReset();
    vi.mocked(processRepo).mockResolvedValue(undefined);

    render(
      <GitHubContext.Provider value={mockContextValue}>
        <ConfirmationModal {...mockProps} />
      </GitHubContext.Provider>,
    );

    // Type correct username and confirm to trigger processing
    const input = screen.getByTestId("confirmation-modal-input");
    fireEvent.change(input, { target: { value: "testuser" } });
    fireEvent.click(screen.getByTestId("confirmation-modal-confirm"));

    // Advance timers to reach the result screen
    await vi.advanceTimersByTimeAsync(10000);

    // Verify we're on the result screen
    expect(screen.getByTestId("result-modal-header")).toBeInTheDocument();

    // Click the close button on the result screen
    fireEvent.click(screen.getByTestId("repo-action-result-close"));

    // mutate() SHOULD be called — operations ran
    expect(mockContextValue.mutate).toHaveBeenCalledTimes(1);

    // onClose should be called
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("resets state to initial after closing from result screen", async () => {
    vi.mocked(processRepo).mockReset();
    vi.mocked(processRepo).mockResolvedValue(undefined);

    const { rerender } = render(
      <GitHubContext.Provider value={mockContextValue}>
        <ConfirmationModal {...mockProps} />
      </GitHubContext.Provider>,
    );

    // Type correct username and confirm
    const input = screen.getByTestId("confirmation-modal-input");
    fireEvent.change(input, { target: { value: "testuser" } });
    fireEvent.click(screen.getByTestId("confirmation-modal-confirm"));

    // Advance timers to reach the result screen
    await vi.advanceTimersByTimeAsync(10000);
    expect(screen.getByTestId("result-modal-header")).toBeInTheDocument();

    // Close the modal from result screen
    fireEvent.click(screen.getByTestId("repo-action-result-close"));

    // Re-render with isOpen=true to simulate re-opening the modal
    rerender(
      <GitHubContext.Provider value={mockContextValue}>
        <ConfirmationModal {...mockProps} />
      </GitHubContext.Provider>,
    );

    // State should be reset — confirmation screen should appear again
    expect(screen.getByTestId("confirmation-modal-header")).toBeInTheDocument();
    expect(screen.getByTestId("confirmation-modal-input")).toBeInTheDocument();

    // Username should be cleared (reset to initial state)
    expect(screen.getByTestId("confirmation-modal-input")).toHaveValue("");

    // Confirm button should be disabled again (username not entered)
    expect(screen.getByTestId("confirmation-modal-confirm")).toBeDisabled();
  });

  it("resets state and calls onClose when cancelling from confirmation screen", () => {
    render(
      <GitHubContext.Provider value={mockContextValue}>
        <ConfirmationModal {...mockProps} />
      </GitHubContext.Provider>,
    );

    // Type a username (to prove it gets reset)
    const input = screen.getByTestId("confirmation-modal-input");
    fireEvent.change(input, { target: { value: "partial" } });
    expect(input).toHaveValue("partial");

    // Cancel
    fireEvent.click(screen.getByTestId("confirmation-modal-cancel"));

    // mutate should NOT be called
    expect(mockContextValue.mutate).not.toHaveBeenCalled();

    // onClose should be called
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("closes modal when Escape is pressed in confirmation mode", () => {
    render(
      <GitHubContext.Provider value={mockContextValue}>
        <ConfirmationModal {...mockProps} />
      </GitHubContext.Provider>,
    );

    // Verify we're in confirmation mode
    expect(screen.getByTestId("confirmation-modal-header")).toBeInTheDocument();

    // Press Escape on the dialog — HeroUI handles Escape on the overlay element
    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape" });

    // onClose should be called
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("does NOT close modal when Escape is pressed in progress mode", async () => {
    vi.mocked(processRepo).mockReset();
    // Use a long-running mock so we stay in progress mode
    vi.mocked(processRepo).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 5000)),
    );

    render(
      <GitHubContext.Provider value={mockContextValue}>
        <ConfirmationModal {...mockProps} />
      </GitHubContext.Provider>,
    );

    // Type correct username and confirm to enter progress mode
    const input = screen.getByTestId("confirmation-modal-input");
    fireEvent.change(input, { target: { value: "testuser" } });
    fireEvent.click(screen.getByTestId("confirmation-modal-confirm"));

    // Advance just enough to enter progress mode (first repo starts processing)
    await vi.advanceTimersByTimeAsync(100);

    // Verify we're in progress mode
    expect(screen.getByTestId("progress-modal-header")).toBeInTheDocument();

    // Press Escape — isDismissable is false in progress mode
    fireEvent.keyDown(document, { key: "Escape" });

    // onClose should NOT be called
    expect(mockProps.onClose).not.toHaveBeenCalled();

    // Clean up: advance timers to let processing complete
    await vi.advanceTimersByTimeAsync(30000);
  });

  it("does NOT close modal when Escape is pressed in result mode", async () => {
    vi.mocked(processRepo).mockReset();
    vi.mocked(processRepo).mockResolvedValue(undefined);

    render(
      <GitHubContext.Provider value={mockContextValue}>
        <ConfirmationModal {...mockProps} />
      </GitHubContext.Provider>,
    );

    // Type correct username and confirm
    const input = screen.getByTestId("confirmation-modal-input");
    fireEvent.change(input, { target: { value: "testuser" } });
    fireEvent.click(screen.getByTestId("confirmation-modal-confirm"));

    // Advance timers to reach result screen
    await vi.advanceTimersByTimeAsync(10000);

    // Verify we're in result mode
    expect(screen.getByTestId("result-modal-header")).toBeInTheDocument();

    // Press Escape — isDismissable is false in result mode
    fireEvent.keyDown(document, { key: "Escape" });

    // onClose should NOT be called (user must click Close button)
    expect(mockProps.onClose).not.toHaveBeenCalled();
  });

  it("closes modal when backdrop is clicked in confirmation mode", () => {
    render(
      <GitHubContext.Provider value={mockContextValue}>
        <ConfirmationModal {...mockProps} />
      </GitHubContext.Provider>,
    );

    // Verify we're in confirmation mode (isDismissable = true)
    expect(screen.getByTestId("confirmation-modal-header")).toBeInTheDocument();

    // Simulate clicking outside the modal dialog (backdrop click)
    // React Aria v3 useInteractOutside uses pointerdown + click (capture) on document
    fireEvent.pointerDown(document.body, { button: 0 });
    fireEvent.click(document.body, { button: 0 });

    // onClose should be called — backdrop click dismisses in confirmation mode
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("does NOT close modal when backdrop is clicked in progress mode", async () => {
    vi.mocked(processRepo).mockReset();
    vi.mocked(processRepo).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 5000)),
    );

    render(
      <GitHubContext.Provider value={mockContextValue}>
        <ConfirmationModal {...mockProps} />
      </GitHubContext.Provider>,
    );

    // Type correct username and confirm to enter progress mode
    const input = screen.getByTestId("confirmation-modal-input");
    fireEvent.change(input, { target: { value: "testuser" } });
    fireEvent.click(screen.getByTestId("confirmation-modal-confirm"));

    // Advance just enough to enter progress mode
    await vi.advanceTimersByTimeAsync(100);

    // Verify we're in progress mode
    expect(screen.getByTestId("progress-modal-header")).toBeInTheDocument();

    // Simulate backdrop click
    fireEvent.pointerDown(document.body, { button: 0 });
    fireEvent.click(document.body, { button: 0 });

    // onClose should NOT be called — modal is not dismissable during progress
    expect(mockProps.onClose).not.toHaveBeenCalled();

    // Clean up: advance timers to let processing complete
    await vi.advanceTimersByTimeAsync(30000);
  });

  it("does NOT close modal when clicking inside modal content", () => {
    render(
      <GitHubContext.Provider value={mockContextValue}>
        <ConfirmationModal {...mockProps} />
      </GitHubContext.Provider>,
    );

    // Verify we're in confirmation mode (dismissable)
    const header = screen.getByTestId("confirmation-modal-header");
    expect(header).toBeInTheDocument();

    // Click inside the modal content (on the header text)
    // React Aria checks composedPath — clicks inside the dialog ref are not "outside"
    fireEvent.pointerDown(header, { button: 0 });
    fireEvent.click(header, { button: 0 });

    // onClose should NOT be called — click was inside the modal content
    expect(mockProps.onClose).not.toHaveBeenCalled();
  });

  it("does not fire analytics when octokit is null", async () => {
    const noPatContext: GitHubContextType = {
      ...mockContextValue,
      pat: null,
    };

    // createThrottledOctokit won't be called when pat is null, so octokit is null
    render(
      <GitHubContext.Provider value={noPatContext}>
        <ConfirmationModal {...mockProps} />
      </GitHubContext.Provider>,
    );

    const input = screen.getByTestId("confirmation-modal-input");
    fireEvent.change(input, { target: { value: "testuser" } });
    fireEvent.click(screen.getByTestId("confirmation-modal-confirm"));

    await vi.advanceTimersByTimeAsync(10000);

    expect(analytics.trackArchiveActionSubmitted).not.toHaveBeenCalled();
    expect(analytics.trackDeleteActionSubmitted).not.toHaveBeenCalled();
  });
});
