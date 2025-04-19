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

// Mock Octokit before importing the provider
vi.mock("@octokit/rest", () => {
  const graphqlPaginateMock = vi.fn().mockImplementation((query, variables) => {
    return {
      user: {
        avatarUrl: `https://example.com/${variables.login}.jpg`,
        bioHTML: "<p>Bio</p>",
        id: "user123",
        login: variables.login,
        name: `${variables.login} Name`,
        repositories: {
          nodes: [
            {
              description: "Test repository",
              id: "repo123",
              isArchived: false,
              isDisabled: false,
              isEmpty: false,
              isFork: false,
              isInOrganization: false,
              isLocked: false,
              isMirror: false,
              isPrivate: false,
              isTemplate: false,
              name: "test-repo",
              owner: {
                id: "user123",
                login: variables.login,
                url: `https://github.com/${variables.login}`,
              },
              updatedAt: "2023-01-01T00:00:00Z",
              url: `https://github.com/${variables.login}/test-repo`,
              viewerCanAdminister: true,
            },
          ],
          pageInfo: {
            endCursor: null,
            hasNextPage: false,
          },
        },
      },
    };
  });

  return {
    Octokit: vi.fn().mockImplementation(() => ({
      graphql: {
        paginate: graphqlPaginateMock,
      },
      rest: {
        users: {
          getByUsername: vi.fn().mockResolvedValue({
            data: {
              avatar_url: "https://example.com/testuser.jpg",
              id: "user123",
              login: "testuser",
              name: "Test User",
            },
          }),
        },
      },
    })),
  };
});

import { useGitHubData } from "@/hooks/use-github-data";

import { GitHubDataProvider } from "./github-data-provider";

const validToken = "ghp_validtoken123456789012345678901234567890";

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

  // Handler for specific user endpoint
  http.get("https://api.github.com/users/:username", ({ params }) => {
    const { username } = params;

    // Ensure username is a string
    if (typeof username !== "string") {
      return HttpResponse.json(
        { message: "Invalid username" },
        { status: 400 },
      );
    }

    return HttpResponse.json({
      avatar_url: `https://example.com/${username}.jpg`,
      id: "user123",
      login: username,
      name: `${username} Name`,
    });
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
    test.skip("fetches data when authenticated", async () => {
      // Mock localStorage
      vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
        if (key === "pat") return "test-pat";
        if (key === "login") return "testuser";
        return null;
      });

      const { result } = renderHook(() => useGitHubData(), {
        wrapper: GitHubDataProvider,
      });

      // Initial state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.repos).toBeNull();

      // Wait for data to load
      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
          expect(result.current.repos).not.toBeNull();
        },
        { timeout: 3000 },
      );

      // Check that data was loaded
      expect(result.current.repos).toHaveLength(1);
      expect(result.current.repos?.[0].name).toBe("test-repo");
    });
  });
});

// Mock the createThrottledOctokit function
vi.mock("@/utils/github-utils", () => ({
  createThrottledOctokit: vi.fn().mockImplementation(() => ({
    rest: {
      users: {
        getAuthenticated: vi.fn().mockResolvedValue({
          data: { login: "testuser" },
        }),
      },
    },
  })),
}));
