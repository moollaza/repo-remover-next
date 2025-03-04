import { renderHook } from "@testing-library/react";
import useSWR from "swr";
import { beforeEach, describe, expect, it, vi } from "vitest";

import useGitHubData from "@/hooks/use-github-data";
import GitHubProvider from "@/providers/github-provider";

import { mockRepos, mockUser } from "../../../tests/fixtures/github-mocks";

// Mock useSWR hook
vi.mock("swr", () => {
  return {
    __esModule: true,
    default: vi.fn(),
  };
});

describe("useGitHubData", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GitHubProvider>{children}</GitHubProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return initial state when no token/login", () => {
    (useSWR as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    });

    const { result } = renderHook(() => useGitHubData(), { wrapper });

    expect(result.current).toEqual({
      isError: false,
      isLoading: false,
      repos: null,
      user: null,
    });
  });

  it("should handle loading state", () => {
    (useSWR as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      isValidating: true,
      mutate: vi.fn(),
    });

    const { result } = renderHook(() => useGitHubData(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.repos).toBe(null);
    expect(result.current.user).toBe(null);
  });

  it("should handle error state", () => {
    (useSWR as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      error: new Error("Test error"),
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    });

    const { result } = renderHook(() => useGitHubData(), { wrapper });

    expect(result.current.isError).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.repos).toBe(null);
    expect(result.current.user).toBe(null);
  });

  it("should handle successful data fetch", () => {
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

    vi.mocked(useSWR).mockReturnValue({
      data: mockResponse,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    });

    const { result } = renderHook(() => useGitHubData(), {
      wrapper: GitHubProvider,
    });

    expect(result.current.isError).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.repos).toEqual(mockRepos);

    // Check only the essential user fields
    const user = result.current.user;
    expect(user).toBeTruthy();
    expect(user?.login).toBe(mockUser.login);
    expect(user?.name).toBe(mockUser.name);
    expect(user?.avatarUrl).toBe(mockUser.avatarUrl);
    expect(user?.bioHTML).toBe(mockUser.bioHTML);
  });
});
