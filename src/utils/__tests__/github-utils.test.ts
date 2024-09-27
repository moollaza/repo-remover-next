import { User, type Repository } from "@octokit/graphql-schema";
import { Octokit } from "@octokit/rest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { archiveRepo, deleteRepo, generateRepos } from "../github-utils";

const testUser: User = {
  login: "test-user",
  avatarUrl: "",
  resourcePath: "",
  url: "",
} as User;

const testRepo: Repository = {
  name: "test-repo",
  owner: testUser,
} as Repository;

// Mock the Octokit module
vi.mock("@octokit/rest", () => {
  return {
    Octokit: vi.fn().mockImplementation(() => {
      return {
        rest: {
          repos: {
            createForAuthenticatedUser: vi.fn(),
            delete: vi.fn(),
            update: vi.fn(),
          },
        },
      };
    }),
  };
});

describe("GitHub Repository Management", () => {
  let octokit: Octokit;
  let setLoading: ReturnType<typeof vi.fn>;
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    octokit = new Octokit();
    setLoading = vi.fn();
    originalConsoleError = console.error;
    console.error = vi.fn(); // Suppress console errors
  });

  afterEach(() => {
    vi.clearAllMocks();
    console.error = originalConsoleError; // Restore console errors
  });

  describe("generateRepos", () => {
    it("should create 3 repositories", async () => {
      const createForAuthenticatedUser = vi
        .spyOn(octokit.rest.repos, "createForAuthenticatedUser")
        .mockResolvedValue({} as never);

      await generateRepos(octokit, setLoading, 3);

      expect(setLoading).toHaveBeenCalledWith(true);
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(createForAuthenticatedUser).toHaveBeenCalledTimes(3);
    });

    it("should handle errors gracefully", async () => {
      const createForAuthenticatedUser = vi
        .spyOn(octokit.rest.repos, "createForAuthenticatedUser")
        .mockRejectedValue(new Error("Test Error"));

      await expect(() =>
        generateRepos(octokit, setLoading, 1),
      ).rejects.toThrowError("Failed to create repositories: Test Error");

      expect(setLoading).toHaveBeenCalledWith(true);
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(createForAuthenticatedUser).toHaveBeenCalledTimes(1);
    });
  });

  describe("archiveRepo", () => {
    it("should archive a repository", async () => {
      const update = vi
        .spyOn(octokit.rest.repos, "update")
        .mockResolvedValue({} as never);

      await archiveRepo(octokit, testRepo);

      expect(update).toHaveBeenCalledWith({
        owner: testRepo.owner.login,
        repo: testRepo.name,
        archived: true,
      });
    });

    it("should handle archive errors gracefully", async () => {
      vi.spyOn(octokit.rest.repos, "update").mockRejectedValue(
        new Error("Test Error"),
      );

      await expect(() => archiveRepo(octokit, testRepo)).rejects.toThrowError(
        "Failed to archive test-repo: Test Error",
      );
    });
  });

  describe("deleteRepo", () => {
    it("should delete a repository", async () => {
      const del = vi
        .spyOn(octokit.rest.repos, "delete")
        .mockResolvedValue({} as never);

      await deleteRepo(octokit, testRepo);

      expect(del).toHaveBeenCalledWith({
        owner: testRepo.owner.login,
        repo: testRepo.name,
      });
    });

    it("should handle errors gracefully", async () => {
      vi.spyOn(octokit.rest.repos, "delete").mockRejectedValue(
        new Error("Test Error"),
      );

      await expect(() => deleteRepo(octokit, testRepo)).rejects.toThrowError(
        "Failed to delete test-repo: Test Error",
      );
    });
  });
});
