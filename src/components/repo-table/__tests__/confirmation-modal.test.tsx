import { Repository } from "@octokit/graphql-schema";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSWRConfig } from "swr";
import { beforeEach, describe, expect, test, vi } from "vitest";

// Mock dependencies
import { useGitHub } from "@/providers/github-provider";

import ConfirmationModal from "../confirmation-modal";

vi.mock("@/providers/github-provider", () => ({
  useGitHub: vi.fn(),
}));

vi.mock("swr", () => ({
  useSWRConfig: vi.fn(),
}));

describe("ConfirmationModal", () => {
  const mockRepos: Repository[] = [
    { id: "1", name: "repo1" } as Repository,
    { id: "2", name: "repo2" } as Repository,
  ];

  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();
  const mockMutate = vi.fn();
  const mockOctokit = {
    // Add mock methods as needed
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (useGitHub as jest.Mock).mockReturnValue({
      octokit: mockOctokit,
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

  test("calls onConfirm and handles repository processing", async () => {
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
