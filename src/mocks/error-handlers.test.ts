import { describe, expect, it } from "vitest";

import {
  graphqlForbiddenHandler,
  graphqlNetworkErrorHandler,
  graphqlRateLimitHandler,
  graphqlServerErrorHandler,
  graphqlUnauthorizedHandler,
  restForbiddenHandler,
  restServerErrorHandler,
  restUnauthorizedHandler,
} from "@/mocks/handlers";
import { server } from "@/mocks/server";
import {
  getValidPersonalAccessToken,
  MOCK_REPOS,
} from "@/mocks/static-fixtures";
import { fetchGitHubData } from "@/utils/github-api";
import { archiveRepo, deleteRepo } from "@/utils/github-utils";
import { createThrottledOctokit } from "@/utils/github-utils";

const VALID_PAT = getValidPersonalAccessToken();

// Note: fetchGitHubData catches errors internally via fetchRepositories and converts
// null repos to [] via ?? []. So when GraphQL errors occur, result.error is set and
// result.repos is [] (empty), not null.

describe("GraphQL error scenario handlers", () => {
  describe("graphqlUnauthorizedHandler (401)", () => {
    it("causes fetchGitHubData to return an error with no repos", async () => {
      server.use(graphqlUnauthorizedHandler());

      const result = await fetchGitHubData(["testuser", VALID_PAT]);

      expect(result.error).not.toBeNull();
      expect(result.repos).toEqual([]);
    });
  });

  describe("graphqlForbiddenHandler (403 scope error)", () => {
    it("causes fetchGitHubData to return an error on all-query override", async () => {
      server.use(graphqlForbiddenHandler());

      const result = await fetchGitHubData(["testuser", VALID_PAT]);

      expect(result.error).not.toBeNull();
    });
  });

  describe("graphqlRateLimitHandler (429)", () => {
    it("causes fetchGitHubData to return an error with no repos", async () => {
      server.use(graphqlRateLimitHandler("30"));

      const result = await fetchGitHubData(["testuser", VALID_PAT]);

      expect(result.error).not.toBeNull();
      expect(result.repos).toEqual([]);
    });
  });

  describe("graphqlServerErrorHandler (500)", () => {
    it("causes fetchGitHubData to return an error with no repos", async () => {
      server.use(graphqlServerErrorHandler());

      const result = await fetchGitHubData(["testuser", VALID_PAT]);

      expect(result.error).not.toBeNull();
      expect(result.repos).toEqual([]);
    });
  });

  describe("graphqlNetworkErrorHandler (network failure)", () => {
    it("causes fetchGitHubData to return an error with no repos", async () => {
      server.use(graphqlNetworkErrorHandler());

      const result = await fetchGitHubData(["testuser", VALID_PAT]);

      expect(result.error).not.toBeNull();
      expect(result.repos).toEqual([]);
    });
  });
});

describe("REST error scenario handlers", () => {
  const mockRepo = MOCK_REPOS[0];

  describe("restUnauthorizedHandler (401)", () => {
    it("causes archiveRepo to throw", async () => {
      server.use(...restUnauthorizedHandler());
      const octokit = createThrottledOctokit(VALID_PAT);

      await expect(archiveRepo(octokit, mockRepo)).rejects.toThrow(
        /Failed to archive/,
      );
    });

    it("causes deleteRepo to throw", async () => {
      server.use(...restUnauthorizedHandler());
      const octokit = createThrottledOctokit(VALID_PAT);

      await expect(deleteRepo(octokit, mockRepo)).rejects.toThrow(
        /Failed to delete/,
      );
    });
  });

  describe("restForbiddenHandler (403)", () => {
    it("causes archiveRepo to throw with admin rights message", async () => {
      server.use(...restForbiddenHandler());
      const octokit = createThrottledOctokit(VALID_PAT);

      await expect(archiveRepo(octokit, mockRepo)).rejects.toThrow(
        /Failed to archive/,
      );
    });

    it("causes deleteRepo to throw with admin rights message", async () => {
      server.use(...restForbiddenHandler());
      const octokit = createThrottledOctokit(VALID_PAT);

      await expect(deleteRepo(octokit, mockRepo)).rejects.toThrow(
        /Failed to delete/,
      );
    });
  });

  describe("restServerErrorHandler (500)", () => {
    it("causes archiveRepo to throw", async () => {
      server.use(...restServerErrorHandler());
      const octokit = createThrottledOctokit(VALID_PAT);

      await expect(archiveRepo(octokit, mockRepo)).rejects.toThrow(
        /Failed to archive/,
      );
    });

    it("causes deleteRepo to throw", async () => {
      server.use(...restServerErrorHandler());
      const octokit = createThrottledOctokit(VALID_PAT);

      await expect(deleteRepo(octokit, mockRepo)).rejects.toThrow(
        /Failed to delete/,
      );
    });
  });
});
