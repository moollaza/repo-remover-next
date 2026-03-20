import "@testing-library/jest-dom";
import { type Repository, type User } from "@octokit/graphql-schema";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { SWRConfig } from "swr";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useGitHubData } from "@/hooks/use-github-data";
import {
  getValidPersonalAccessToken,
  MOCK_REPOS,
  MOCK_USER,
} from "@/mocks/static-fixtures";
import { analytics } from "@/utils/analytics";
import { fetchGitHubDataWithProgress } from "@/utils/github-api";
import { secureStorage } from "@/utils/secure-storage";

import { GitHubDataProvider } from "./github-data-provider";

vi.mock("@/utils/analytics", () => ({
  analytics: {
    trackTokenValidated: vi.fn(),
  },
}));

vi.mock("@/utils/github-api", () => ({
  fetchGitHubDataWithProgress: vi.fn(),
}));

const mockFetch = vi.mocked(fetchGitHubDataWithProgress);

const validToken = getValidPersonalAccessToken();

/** Wrapper that isolates SWR cache per test */
function IsolatedProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ provider: () => new Map() }}>
      <GitHubDataProvider>{children}</GitHubDataProvider>
    </SWRConfig>
  );
}

// Default mock: successful API response
function setupSuccessfulFetch() {
  mockFetch.mockResolvedValue({
    error: null,
    repos: MOCK_REPOS as Repository[],
    user: MOCK_USER as unknown as User,
  });
}

// Test cleanup
afterEach(() => {
  localStorage.clear();
  // Clear secure storage prefixed keys
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("secure_")) {
      localStorage.removeItem(key);
    }
  });
  vi.clearAllMocks();
});

describe("GitHubDataProvider", () => {
  describe("Initial state", () => {
    it("provides empty initial state", () => {
      const { result } = renderHook(() => useGitHubData(), {
        wrapper: GitHubDataProvider,
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.login).toBeNull();
      expect(result.current.pat).toBeNull();
      expect(result.current.repos).toBeNull();
      expect(result.current.user).toBeNull();
    });

    it("loads token from secure storage if available", async () => {
      // Setup secure storage before rendering
      await act(async () => {
        await secureStorage.setItem("pat", validToken);
        await secureStorage.setItem("login", "testuser");
      });

      const { result } = renderHook(() => useGitHubData(), {
        wrapper: GitHubDataProvider,
      });

      // Initial state should reflect the token from secure storage
      await waitFor(() => {
        expect(result.current.pat).toBe(validToken);
        expect(result.current.login).toBe("testuser");
        expect(result.current.isAuthenticated).toBe(true);
      });
    });
  });

  describe("Authentication", () => {
    it("sets token and login", async () => {
      const { result } = renderHook(() => useGitHubData(), {
        wrapper: GitHubDataProvider,
      });

      // Initial state
      expect(result.current.pat).toBeNull();
      expect(result.current.login).toBeNull();

      // Set token and login
      act(() => {
        result.current.setPat(validToken);
        result.current.setLogin("testuser");
      });

      // State should be updated
      await waitFor(() => {
        expect(result.current.pat).toBe(validToken);
        expect(result.current.login).toBe("testuser");
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Should be stored in secure storage
      await waitFor(async () => {
        expect(await secureStorage.getItem("pat")).toBe(validToken);
        expect(await secureStorage.getItem("login")).toBe("testuser");
      });
    });

    it("logs out correctly", async () => {
      // Setup initial authenticated state
      await secureStorage.setItem("pat", validToken);
      await secureStorage.setItem("login", "testuser");

      const { result } = renderHook(() => useGitHubData(), {
        wrapper: GitHubDataProvider,
      });

      // Wait for initial state to be loaded
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Logout
      act(() => {
        result.current.logout();
      });

      // State should be reset
      await waitFor(() => {
        expect(result.current.pat).toBeNull();
        expect(result.current.login).toBe(null);
        expect(result.current.isAuthenticated).toBe(false);
      });

      // Should be removed from secure storage
      await waitFor(async () => {
        expect(await secureStorage.getItem("pat")).toBeNull();
        expect(await secureStorage.getItem("login")).toBeNull();
      });
    });
  });

  describe("setPat behavior", () => {
    it("rejects empty string and does not update state or storage", async () => {
      const { result } = renderHook(() => useGitHubData(), {
        wrapper: IsolatedProvider,
      });

      // Call setPat with empty string
      act(() => {
        result.current.setPat("");
      });

      // State should remain null
      expect(result.current.pat).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);

      // Storage should not have been written
      expect(await secureStorage.getItem("pat")).toBeNull();
    });

    it("always persists token to secure storage (no remember=false path)", async () => {
      const { result } = renderHook(() => useGitHubData(), {
        wrapper: IsolatedProvider,
      });

      // Set a valid token
      act(() => {
        result.current.setPat(validToken);
      });

      // State should update
      await waitFor(() => {
        expect(result.current.pat).toBe(validToken);
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Token should always be persisted — there is no opt-out
      await waitFor(async () => {
        expect(await secureStorage.getItem("pat")).toBe(validToken);
      });
    });

    it("does not clear previously stored login when setting a new token", async () => {
      // Pre-store a login
      await secureStorage.setItem("login", "previoususer");

      const { result } = renderHook(() => useGitHubData(), {
        wrapper: IsolatedProvider,
      });

      // Wait for initialization to load the stored login
      await waitFor(() => {
        expect(result.current.login).toBe("previoususer");
      });

      // Set a new token without setting login
      act(() => {
        result.current.setPat(validToken);
      });

      await waitFor(() => {
        expect(result.current.pat).toBe(validToken);
      });

      // Login should still be intact in both state and storage
      expect(result.current.login).toBe("previoususer");
      expect(await secureStorage.getItem("login")).toBe("previoususer");
    });
  });

  describe("Data fetching", () => {
    it("validates authentication state changes properly", async () => {
      const { result } = renderHook(() => useGitHubData(), {
        wrapper: GitHubDataProvider,
      });

      // Initial state - not authenticated
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.repos).toBeNull();
      expect(result.current.user).toBeNull();

      // Set valid credentials
      act(() => {
        result.current.setPat(validToken);
        result.current.setLogin("testuser");
      });

      // Should now be authenticated
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.pat).toBe(validToken);
        expect(result.current.login).toBe("testuser");
      });
    });
  });

  describe("Analytics", () => {
    it("tracks token_validated only after successful API response", async () => {
      setupSuccessfulFetch();

      const { result } = renderHook(() => useGitHubData(), {
        wrapper: IsolatedProvider,
      });

      // Set PAT — this triggers SWR fetch
      act(() => {
        result.current.setPat(validToken);
      });

      // Analytics should NOT fire immediately on setPat
      expect(analytics.trackTokenValidated).not.toHaveBeenCalled();

      // Wait for SWR to complete successfully (repos loaded = API success)
      await waitFor(() => {
        expect(result.current.repos).not.toBeNull();
      });

      // Now analytics should have fired after successful API response
      expect(analytics.trackTokenValidated).toHaveBeenCalledTimes(1);
    });

    it("does not fire trackTokenValidated twice on SWR revalidation", async () => {
      setupSuccessfulFetch();

      const { result } = renderHook(() => useGitHubData(), {
        wrapper: IsolatedProvider,
      });

      act(() => {
        result.current.setPat(validToken);
      });

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.repos).not.toBeNull();
      });

      expect(analytics.trackTokenValidated).toHaveBeenCalledTimes(1);

      // Trigger a refetch (simulates SWR revalidation)
      act(() => {
        result.current.refetchData();
      });

      // Wait for refetch to complete
      await waitFor(() => {
        expect(result.current.repos).not.toBeNull();
      });

      // Should still be called only once — ref guards against duplicates
      expect(analytics.trackTokenValidated).toHaveBeenCalledTimes(1);
    });
  });

  describe("permissionWarning context exposure", () => {
    it("exposes permissionWarning from fetchGitHubDataWithProgress", async () => {
      mockFetch.mockResolvedValue({
        error: null,
        permissionWarning: "token lacks read:org scope",
        repos: MOCK_REPOS as Repository[],
        user: MOCK_USER as unknown as User,
      });

      const { result } = renderHook(() => useGitHubData(), {
        wrapper: IsolatedProvider,
      });

      act(() => {
        result.current.setPat(validToken);
      });

      await waitFor(() => {
        expect(result.current.repos).not.toBeNull();
      });

      expect(result.current.permissionWarning).toBe(
        "token lacks read:org scope",
      );
    });

    it("permissionWarning is undefined when API returns no warning", async () => {
      setupSuccessfulFetch();

      const { result } = renderHook(() => useGitHubData(), {
        wrapper: IsolatedProvider,
      });

      act(() => {
        result.current.setPat(validToken);
      });

      await waitFor(() => {
        expect(result.current.repos).not.toBeNull();
      });

      expect(result.current.permissionWarning).toBeUndefined();
    });
  });

  describe("refetchData rate limiting", () => {
    it("first call triggers mutate", async () => {
      setupSuccessfulFetch();

      const { result } = renderHook(() => useGitHubData(), {
        wrapper: IsolatedProvider,
      });

      // Authenticate so SWR starts fetching
      act(() => {
        result.current.setPat(validToken);
      });

      // Wait for initial fetch to complete
      await waitFor(() => {
        expect(result.current.repos).not.toBeNull();
      });

      // Clear mock to track only refetch calls
      mockFetch.mockClear();
      setupSuccessfulFetch();

      // First refetchData call should trigger mutate
      act(() => {
        result.current.refetchData();
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });

    it("second call within 5s is silently ignored", async () => {
      const now = 1000000;
      const dateNowSpy = vi.spyOn(Date, "now").mockReturnValue(now);

      setupSuccessfulFetch();

      const { result } = renderHook(() => useGitHubData(), {
        wrapper: IsolatedProvider,
      });

      act(() => {
        result.current.setPat(validToken);
      });

      await waitFor(() => {
        expect(result.current.repos).not.toBeNull();
      });

      mockFetch.mockClear();
      setupSuccessfulFetch();

      // First call at t=1000000 — allowed
      act(() => {
        result.current.refetchData();
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      mockFetch.mockClear();
      setupSuccessfulFetch();

      // Move time forward 2s (within 5s cooldown)
      dateNowSpy.mockReturnValue(now + 2000);

      // Second call — should be rate-limited
      act(() => {
        result.current.refetchData();
      });

      // Fetch should NOT have been called again
      expect(mockFetch).not.toHaveBeenCalled();

      dateNowSpy.mockRestore();
    });

    it("call after 5s cooldown triggers mutate again", async () => {
      const now = 2000000;
      const dateNowSpy = vi.spyOn(Date, "now").mockReturnValue(now);

      setupSuccessfulFetch();

      const { result } = renderHook(() => useGitHubData(), {
        wrapper: IsolatedProvider,
      });

      act(() => {
        result.current.setPat(validToken);
      });

      await waitFor(() => {
        expect(result.current.repos).not.toBeNull();
      });

      mockFetch.mockClear();
      setupSuccessfulFetch();

      // First call at t=2000000 — allowed
      act(() => {
        result.current.refetchData();
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      mockFetch.mockClear();
      setupSuccessfulFetch();

      // Move time past the 5-second cooldown
      dateNowSpy.mockReturnValue(now + 5001);

      // This call should be allowed
      act(() => {
        result.current.refetchData();
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      dateNowSpy.mockRestore();
    });
  });
});
