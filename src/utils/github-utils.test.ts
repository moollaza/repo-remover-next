import { type Repository } from "@octokit/graphql-schema";
import { Octokit } from "@octokit/rest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Import the functions we want to test
import {
  archiveRepo,
  deleteRepo,
  generateRepos,
  isValidGitHubToken,
  processRepo,
} from "./github-utils";

describe("GitHub Utils", () => {
  let mockOctokit: Partial<Octokit>;
  let mockSetLoading: (loading: boolean) => void;
  const mockRepo = {
    name: "test-repo",
    owner: {
      login: "testuser",
    },
  } as Repository;

  // Define our mocks
  const mockCreateForAuthenticatedUser = vi
    .fn()
    .mockResolvedValue({ data: {} });
  const mockUpdate = vi.fn().mockResolvedValue({ data: {} });
  const mockDelete = vi.fn().mockResolvedValue({ data: {} });

  beforeEach(() => {
    // Create a fresh mock for each test
    mockOctokit = {
      rest: {
        repos: {
          createForAuthenticatedUser: mockCreateForAuthenticatedUser,
          delete: mockDelete,
          update: mockUpdate,
        },
      },
    } as unknown as Octokit;

    mockSetLoading = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.useRealTimers();
  });

  describe("generateRepos", () => {
    it("should generate the specified number of repositories", async () => {
      // Start the async function
      const promise = generateRepos(mockOctokit as Octokit, mockSetLoading, 3);

      // Fast-forward through all the timeouts
      for (let i = 0; i < 3; i++) {
        await vi.advanceTimersByTimeAsync(500);
      }

      // Wait for the function to complete
      await promise;

      expect(mockCreateForAuthenticatedUser).toHaveBeenCalledTimes(3);
      expect(mockSetLoading).toHaveBeenCalledWith(true);
      expect(mockSetLoading).toHaveBeenLastCalledWith(false);
    });

    it("should handle errors when creating repositories", async () => {
      const error = new Error("API rate limit exceeded");
      mockCreateForAuthenticatedUser.mockRejectedValueOnce(error);

      // For error case, we don't need to advance timers since it will fail on first call
      await expect(
        generateRepos(mockOctokit as Octokit, mockSetLoading, 1),
      ).rejects.toThrow(
        "Failed to create repositories: API rate limit exceeded",
      );

      expect(mockSetLoading).toHaveBeenLastCalledWith(false);
    });
  });

  describe("archiveRepo", () => {
    it("should call update with archived=true", async () => {
      await archiveRepo(mockOctokit as Octokit, mockRepo);

      expect(mockUpdate).toHaveBeenCalledWith({
        archived: true,
        owner: mockRepo.owner.login,
        repo: mockRepo.name,
      });
    });

    it("should handle errors", async () => {
      const error = new Error("Permission denied");
      mockUpdate.mockRejectedValueOnce(error);

      await expect(
        archiveRepo(mockOctokit as Octokit, mockRepo),
      ).rejects.toThrow(
        `Failed to archive ${mockRepo.name}: Permission denied`,
      );
    });
  });

  describe("deleteRepo", () => {
    it("should call delete with correct parameters", async () => {
      await deleteRepo(mockOctokit as Octokit, mockRepo);

      expect(mockDelete).toHaveBeenCalledWith({
        owner: mockRepo.owner.login,
        repo: mockRepo.name,
      });
    });

    it("should handle errors", async () => {
      const error = new Error("Repository not found");
      mockDelete.mockRejectedValueOnce(error);

      await expect(
        deleteRepo(mockOctokit as Octokit, mockRepo),
      ).rejects.toThrow(
        `Failed to delete ${mockRepo.name}: Repository not found`,
      );
    });
  });

  describe("processRepo", () => {
    it("should call archiveRepo when action is 'archive'", async () => {
      await processRepo(mockOctokit as Octokit, mockRepo, "archive");

      expect(mockUpdate).toHaveBeenCalledWith({
        archived: true,
        owner: mockRepo.owner.login,
        repo: mockRepo.name,
      });
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it("should call deleteRepo when action is 'delete'", async () => {
      await processRepo(mockOctokit as Octokit, mockRepo, "delete");

      expect(mockDelete).toHaveBeenCalledWith({
        owner: mockRepo.owner.login,
        repo: mockRepo.name,
      });
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe("isValidGitHubToken", () => {
    // Test empty or null values
    it("should return false for empty or null tokens", () => {
      expect(isValidGitHubToken("")).toBe(false);
      expect(isValidGitHubToken(null as unknown as string)).toBe(false);
      expect(isValidGitHubToken(undefined as unknown as string)).toBe(false);
    });

    // Test github_pat_ tokens
    it("should validate github_pat_ tokens correctly", () => {
      // Valid github_pat_ tokens
      expect(
        isValidGitHubToken(
          "github_pat_11AABBCCDDEEFFGGHH0011223344556677889900_abcDEF",
        ),
      ).toBe(true);

      // Too short
      expect(isValidGitHubToken("github_pat_short")).toBe(false);

      // Invalid characters
      expect(
        isValidGitHubToken(
          "github_pat_11AABBCCDDEEFFGGHH0011223344556677889900_abc$%^",
        ),
      ).toBe(false);
    });

    // Test standard tokens (ghp_, gho_, etc.)
    it("should validate standard tokens correctly", () => {
      // Valid tokens for each prefix
      expect(
        isValidGitHubToken("ghp_1234567890abcdef1234567890abcdef1234"),
      ).toBe(true);
      expect(
        isValidGitHubToken("gho_1234567890abcdef1234567890abcdef1234"),
      ).toBe(true);
      expect(
        isValidGitHubToken("ghu_1234567890abcdef1234567890abcdef1234"),
      ).toBe(true);
      expect(
        isValidGitHubToken("ghs_1234567890abcdef1234567890abcdef1234"),
      ).toBe(true);
      expect(
        isValidGitHubToken("ghr_1234567890abcdef1234567890abcdef1234"),
      ).toBe(true);

      // Too short
      expect(isValidGitHubToken("ghp_tooshort")).toBe(false);

      // Too long
      expect(
        isValidGitHubToken("ghp_1234567890abcdef1234567890abcdef1234567"),
      ).toBe(false);

      // Invalid characters
      expect(
        isValidGitHubToken("ghp_1234567890abcdef1234567890abcdef12345$"),
      ).toBe(false);
    });

    // Test invalid prefixes
    it("should reject tokens with invalid prefixes", () => {
      expect(
        isValidGitHubToken("xyz_1234567890abcdef1234567890abcdef123456"),
      ).toBe(false);
      expect(
        isValidGitHubToken("gh_1234567890abcdef1234567890abcdef123456"),
      ).toBe(false);
      expect(
        isValidGitHubToken("ghpx_1234567890abcdef1234567890abcdef12345"),
      ).toBe(false);
    });
  });
});
