import "@testing-library/jest-dom";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { useGitHubData } from "@/hooks/use-github-data";
import { getValidPersonalAccessToken } from "@/mocks/static-fixtures";

import { GitHubDataProvider } from "./github-data-provider";

const validToken = getValidPersonalAccessToken();

// Test cleanup
afterEach(() => {
  localStorage.clear();
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

    it("loads token from localStorage if available", async () => {
      // Setup localStorage before rendering
      act(() => {
        localStorage.setItem("pat", validToken);
        localStorage.setItem("login", "testuser");
      });

      const { result } = renderHook(() => useGitHubData(), {
        wrapper: GitHubDataProvider,
      });

      // Initial state should reflect the token from localStorage
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

      // Should be stored in localStorage
      expect(localStorage.getItem("pat")).toBe(validToken);
      expect(localStorage.getItem("login")).toBe("testuser");
    });

    it("logs out correctly", async () => {
      // Setup initial authenticated state
      localStorage.setItem("pat", validToken);
      localStorage.setItem("login", "testuser");

      const { result } = renderHook(() => useGitHubData(), {
        wrapper: GitHubDataProvider,
      });

      // Initial state should be authenticated
      expect(result.current.isAuthenticated).toBe(true);

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

      // Should be removed from localStorage
      expect(localStorage.getItem("pat")).toBeNull();
      expect(localStorage.getItem("login")).toBeNull();
    });
  });

  describe("Data fetching", () => {
    it("validates authentication state changes properly", () => {
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
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.pat).toBe(validToken);
      expect(result.current.login).toBe("testuser");
    });
  });
});

