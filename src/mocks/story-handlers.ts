/**
 * Reusable MSW handler sets for Storybook stories
 *
 * Composable building blocks eliminate duplication.
 * Each handler set is a simple composition of shared handlers.
 *
 * Usage in stories:
 * ```typescript
 * export const MyStory: Story = {
 *   parameters: {
 *     msw: { handlers: authenticatedHandlers }
 *   }
 * };
 * ```
 */

import { delay, graphql, http, HttpResponse } from "msw";

import {
  createMockRepo,
  MOCK_ORGANIZATIONS,
  MOCK_REPOS,
  MOCK_USER,
} from "@/mocks/static-fixtures";

const github = graphql.link("https://api.github.com/graphql");

// --- Building blocks ---

const currentUserHandler = github.query("getCurrentUser", () =>
  HttpResponse.json({ data: { viewer: MOCK_USER } }),
);

const restUserHandler = http.get("https://api.github.com/user", () =>
  HttpResponse.json(MOCK_USER),
);

function orgReposHandler(repos?: typeof MOCK_REPOS) {
  const orgRepos = repos ?? MOCK_REPOS.filter((r) => r.isInOrganization);
  return github.query("getOrgRepositories", () =>
    HttpResponse.json({
      data: {
        organization: {
          login: "testorg",
          repositories: {
            nodes: orgRepos,
            pageInfo: { endCursor: null, hasNextPage: false },
          },
          url: "https://github.com/testorg",
        },
      },
    }),
  );
}

function orgsHandler(orgs = MOCK_ORGANIZATIONS) {
  return github.query("getOrganizations", () =>
    HttpResponse.json({
      data: {
        user: {
          organizations: {
            nodes: orgs,
            pageInfo: { endCursor: null, hasNextPage: false },
          },
        },
      },
    }),
  );
}

function reposHandler(repos = MOCK_REPOS) {
  return github.query("getRepositories", () =>
    HttpResponse.json({
      data: {
        user: {
          ...MOCK_USER,
          repositories: {
            nodes: repos,
            pageInfo: { endCursor: null, hasNextPage: false },
          },
        },
      },
    }),
  );
}

const archiveHandler = http.patch(
  "https://api.github.com/repos/:owner/:repo",
  () => HttpResponse.json({ archived: true }),
);

const deleteHandler = http.delete(
  "https://api.github.com/repos/:owner/:repo",
  () => HttpResponse.json({ message: "Deleted" }),
);

// --- Composed handler sets ---

export const authenticatedHandlers = [
  currentUserHandler,
  restUserHandler,
  reposHandler(),
  orgsHandler(),
  orgReposHandler(),
  archiveHandler,
  deleteHandler,
];

export const loadingHandlers = [
  github.query("getCurrentUser", async () => {
    await delay("infinite");
  }),
  github.query("getRepositories", async () => {
    await delay("infinite");
  }),
  http.get("https://api.github.com/user", async () => {
    await delay("infinite");
  }),
];

export const errorHandlers = [
  github.query("getCurrentUser", () =>
    HttpResponse.json({ message: "Bad credentials" }, { status: 401 }),
  ),
  http.get("https://api.github.com/user", () =>
    HttpResponse.json({ message: "Bad credentials" }, { status: 401 }),
  ),
  http.patch("https://api.github.com/repos/:owner/:repo", () =>
    HttpResponse.json({ message: "Not Found" }, { status: 404 }),
  ),
  http.delete("https://api.github.com/repos/:owner/:repo", () =>
    HttpResponse.json({ message: "Forbidden" }, { status: 403 }),
  ),
];

export const emptyHandlers = [
  currentUserHandler,
  restUserHandler,
  reposHandler([]),
  orgsHandler([]),
];

export const largeDatasetHandlers = [
  currentUserHandler,
  restUserHandler,
  reposHandler(
    Array.from({ length: 50 }, (_, i) =>
      createMockRepo({
        description: `Test repository ${i} for pagination`,
        id: `repo-${i}`,
        name: `repository-${i}`,
      }),
    ),
  ),
  orgsHandler(),
  orgReposHandler(),
];

export const invalidTokenHandlers = [
  github.query("getCurrentUser", () =>
    HttpResponse.json({ message: "Bad credentials" }, { status: 401 }),
  ),
  http.get("https://api.github.com/user", () =>
    HttpResponse.json({ message: "Bad credentials" }, { status: 401 }),
  ),
];

export const validTokenHandlers = [restUserHandler];

export const partialDataHandlers = [
  currentUserHandler,
  restUserHandler,
  reposHandler(MOCK_REPOS.slice(0, 5)),
  orgsHandler(),
  github.query("getOrgRepositories", ({ variables }) => {
    const vars = variables as { org?: string };
    if (vars.org === "anotherorg") {
      return HttpResponse.json(
        { message: "Resource protected by organization SAML enforcement" },
        { status: 403 },
      );
    }
    const orgRepos = MOCK_REPOS.filter((r) => r.isInOrganization);
    return HttpResponse.json({
      data: {
        organization: {
          login: "testorg",
          repositories: {
            nodes: orgRepos,
            pageInfo: { endCursor: null, hasNextPage: false },
          },
          url: "https://github.com/testorg",
        },
      },
    });
  }),
];
