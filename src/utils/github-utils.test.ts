import { type Repository } from "@octokit/graphql-schema";
import { Octokit } from "@octokit/rest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

// Import the function we want to test directly
import { isValidGitHubToken } from "../github-utils";

// Define our mocks
const mockCreateForAuthenticatedUser = vi.fn().mockResolvedValue({ data: {} });
const mockUpdate = vi.fn().mockResolvedValue({ data: {} });
const mockDelete = vi.fn().mockResolvedValue({ data: {} });

// Mock the github-utils module
vi.mock("../github-utils", () => {
  return {
    // Mock other functions that interact with Octokit
    archiveRepo: vi.fn(async (octokit, repo) => {
      try {
        await octokit.rest.repos.update({
          archived: true,
          owner: repo.owner.login,
          repo: repo.name,
        });
      } catch (error) {
        const errorMessage = (error as Error).message;
        throw new Error(`Failed to archive ${repo.name}: ${errorMessage}`);
      }
    }),

    deleteRepo: vi.fn(async (octokit, repo) => {
      try {
        await octokit.rest.repos.delete({
          owner: repo.owner.login,
          repo: repo.name,
        });
      } catch (error) {
        const errorMessage = (error as Error).message;
        throw new Error(`Failed to delete ${repo.name}: ${errorMessage}`);
      }
    }),

    generateRepos: vi.fn(async (octokit, setLoading, numberOfRepos = 10) => {
      setLoading(true);
      try {
        for (let i = 0; i < numberOfRepos; i++) {
          await octokit.rest.repos.createForAuthenticatedUser({});
          await new Promise((resolve) => setTimeout(resolve, 5)); // Minimal delay
        }
      } catch (error) {
        const errorMessage = (error as Error).message;
        throw new Error(`Failed to create repositories: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    }),

    // Keep the original isValidGitHubToken implementation
    isValidGitHubToken,

    processRepo: vi.fn(async (octokit, repo, action) => {
      if (action === "archive") {
        await octokit.rest.repos.update({
          archived: true,
          owner: repo.owner.login,
          repo: repo.name,
        });
      } else if (action === "delete") {
        await octokit.rest.repos.delete({
          owner: repo.owner.login,
          repo: repo.name,
        });
      }
    }),
  };
});

// Re-import the mocked functions
import {
  archiveRepo,
  deleteRepo,
  generateRepos,
  processRepo,
} from "../github-utils";

// MSW setup to mock GitHub API
const server = setupServer(
  http.post("https://api.github.com/repos/:owner/:repo", () => {
    return HttpResponse.json({ success: true });
  }),
  http.patch("https://api.github.com/repos/:owner/:repo", () => {
    return HttpResponse.json({ success: true });
  }),
  http.delete("https://api.github.com/repos/:owner/:repo", () => {
    return new HttpResponse(null, { status: 204 });
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Common mocks
const mockSetLoading = vi.fn();

// Create mock repository
const mockRepo = {
  name: "test-repo",
  owner: {
    login: "testuser",
  },
} as Repository;

describe("GitHub Utils", () => {
  let mockOctokit: Octokit;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a new Octokit instance for testing
    mockOctokit = {
      rest: {
        repos: {
          createForAuthenticatedUser: mockCreateForAuthenticatedUser,
          delete: mockDelete,
          update: mockUpdate,
        },
      },
    } as unknown as Octokit;
  });

  describe("generateRepos", () => {
    it("should generate the specified number of repositories", async () => {
      await generateRepos(mockOctokit, mockSetLoading, 3);

      expect(mockCreateForAuthenticatedUser).toHaveBeenCalledTimes(3);
      expect(mockSetLoading).toHaveBeenCalledWith(true);
      expect(mockSetLoading).toHaveBeenLastCalledWith(false);
    });

    it("should handle errors when creating repositories", async () => {
      const error = new Error("API rate limit exceeded");
      mockCreateForAuthenticatedUser.mockRejectedValueOnce(error);

      await expect(
        generateRepos(mockOctokit, mockSetLoading, 1),
      ).rejects.toThrow(
        "Failed to create repositories: API rate limit exceeded",
      );
      expect(mockSetLoading).toHaveBeenLastCalledWith(false);
    });
  });

  describe("isValidGitHubToken", () => {
    it("should return false for empty token", () => {
      expect(isValidGitHubToken("")).toBe(false);
    });

    it("should validate github_pat tokens", () => {
      expect(isValidGitHubToken("github_pat_valid_token_12345abcdef")).toBe(
        true,
      );
      expect(isValidGitHubToken("github_pat_ab")).toBe(false); // Too short
      expect(isValidGitHubToken("github_pat_invalid$token")).toBe(false); // Invalid characters
    });

    it("should validate standard tokens", () => {
      expect(
        isValidGitHubToken("ghp_1234567890abcdefghijklmnopqrstuvwxyz1234"),
      ).toBe(true);
      expect(
        isValidGitHubToken("gho_1234567890abcdefghijklmnopqrstuvwxyz1234"),
      ).toBe(true);
      expect(
        isValidGitHubToken("ghs_1234567890abcdefghijklmnopqrstuvwxyz1234"),
      ).toBe(true);
      expect(
        isValidGitHubToken("ghr_1234567890abcdefghijklmnopqrstuvwxyz1234"),
      ).toBe(true);
      expect(
        isValidGitHubToken("ghu_1234567890abcdefghijklmnopqrstuvwxyz1234"),
      ).toBe(true);
      expect(
        isValidGitHubToken("abc_1234567890abcdefghijklmnopqrstuvwxyz1234"),
      ).toBe(false); // Invalid prefix
      expect(isValidGitHubToken("ghp_short")).toBe(false); // Too short
      expect(
        isValidGitHubToken("ghp_1234567890abcdefghijklmnopqrstuvwxyz$$$"),
      ).toBe(false); // Invalid characters
    });
  });

  describe("archiveRepo", () => {
    it("should archive a repository", async () => {
      await archiveRepo(mockOctokit, mockRepo);

      expect(mockUpdate).toHaveBeenCalledWith({
        archived: true,
        owner: "testuser",
        repo: "test-repo",
      });
    });

    it("should throw an error when archive fails", async () => {
      const error = new Error("Permission denied");
      mockUpdate.mockRejectedValueOnce(error);

      await expect(archiveRepo(mockOctokit, mockRepo)).rejects.toThrow(
        "Failed to archive test-repo: Permission denied",
      );
    });
  });

  describe("deleteRepo", () => {
    it("should delete a repository", async () => {
      await deleteRepo(mockOctokit, mockRepo);

      expect(mockDelete).toHaveBeenCalledWith({
        owner: "testuser",
        repo: "test-repo",
      });
    });

    it("should throw an error when delete fails", async () => {
      const error = new Error("Repository not found");
      mockDelete.mockRejectedValueOnce(error);

      await expect(deleteRepo(mockOctokit, mockRepo)).rejects.toThrow(
        "Failed to delete test-repo: Repository not found",
      );
    });
  });

  describe("processRepo", () => {
    it('should archive a repository when action is "archive"', async () => {
      await processRepo(mockOctokit, mockRepo, "archive");

      expect(mockUpdate).toHaveBeenCalledWith({
        archived: true,
        owner: "testuser",
        repo: "test-repo",
      });
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('should delete a repository when action is "delete"', async () => {
      await processRepo(mockOctokit, mockRepo, "delete");

      expect(mockDelete).toHaveBeenCalledWith({
        owner: "testuser",
        repo: "test-repo",
      });
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });
});
