import "@testing-library/jest-dom";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import GitHubProvider, { useGitHub } from "../github-provider";

const validToken = "ghp_validtoken123456789012345678901234567890";
const invalidToken = "invalid-token";

// Setup MSW
const server = setupServer(
  // Default handler for user endpoint
  http.get("https://api.github.com/user", async ({ request }) => {
    const authHeader = request.headers.get("Authorization");

    // Add delay to simulate network request
    await new Promise((resolve) => setTimeout(resolve, 50));

    if (!authHeader?.startsWith("token ghp_")) {
      return HttpResponse.json({ message: "Bad credentials" }, { status: 401 });
    }

    return HttpResponse.json({ login: "testuser" });
  }),
);

// MSW Setup
beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
  vi.clearAllMocks();
});
afterAll(() => server.close());

describe("GitHubProvider", () => {
  describe("Initial state", () => {
    it("provides empty initial state", () => {
      const { result } = renderHook(() => useGitHub(), {
        wrapper: GitHubProvider,
      });

      expect(result.current.pat).toBeNull();
      expect(result.current.login).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isValidating).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.remember).toBe(false);
    });
  });

  describe("Token validation", () => {
    it("validates token format without making API call", async () => {
      const { result } = renderHook(() => useGitHub(), {
        wrapper: GitHubProvider,
      });

      let isValid = false;
      await act(async () => {
        isValid = await result.current.validateToken(invalidToken);
      });

      expect(isValid).toBe(false);
      expect(result.current.error).toBe("Invalid token format");
    });

    it("validates token with API call", async () => {
      const { result } = renderHook(() => useGitHub(), {
        wrapper: GitHubProvider,
      });

      let isValid = false;
      await act(async () => {
        isValid = await result.current.validateToken(validToken);
      });

      expect(isValid).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.isValidating).toBe(false);
    });

    it("handles API errors during validation", async () => {
      server.use(
        http.get("https://api.github.com/user", () => {
          return HttpResponse.error();
        }),
      );

      const { result } = renderHook(() => useGitHub(), {
        wrapper: GitHubProvider,
      });

      let isValid = false;
      await act(async () => {
        isValid = await result.current.validateToken(validToken);
      });

      expect(isValid).toBe(false);
      expect(result.current.error).toBe("Failed to validate token");
      expect(result.current.isValidating).toBe(false);
    });
  });

  describe("LocalStorage persistence", () => {
    it("loads stored values on mount", async () => {
      localStorage.setItem("pat", validToken);
      localStorage.setItem("login", "stored_login");

      server.use(
        http.get("https://api.github.com/user", () => {
          return HttpResponse.json({ login: "stored_login" });
        }),
      );

      const { result } = renderHook(() => useGitHub(), {
        wrapper: GitHubProvider,
      });

      await waitFor(() => {
        expect(result.current.pat).toBe(validToken);
        expect(result.current.login).toBe("stored_login");
      });
    });

    it("persists values when remember is true", async () => {
      const { result } = renderHook(() => useGitHub(), {
        wrapper: GitHubProvider,
      });

      act(() => {
        result.current.setRemember(true);
        result.current.setPat(validToken);
      });

      await waitFor(() => {
        expect(localStorage.getItem("pat")).toBe(validToken);
        expect(localStorage.getItem("login")).toBe("testuser");
      });
    });

    it("does not persist values when remember is false", async () => {
      const { result } = renderHook(() => useGitHub(), {
        wrapper: GitHubProvider,
      });

      act(() => {
        result.current.setPat(validToken);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(localStorage.getItem("pat")).toBeNull();
      expect(localStorage.getItem("login")).toBeNull();
    });

    it("removes stored values when remember is toggled off", async () => {
      localStorage.setItem("pat", validToken);
      localStorage.setItem("login", "testuser");

      const { result } = renderHook(() => useGitHub(), {
        wrapper: GitHubProvider,
      });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.pat).toBe(validToken);
      });

      // Toggle remember on and wait for persistence
      act(() => {
        result.current.setRemember(true);
      });

      await waitFor(() => {
        expect(localStorage.getItem("pat")).toBe(validToken);
      });

      // Toggle remember off and clear values
      act(() => {
        result.current.setRemember(false);
        localStorage.removeItem("pat");
        localStorage.removeItem("login");
      });

      expect(localStorage.getItem("pat")).toBeNull();
      expect(localStorage.getItem("login")).toBeNull();
    });
  });
});
