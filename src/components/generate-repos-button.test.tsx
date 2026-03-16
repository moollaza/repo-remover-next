import { fireEvent } from "@testing-library/react";
import { vi } from "vitest";

import { render, screen, waitFor } from "@/utils/test-utils";

import { GenerateReposButton } from "./generate-repos-button";

// Mock the useGitHubData hook
const mockMutate = vi.fn().mockResolvedValue(undefined);
vi.mock("@/hooks/use-github-data", () => ({
  useGitHubData: vi.fn(() => ({
    mutate: mockMutate,
    pat: null,
  })),
}));

// Mock the github-utils module
const mockGenerateRepos = vi.fn().mockResolvedValue(undefined);
vi.mock("@/utils/github-utils", () => ({
  createThrottledOctokit: vi.fn(() => ({})),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  generateRepos: (...args: unknown[]) => mockGenerateRepos(...args),
}));

// Helper to set up the mock with a PAT
async function setupWithPat() {
  const { useGitHubData } = await import("@/hooks/use-github-data");
  vi.mocked(useGitHubData).mockReturnValue({
    error: null,
    hasPartialData: false,
    isAuthenticated: true,
    isError: false,
    isInitialized: true,
    isLoading: false,
    login: "testuser",
    logout: vi.fn(),
    mutate: mockMutate,
    pat: "ghp_test_token",
    progress: null,
    refetchData: vi.fn(),
    repos: null,
    setLogin: vi.fn(),
    setPat: vi.fn(),
    user: null,
  });
}

describe("GenerateReposButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders null when no PAT is available", () => {
    const { container } = render(<GenerateReposButton />);

    expect(container.innerHTML).toBe("");
  });

  it("renders the button when PAT exists", async () => {
    await setupWithPat();

    render(<GenerateReposButton />);

    expect(
      screen.getByRole("button", { name: /generate random repos/i }),
    ).toBeInTheDocument();
  });

  it("calls generateRepos and mutate on click", async () => {
    await setupWithPat();

    render(<GenerateReposButton />);

    const button = screen.getByRole("button", {
      name: /generate random repos/i,
    });

    // Use fireEvent.click to avoid HeroUI Ripple animation triggering framer-motion
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockGenerateRepos).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  it("handles errors gracefully", async () => {
    await setupWithPat();
    mockGenerateRepos.mockRejectedValueOnce(new Error("API error"));

    render(<GenerateReposButton />);

    const button = screen.getByRole("button", {
      name: /generate random repos/i,
    });

    // Use fireEvent.click to avoid HeroUI Ripple animation triggering framer-motion
    fireEvent.click(button);

    // Should not throw — error is caught
    await waitFor(() => {
      expect(mockGenerateRepos).toHaveBeenCalledTimes(1);
    });

    // mutate should NOT be called when generation fails
    expect(mockMutate).not.toHaveBeenCalled();
  });
});
