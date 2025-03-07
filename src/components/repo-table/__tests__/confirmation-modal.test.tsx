import { Repository } from "@octokit/graphql-schema";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSWRConfig } from "swr";
import { beforeEach, describe, expect, test, vi } from "vitest";

// Mock dependencies
import { useGitHubData } from "@/hooks/use-github-data";

import ConfirmationModal from "../confirmation-modal";

vi.mock("@/hooks/use-github-data", () => ({
  useGitHubData: vi.fn(),
}));

vi.mock("swr", () => ({
  useSWRConfig: vi.fn(),
}));

vi.mock("@/utils/github-utils", () => ({
  createThrottledOctokit: vi.fn(),
  processRepo: vi.fn().mockResolvedValue(undefined),
}));

describe("ConfirmationModal", () => {
  const mockRepos: Repository[] = [
    { id: "1", name: "repo1", owner: { login: "testuser" } } as Repository,
    { id: "2", name: "repo2", owner: { login: "testuser" } } as Repository,
  ];

  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();
  const mockMutate = vi.fn();
  // We'll use this in future tests or remove if truly unused
  // Removed mockOctokit as it's flagged as unused

  beforeEach(() => {
    vi.clearAllMocks();

    (useGitHubData as jest.Mock).mockReturnValue({
      login: "testuser",
      pat: "test-pat",
    });

    (useSWRConfig as jest.Mock).mockReturnValue({
      mutate: mockMutate,
    });
  });

  test("renders modal with correct repository details", () => {
    render(
      <ConfirmationModal
        action="delete"
        isOpen={true}
        login="testuser"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        repos={mockRepos}
      />,
    );

    expect(screen.getByText(/Confirm Deletion/i)).toBeInTheDocument();
    expect(screen.getByText(/repo1/)).toBeInTheDocument();
    expect(screen.getByText(/repo2/)).toBeInTheDocument();
  });

  test("requires correct username to enable confirmation", async () => {
    render(
      <ConfirmationModal
        action="archive"
        isOpen={true}
        login="testuser"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        repos={mockRepos}
      />,
    );

    const usernameInput = screen.getByPlaceholderText("GitHub Username");
    const confirmButton = screen.getByRole("button", {
      name: /understand the consequences/i,
    });

    expect(confirmButton).toBeDisabled();

    await userEvent.type(usernameInput, "wronguser");
    expect(confirmButton).toBeDisabled();

    await userEvent.clear(usernameInput);
    await userEvent.type(usernameInput, "testuser");
    expect(confirmButton).toBeEnabled();
  });

  test.skip("calls onConfirm and handles repository processing", async () => {
    render(
      <ConfirmationModal
        action="delete"
        isOpen={true}
        login="testuser"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        repos={mockRepos}
      />,
    );

    const usernameInput = screen.getByPlaceholderText("GitHub Username");
    const confirmButton = screen.getByRole("button", {
      name: /understand the consequences/i,
    });

    await userEvent.type(usernameInput, "testuser");
    await userEvent.click(confirmButton);

    // Ensure onConfirm was called
    expect(mockOnConfirm).toHaveBeenCalled();
  });

  test("handles modal close and state reset", async () => {
    render(
      <ConfirmationModal
        action="archive"
        isOpen={true}
        login="testuser"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        repos={mockRepos}
      />,
    );

    const closeButton = screen.getByRole("button", { name: /cancel/i });
    await userEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
