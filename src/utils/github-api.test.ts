import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { server } from "@/mocks/server";
import {
  createMockRepo,
  getValidPersonalAccessToken,
  MOCK_REPOS,
  MOCK_USER,
} from "@/mocks/static-fixtures";
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

  describe("pagination", () => {
    /**
     * Helper to create a GraphQL handler that returns paginated org repo responses.
     * All other queries (getRepositories, getOrganizations) return single-page defaults.
     */
    function createPaginatedOrgReposHandler(
      opts: {
        onOrgRepoRequest?: (variables: Record<string, unknown>) => void;
      } = {},
    ) {
      let orgRepoCallCount = 0;

      return http.post(
        "https://api.github.com/graphql",
        async ({ request }) => {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader?.includes(VALID_PAT)) {
            return HttpResponse.json(
              { message: "Bad credentials" },
              { status: 401 },
            );
          }

          const body = (await request.json()) as {
            query: string;
            variables?: Record<string, unknown>;
          };

          // User repos — single page, one repo
          if (body.query.includes("getRepositories")) {
            return HttpResponse.json({
              data: {
                user: {
                  ...MOCK_USER,
                  repositories: {
                    nodes: [MOCK_REPOS[0]],
                    pageInfo: { endCursor: null, hasNextPage: false },
                  },
                },
              },
            });
          }

          // Orgs — single org so fetchAllOrgRepos runs once
          if (body.query.includes("getOrganizations")) {
            return HttpResponse.json({
              data: {
                user: {
                  organizations: {
                    nodes: [
                      { login: "testorg", url: "https://github.com/testorg" },
                    ],
                    pageInfo: { endCursor: null, hasNextPage: false },
                  },
                },
              },
            });
          }

          // Org repos — paginated: page 1 has hasNextPage:true, page 2 has hasNextPage:false
          if (body.query.includes("getOrgRepositories")) {
            opts.onOrgRepoRequest?.(body.variables ?? {});
            orgRepoCallCount++;
            const isFirstPage = orgRepoCallCount === 1;
            return HttpResponse.json({
              data: {
                organization: {
                  login: "testorg",
                  repositories: {
                    nodes: [
                      createMockRepo({
                        id: `org-page${orgRepoCallCount}-repo`,
                        name: `org-page${orgRepoCallCount}-repo`,
                      }),
                    ],
                    pageInfo: {
                      endCursor: isFirstPage ? "cursor-after-page-1" : null,
                      hasNextPage: isFirstPage,
                    },
                  },
                  url: "https://github.com/testorg",
                },
              },
            });
          }

          return HttpResponse.json({ data: {} });
        },
      );
    }

    it("accumulates org repos across paginated responses", async () => {
      server.use(createPaginatedOrgReposHandler());

      const onProgress = vi.fn();
      const result = await fetchGitHubDataWithProgress(
        ["testuser", VALID_PAT],
        onProgress,
      );

      // 1 user repo + 2 org repos (from 2 pages)
      expect(result.repos).toHaveLength(3);
      expect(result.repos?.some((r) => r.id === "org-page1-repo")).toBe(true);
      expect(result.repos?.some((r) => r.id === "org-page2-repo")).toBe(true);
      expect(result.error).toBeNull();
    });

    it("threads cursor correctly between paginated requests", async () => {
      const capturedCursors: unknown[] = [];
      server.use(
        createPaginatedOrgReposHandler({
          onOrgRepoRequest: (vars) => capturedCursors.push(vars.cursor),
        }),
      );

      const onProgress = vi.fn();
      await fetchGitHubDataWithProgress(["testuser", VALID_PAT], onProgress);

      expect(capturedCursors).toHaveLength(2);
      // First request: cursor should be null (initial page)
      expect(capturedCursors[0]).toBeNull();
      // Second request: cursor should match endCursor from page 1
      expect(capturedCursors[1]).toBe("cursor-after-page-1");
    });

    it("reports progress for each org page loaded", async () => {
      server.use(createPaginatedOrgReposHandler());

      const onProgress = vi.fn();
      await fetchGitHubDataWithProgress(["testuser", VALID_PAT], onProgress);

      // Progress calls: personal repos, org page 1 done, complete
      // The org progress fires once after all pages for that org are fetched
      const orgCalls = onProgress.mock.calls.filter(
        ([p]: [{ stage: string }]) => p.stage === "orgs",
      );
      expect(orgCalls.length).toBeGreaterThanOrEqual(1);

      // Final complete call should have all repos
      const completeCalls = onProgress.mock.calls.filter(
        ([p]: [{ stage: string }]) => p.stage === "complete",
      );
      expect(completeCalls).toHaveLength(1);
      expect(completeCalls[0][0].repos).toHaveLength(3);
    });
  });
});
