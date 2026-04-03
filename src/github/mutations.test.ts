import { type Repository } from "@octokit/graphql-schema";
import { Octokit } from "@octokit/rest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock analytics module before importing anything that uses it
vi.mock("@/utils/analytics", () => ({
  analytics: {
    trackRepoArchived: vi.fn(),
    trackRepoDeleted: vi.fn(),
  },
}));

import { analytics } from "@/utils/analytics";

import { isValidGitHubToken } from "./client";
import { generateRepos } from "./dev-tools";
import { archiveRepo, deleteRepo, processRepo } from "./mutations";

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

    it("should propagate errors from the API", async () => {
      const error = new Error("Permission denied");
      mockUpdate.mockRejectedValueOnce(error);

      await expect(
        archiveRepo(mockOctokit as Octokit, mockRepo),
      ).rejects.toThrow("Permission denied");
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

    it("should propagate errors from the API", async () => {
      const error = new Error("Repository not found");
      mockDelete.mockRejectedValueOnce(error);

      await expect(
        deleteRepo(mockOctokit as Octokit, mockRepo),
      ).rejects.toThrow("Repository not found");
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

    it("should call analytics.trackRepoArchived after successful archive", async () => {
      await processRepo(mockOctokit as Octokit, mockRepo, "archive");

      expect(analytics.trackRepoArchived).toHaveBeenCalledOnce();
      expect(analytics.trackRepoDeleted).not.toHaveBeenCalled();
    });

    it("should call analytics.trackRepoDeleted after successful delete", async () => {
      await processRepo(mockOctokit as Octokit, mockRepo, "delete");

      expect(analytics.trackRepoDeleted).toHaveBeenCalledOnce();
      expect(analytics.trackRepoArchived).not.toHaveBeenCalled();
    });

    it("should not call analytics when archive API throws", async () => {
      mockUpdate.mockRejectedValueOnce(new Error("Permission denied"));

      await expect(
        processRepo(mockOctokit as Octokit, mockRepo, "archive"),
      ).rejects.toThrow();

      expect(analytics.trackRepoArchived).not.toHaveBeenCalled();
      expect(analytics.trackRepoDeleted).not.toHaveBeenCalled();
    });

    it("should not call analytics when delete API throws", async () => {
      mockDelete.mockRejectedValueOnce(new Error("Not found"));

      await expect(
        processRepo(mockOctokit as Octokit, mockRepo, "delete"),
      ).rejects.toThrow();

      expect(analytics.trackRepoDeleted).not.toHaveBeenCalled();
      expect(analytics.trackRepoArchived).not.toHaveBeenCalled();
    });
  });

  describe("isValidGitHubToken", () => {
    // Test empty or null values
    it("should return false for empty or null tokens", () => {
      expect(isValidGitHubToken("")).toBe(false);
      expect(isValidGitHubToken(null as unknown as string)).toBe(false);
      expect(isValidGitHubToken(undefined as unknown as string)).toBe(false);
    });

    // Test github_pat_ tokens (fine-grained PATs are 82+ chars)
    it("should validate github_pat_ tokens correctly", () => {
      // Valid github_pat_ token (realistic length ~82 chars)
      expect(
        isValidGitHubToken(
          "github_pat_11AABBCCDDEEFFGGHH0011_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVW",
        ),
      ).toBe(true);

      // Too short — prefix only
      expect(isValidGitHubToken("github_pat_short")).toBe(false);

      // Too short — 40 chars total (only 29 chars of payload, not a real PAT)
      expect(
        isValidGitHubToken("github_pat_12345678901234567890123456789"),
      ).toBe(false);

      // Too short — 56 chars (still below 72-char minimum)
      expect(
        isValidGitHubToken(
          "github_pat_11AABBCCDDEEFFGGHH0011223344556677889900_abcDEF",
        ),
      ).toBe(false);

      // Invalid characters
      expect(
        isValidGitHubToken(
          "github_pat_11AABBCCDDEEFFGGHH0011_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRST$%^",
        ),
      ).toBe(false);
    });

    it("should reject github_pat_ tokens with underscore-only payloads", () => {
      // 72 chars total, all underscores after prefix — not a real token
      expect(isValidGitHubToken("github_pat_" + "_".repeat(61))).toBe(false);

      // Even longer underscore-only payload
      expect(isValidGitHubToken("github_pat_" + "_".repeat(100))).toBe(false);

      // Mixed underscores with at least one alphanumeric should still pass
      expect(
        isValidGitHubToken(
          "github_pat_11AABBCCDDEEFFGGHH0011_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVW",
        ),
      ).toBe(true);
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
