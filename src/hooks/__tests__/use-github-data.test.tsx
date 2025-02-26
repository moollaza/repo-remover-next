import { Repository, User } from "@octokit/graphql-schema";
import { renderHook } from "@testing-library/react";
import { SWRResponse } from "swr";
import { beforeEach, describe, expect, it, vi } from "vitest";

import useGitHubData from "@/hooks/use-github-data";
import GitHubProvider from "@/providers/github-provider";

// Mock SWR responses
const mockSWRInitial: SWRResponse = {
  data: undefined,
  error: undefined,
  isLoading: false,
  isValidating: false,
  mutate: vi.fn(),
};

const mockSWRLoading: SWRResponse = {
  data: undefined,
  error: undefined,
  isLoading: true,
  isValidating: true,
  mutate: vi.fn(),
};

const mockSWRError: SWRResponse = {
  data: undefined,
  error: new Error("Test error"),
  isLoading: false,
  isValidating: false,
  mutate: vi.fn(),
};

// Mock data
const mockUser: User = {
  avatarUrl: "https://example.com/avatar.jpg",
  bioHTML: "<p>Test bio</p>",
  id: "1",
  login: "testuser",
  name: "Test User",
} as User;

const mockRepos: Repository[] = [
  {
    description: "Test repo 1",
    id: "1",
    isArchived: false,
    isPrivate: false,
    name: "repo1",
    updatedAt: "2024-02-26T00:00:00Z",
  },
  {
    description: "Test repo 2",
    id: "2",
    isArchived: false,
    isPrivate: true,
    name: "repo2",
    updatedAt: "2024-02-26T00:00:00Z",
  },
] as Repository[];

const mockResponse = {
  user: {
    ...mockUser,
    repositories: {
      nodes: mockRepos,
      pageInfo: {
        endCursor: null,
        hasNextPage: false,
      },
    },
  },
};

const mockSWRSuccess: SWRResponse = {
  data: mockResponse,
  error: undefined,
  isLoading: false,
  isValidating: false,
  mutate: vi.fn(),
};

// Create a mock module factory for SWR
vi.mock("swr", () => ({
  default: vi.fn((key, fetcher) => mockSWRInitial),
}));

describe("useGitHubData", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GitHubProvider>{children}</GitHubProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return initial state when no token/login", () => {
    vi.mocked(require("swr").default).mockImplementation(() => mockSWRInitial);

    const { result } = renderHook(() => useGitHubData(), { wrapper });

    expect(result.current).toEqual({
      isError: false,
      isLoading: false,
      repos: null,
      user: null,
    });
  });

  it("should handle loading state", () => {
    vi.mocked(require("swr").default).mockImplementation(() => mockSWRLoading);

    const { result } = renderHook(() => useGitHubData(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.repos).toBe(null);
    expect(result.current.user).toBe(null);
  });

  it("should handle error state", () => {
    vi.mocked(require("swr").default).mockImplementation(() => mockSWRError);

    const { result } = renderHook(() => useGitHubData(), { wrapper });

    expect(result.current.isError).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.repos).toBe(null);
    expect(result.current.user).toBe(null);
  });

  it("should handle successful data fetch", () => {
    vi.mocked(require("swr").default).mockImplementation(() => mockSWRSuccess);

    const { result } = renderHook(() => useGitHubData(), { wrapper });

    expect(result.current.isError).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.repos).toEqual(mockRepos);
    expect(result.current.user).toEqual(mockUser);
  });

  it("returns initial state", () => {
    const { result } = renderHook(() => useGitHubData());
    expect(result.current).toEqual({
      data: null,
      error: null,
      isLoading: false,
    });
  });

  // Add more tests as needed
});
