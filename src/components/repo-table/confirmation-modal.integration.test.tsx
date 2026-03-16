import { type Repository } from "@octokit/graphql-schema";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { BrowserRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  GitHubContext,
  type GitHubContextType,
} from "@/contexts/github-context";
import { server } from "@/mocks/server";
import { createMockRepo } from "@/mocks/static-fixtures";

import ConfirmationModal from "./confirmation-modal";

// Track which repos were archived/deleted via MSW runtime overrides
let archivedRepos: string[] = [];
let deletedRepos: string[] = [];

const testRepos: Repository[] = [
  createMockRepo({ id: "r1", name: "repo-one" }),
  createMockRepo({ id: "r2", name: "repo-two" }),
];

const mockContext: GitHubContextType = {
  error: null,
  hasPartialData: false,
  isAuthenticated: true,
  isError: false,
  isInitialized: true,
  isLoading: false,
  login: "testuser",
  logout: vi.fn(),
  mutate: vi.fn(),
  pat: "ghp_abcdefghijklmnopqrstuvwxyz1234567890",
  progress: null,
  refetchData: vi.fn(),
  repos: testRepos,
  setLogin: vi.fn(),
  setPat: vi.fn(),
  user: null,
};

const baseProps = {
  isOpen: true,
  login: "testuser",
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  repos: testRepos,
};

function renderModal(action: "archive" | "delete") {
  return render(
    <BrowserRouter>
      <GitHubContext.Provider value={mockContext}>
        <ConfirmationModal {...baseProps} action={action} />
      </GitHubContext.Provider>
    </BrowserRouter>,
  );
}

describe("ConfirmationModal Integration — Full Execution Flow", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
    archivedRepos = [];
    deletedRepos = [];

    // Override global handlers with tracking versions
    server.use(
      http.patch("https://api.github.com/repos/:owner/:repo", ({ params }) => {
        archivedRepos.push(params.repo as string);
        return HttpResponse.json({ archived: true });
      }),
      http.delete("https://api.github.com/repos/:owner/:repo", ({ params }) => {
        deletedRepos.push(params.repo as string);
        return new HttpResponse(null, { status: 204 });
      }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("archive flow: confirmation → progress → result, calls API via MSW", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderModal("archive");

    // Confirmation mode
    expect(screen.getByText(/Confirm Archival/i)).toBeInTheDocument();
    expect(screen.getByText("repo-one")).toBeInTheDocument();
    expect(screen.getByText("repo-two")).toBeInTheDocument();

    // Type username and confirm
    const input = screen.getByTestId("confirmation-modal-input");
    await user.type(input, "testuser");
    expect(screen.getByTestId("confirmation-modal-confirm")).toBeEnabled();
    await user.click(screen.getByTestId("confirmation-modal-confirm"));

    // Should transition to progress mode
    await waitFor(() => {
      expect(
        screen.getByTestId("confirmation-modal-progress"),
      ).toBeInTheDocument();
    });

    // Advance timers past all delays (1s per repo * 2 repos + 3s minimum = ~5s, use 10s to be safe)
    await vi.advanceTimersByTimeAsync(10_000);

    // Should transition to result mode
    await waitFor(() => {
      expect(
        screen.getByTestId("confirmation-modal-result"),
      ).toBeInTheDocument();
    });

    // Verify MSW intercepted the actual REST calls
    expect(archivedRepos).toContain("repo-one");
    expect(archivedRepos).toContain("repo-two");
    expect(deletedRepos).toHaveLength(0);

    // Result should show success
    expect(
      screen.getByText(/2 out of 2 repos archived successfully/i),
    ).toBeInTheDocument();
  });

  it("delete flow: confirmation → progress → result", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderModal("delete");

    expect(screen.getByText(/Confirm Deletion/i)).toBeInTheDocument();

    const input = screen.getByTestId("confirmation-modal-input");
    await user.type(input, "testuser");
    await user.click(screen.getByTestId("confirmation-modal-confirm"));

    await vi.advanceTimersByTimeAsync(10_000);

    await waitFor(() => {
      expect(
        screen.getByTestId("confirmation-modal-result"),
      ).toBeInTheDocument();
    });

    expect(deletedRepos).toContain("repo-one");
    expect(deletedRepos).toContain("repo-two");
    expect(archivedRepos).toHaveLength(0);
  });

  it("handles partial failures — shows errors for failed repos", async () => {
    // Override: repo-one fails with 403, repo-two uses the default success handler
    server.use(
      http.patch("https://api.github.com/repos/:owner/repo-one", () => {
        return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
      }),
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderModal("archive");

    const input = screen.getByTestId("confirmation-modal-input");
    await user.type(input, "testuser");
    await user.click(screen.getByTestId("confirmation-modal-confirm"));

    await vi.advanceTimersByTimeAsync(10_000);

    await waitFor(() => {
      expect(
        screen.getByTestId("confirmation-modal-result"),
      ).toBeInTheDocument();
    });

    // 1 success, 1 failure
    expect(
      screen.getByText(/1 out of 2 repos archived successfully/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 error occurred/i)).toBeInTheDocument();
  });
});
