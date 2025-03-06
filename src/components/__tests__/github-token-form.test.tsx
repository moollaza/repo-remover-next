import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { beforeEach, describe, expect, test } from "vitest";
import { type Mock, vi } from "vitest";

import { useGitHubData } from "@/providers/github-data-provider";

import GitHubTokenForm from "../github-token-form";

// Mock dependencies
vi.mock("@/providers/github-data-provider", () => ({
  useGitHubData: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("GitHubTokenForm", () => {
  const mockValidateToken = vi.fn();
  const mockSetPat = vi.fn();
  const mockRouterPush = vi.fn();

  // Helper function to render the form and get input and submit button
  const setupForm = () => {
    render(<GitHubTokenForm />);
    const input = screen.getByLabelText(/Personal Access Token/i);
    const submitButton = screen.getByRole("button", { name: /submit/i });
    return { input, submitButton };
  };

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    (useGitHubData as Mock).mockReturnValue({
      isError: false,
      isLoading: false,
      login: null,
      pat: null,
      setLogin: vi.fn(),
      setPat: mockSetPat,
    });

    (useRouter as Mock).mockReturnValue({
      push: mockRouterPush,
    });
  });

  test("renders input field and submit button", () => {
    const { input, submitButton } = setupForm();

    expect(input).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();
  });

  test("input changes update value", async () => {
    const { input } = setupForm();

    await userEvent.type(input, "test-token");
    expect(input).toHaveValue("test-token");
  });

  test("submit button is disabled when input is empty", () => {
    const { submitButton } = setupForm();

    expect(submitButton).toBeDisabled();
  });

  test("validates token on first submission", async () => {
    mockValidateToken.mockResolvedValue(true);

    const { input, submitButton } = setupForm();

    await userEvent.type(input, "valid-token");
    await userEvent.click(submitButton);

    expect(mockValidateToken).toHaveBeenCalledWith("valid-token");
  });

  test("navigates to dashboard after successful token validation", async () => {
    mockValidateToken.mockResolvedValue(true);

    const { input, submitButton } = setupForm();

    await userEvent.type(input, "valid-token");
    await userEvent.click(submitButton);
    await userEvent.click(submitButton);

    expect(mockSetPat).toHaveBeenCalledWith("valid-token");
    expect(mockRouterPush).toHaveBeenCalledWith("/dashboard");
  });

  test("shows error for invalid token", async () => {
    mockValidateToken.mockResolvedValue(false);

    const { input, submitButton } = setupForm();

    await userEvent.type(input, "invalid-token");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to validate token/i)).toBeInTheDocument();
    });
  });
});
