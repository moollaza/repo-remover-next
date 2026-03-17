import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { server } from "@/mocks/server";
import { getValidPersonalAccessToken, MOCK_REPOS, MOCK_USER } from "@/mocks/static-fixtures";
import { fetchGitHubDataWithProgress } from "@/utils/github-api";

const VALID_PAT = getValidPersonalAccessToken();

describe("fetchGitHubDataWithProgress", () => {
  it("returns permissionWarning when org fetch fails with required scopes error", async () => {
    // Override the org query to return a permissions error
    server.use(
      http.post("https://api.github.com/graphql", async ({ request }) => {
        const body = (await request.json()) as { query: string };

        if (body.query.includes("getOrganizations")) {
          return HttpResponse.json({
            data: null,
            errors: [
              {
                message:
                  "Your token has not been granted the required scopes to execute this query.",
                type: "INSUFFICIENT_SCOPES",
              },
            ],
          });
        }

        // For user repos, return normal data
        if (body.query.includes("getRepositories")) {
          return HttpResponse.json({
            data: {
              user: {
                ...MOCK_USER,
                repositories: {
                  nodes: MOCK_REPOS.slice(0, 2),
                  pageInfo: { endCursor: null, hasNextPage: false },
                },
              },
            },
          });
        }

        return HttpResponse.json({ data: {} });
      }),
    );

    const onProgress = vi.fn();
    const result = await fetchGitHubDataWithProgress(
      ["testuser", VALID_PAT],
      onProgress,
    );

    expect(result.permissionWarning).toBeDefined();
    expect(result.permissionWarning).toContain("read:org");
    expect(result.repos).not.toBeNull();
    expect(result.error).toBeNull();
  });

  it("does not include permissionWarning on successful fetch", async () => {
    const onProgress = vi.fn();
    const result = await fetchGitHubDataWithProgress(
      ["testuser", VALID_PAT],
      onProgress,
    );

    expect(result.permissionWarning).toBeUndefined();
    expect(result.repos).not.toBeNull();
    expect(result.error).toBeNull();
  });
});
