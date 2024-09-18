import { faker } from "@faker-js/faker";
import { type Repository } from "@octokit/graphql-schema";
import { Octokit } from "@octokit/rest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { archiveRepos, deleteRepos, generateRepos } from "../github-utils";

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

      await generateRepos(octokit, setLoading, 3);

      expect(setLoading).toHaveBeenCalledWith(true);
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(createForAuthenticatedUser).toHaveBeenCalledTimes(1);
    });
  });

  describe("deleteRepos", () => {
    it("should delete all provided repositories", async () => {
      const repos: Repository[] = Array.from({ length: 5 }, () => ({
        name: faker.company.name(),
        owner: { login: faker.internet.userName() },
      })) as Repository[];

      const deleteRepo = vi
        .spyOn(octokit.rest.repos, "delete")
        .mockResolvedValue({} as never);

      await deleteRepos(octokit, repos, setLoading);

      expect(setLoading).toHaveBeenCalledWith(true);
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(deleteRepo).toHaveBeenCalledTimes(repos.length);
    });

    it("should handle errors gracefully", async () => {
      const repos: Repository[] = Array.from({ length: 5 }, () => ({
        name: faker.company.name(),
        owner: { login: faker.internet.userName() },
      })) as Repository[];

      const deleteRepo = vi
        .spyOn(octokit.rest.repos, "delete")
        .mockRejectedValue(new Error("Test Error"));

      await deleteRepos(octokit, repos, setLoading);

      expect(setLoading).toHaveBeenCalledWith(true);
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(deleteRepo).toHaveBeenCalledTimes(1);
    });
  });

  describe("archiveRepos", () => {
    it("should archive all provided repositories", async () => {
      const repos: Repository[] = Array.from({ length: 5 }, () => ({
        name: faker.company.name(),
        owner: { login: faker.internet.userName() },
      })) as Repository[];

      const updateRepo = vi
        .spyOn(octokit.rest.repos, "update")
        .mockResolvedValue({} as never);

      await archiveRepos(octokit, repos, setLoading);

      expect(setLoading).toHaveBeenCalledWith(true);
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(updateRepo).toHaveBeenCalledTimes(repos.length);
    });

    it("should handle errors gracefully", async () => {
      const repos: Repository[] = Array.from({ length: 5 }, () => ({
        name: faker.company.name(),
        owner: { login: faker.internet.userName() },
      })) as Repository[];

      const updateRepo = vi
        .spyOn(octokit.rest.repos, "update")
        .mockRejectedValue(new Error("Test Error"));

      await archiveRepos(octokit, repos, setLoading);

      expect(setLoading).toHaveBeenCalledWith(true);
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(updateRepo).toHaveBeenCalledTimes(1);
    });
  });
});
