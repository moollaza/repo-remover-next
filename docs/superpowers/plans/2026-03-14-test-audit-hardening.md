# Test Audit & Hardening for Go-Live

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix safety-critical bugs, restructure test harness around the Testing Trophy ("write tests, not too many, mostly integration"), and ensure the destructive operations (archive/delete) are thoroughly covered before go-live.

**Architecture:** Testing Trophy approach — static analysis (already solid) → unit tests for pure logic → **integration tests as the primary confidence layer** → E2E only for critical user journeys. Mock at the network boundary (MSW), not at the module boundary (vi.mock).

**Tech Stack:** Vitest, MSW v2 (`graphql.query` handlers), Playwright, React Testing Library, HeroUI

**Key principle:** "The more your tests resemble the way your software is used, the more confidence they can give you." — Kent C. Dodds

---

## Chunk 1: Fix Production Bugs

These are real bugs in production code and test infrastructure that must be fixed regardless of testing strategy.

### Task 1: Fix "select all" including non-administerable repos

When `selectedRepoKeys === "all"`, `RepoTable` passes ALL repos (including ones the user can't administer and can't even see) to `ConfirmationModal`. The filter hook excludes non-admin repos from the table, but the selection memo bypasses that filter.

**Files:**

- Modify: `src/components/repo-table/repo-table.tsx:94-100`

- [ ] **Step 1: Fix the selectedRepos memo**

In `src/components/repo-table/repo-table.tsx`, change:

```tsx
const selectedRepos = useMemo(() => {
  if (selectedRepoKeys === "all") {
    return repos ?? [];
  }
  return repos?.filter((repo) => selectedRepoKeys.has(repo.id)) ?? [];
}, [repos, selectedRepoKeys]);
```

To:

```tsx
const selectedRepos = useMemo(() => {
  if (selectedRepoKeys === "all") {
    return filteredRepos;
  }
  return filteredRepos.filter((repo) => selectedRepoKeys.has(repo.id));
}, [filteredRepos, selectedRepoKeys]);
```

This ensures "select all" only includes repos that pass the admin filter and are actually visible in the table.

- [ ] **Step 2: Run unit + E2E tests**

Run: `npx vitest run && npx playwright test`
Expected: All pass. No behavior change for normal usage since `filteredRepos` is what the table displays.

- [ ] **Step 3: Commit**

```bash
git add src/components/repo-table/repo-table.tsx
git commit -m "fix: select-all now excludes non-administerable repos from confirmation"
```

---

### Task 2: Fix E2E mock infrastructure bugs

Two bugs: (a) `mockArchiveRepo` double-fulfills when `delay` is set, (b) route patterns only match `testuser` owner — org repos would miss.

**Files:**

- Modify: `e2e/utils/github-api-mocks.ts`

- [ ] **Step 1: Rewrite mockArchiveRepo**

Replace the function (lines 10-55):

```typescript
export async function mockArchiveRepo(
  page: Page,
  repoName: string,
  options: { delay?: number; error?: string; success?: boolean } = {},
) {
  await page.route(`**/repos/**/${repoName}`, (route) => {
    if (route.request().method() !== "PATCH") {
      void route.continue();
      return;
    }

    const fulfill = () => {
      if (options.success === false) {
        void route.fulfill({
          json: { message: options.error ?? "Repository archiving failed" },
          status: 403,
        });
      } else {
        void route.fulfill({ json: { archived: true }, status: 200 });
      }
    };

    if (options.delay) {
      setTimeout(fulfill, options.delay);
    } else {
      fulfill();
    }
  });
}
```

Key fixes: extract `fulfill` to prevent double-call, guard clause for non-PATCH, `**/repos/**/${repoName}` matches any owner.

- [ ] **Step 2: Fix mockDeleteRepo for same issues**

```typescript
export async function mockDeleteRepo(
  page: Page,
  repoName: string,
  options: { error?: string; success?: boolean } = {},
) {
  await page.route(`**/repos/**/${repoName}`, (route) => {
    if (route.request().method() !== "DELETE") {
      void route.continue();
      return;
    }

    if (options.success === false) {
      void route.fulfill({
        json: { message: options.error ?? "Repository deletion failed" },
        status: 403,
      });
    } else {
      void route.fulfill({ status: 204 });
    }
  });
}
```

- [ ] **Step 3: Run E2E tests**

Run: `npx playwright test e2e/dashboard.spec.ts`
Expected: All pass.

- [ ] **Step 4: Commit**

```bash
git add e2e/utils/github-api-mocks.ts
git commit -m "fix: E2E mock handlers — resolve double-fulfill bug, support org repos"
```

---

## Chunk 2: Migrate MSW to Operation-Based GraphQL Handlers

This is the foundation everything else builds on. Currently all GraphQL requests hit one handler with fragile string matching. MSW v2 has native `graphql.query()` support that parses operation names — our queries are already named.

### Task 3: Migrate `handlers.ts` to `graphql.query()`

**Files:**

- Modify: `src/mocks/handlers.ts`

- [ ] **Step 1: Rewrite handlers using MSW graphql namespace**

```typescript
import { graphql, http, HttpResponse } from "msw";

import {
  getValidPersonalAccessToken,
  MOCK_ORGANIZATIONS,
  MOCK_REPOS,
  MOCK_USER,
} from "@/mocks/static-fixtures";

const github = graphql.link("https://api.github.com/graphql");

export const handlers = [
  // --- GraphQL handlers (operation-name based) ---

  github.query("getCurrentUser", () => {
    return HttpResponse.json({
      data: { viewer: MOCK_USER },
    });
  }),

  github.query("getRepositories", () => {
    return HttpResponse.json({
      data: {
        user: {
          ...MOCK_USER,
          repositories: {
            nodes: MOCK_REPOS,
            pageInfo: { endCursor: null, hasNextPage: false },
          },
        },
      },
    });
  }),

  github.query("getOrganizations", () => {
    return HttpResponse.json({
      data: {
        user: {
          organizations: {
            nodes: MOCK_ORGANIZATIONS,
            pageInfo: { endCursor: null, hasNextPage: false },
          },
        },
      },
    });
  }),

  github.query("getOrgRepositories", () => {
    const orgRepos = MOCK_REPOS.filter((repo) => repo.isInOrganization);
    return HttpResponse.json({
      data: {
        organization: {
          login: "testorg",
          url: "https://github.com/testorg",
          repositories: {
            nodes: orgRepos,
            pageInfo: { endCursor: null, hasNextPage: false },
          },
        },
      },
    });
  }),

  // --- REST handlers ---

  http.patch("https://api.github.com/repos/:owner/:repo", () => {
    return HttpResponse.json({
      archived: true,
      message: "Repository archived successfully",
    });
  }),

  http.delete("https://api.github.com/repos/:owner/:repo", () => {
    return HttpResponse.json({ message: "Repository deleted successfully" });
  }),

  http.get("https://api.github.com/user", ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.includes(getValidPersonalAccessToken())) {
      return HttpResponse.json({ message: "Bad credentials" }, { status: 401 });
    }
    return HttpResponse.json(MOCK_USER);
  }),

  http.get("https://api.github.com/users/:username", ({ params }) => {
    const { username } = params;
    if (username === "testuser") {
      return HttpResponse.json(MOCK_USER);
    }
    return HttpResponse.json({ message: "Not Found" }, { status: 404 });
  }),
];
```

Key changes:

- `graphql.link()` scoped to GitHub's GraphQL endpoint
- Each query gets its own handler matched by operation name
- No string matching, no if/else chain
- REST handlers unchanged (they were fine)
- Removed auth check from GraphQL handlers — MSW is for unit tests where we control the token; auth validation is tested separately

- [ ] **Step 2: Run all unit tests**

Run: `npx vitest run`
Expected: All pass. If any fail, it means a query name doesn't match — check `github-api.ts` operation names vs handler names.

- [ ] **Step 3: Commit**

```bash
git add src/mocks/handlers.ts
git commit -m "refactor: migrate MSW handlers to operation-based graphql.query() matching"
```

---

### Task 4: Simplify story-handlers to compose from base handlers

Currently 6 handler sets copy-paste the same GraphQL dispatch logic. Refactor to compose from base building blocks.

**Files:**

- Modify: `src/mocks/story-handlers.ts`

- [ ] **Step 1: Rewrite story-handlers using graphql namespace + composition**

```typescript
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

function orgReposHandler(repos?: typeof MOCK_REPOS) {
  const orgRepos = repos ?? MOCK_REPOS.filter((r) => r.isInOrganization);
  return github.query("getOrgRepositories", () =>
    HttpResponse.json({
      data: {
        organization: {
          login: "testorg",
          url: "https://github.com/testorg",
          repositories: {
            nodes: orgRepos,
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
        description: `Repo ${i}`,
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
          url: "https://github.com/testorg",
          repositories: {
            nodes: orgRepos,
            pageInfo: { endCursor: null, hasNextPage: false },
          },
        },
      },
    });
  }),
];
```

Key improvements:

- Building-block functions eliminate all duplication
- Each handler set is ~5 lines of composition instead of ~40 lines of copy-paste
- Adding a new scenario = composing existing blocks
- Operation-based matching throughout

- [ ] **Step 2: Fix Storybook preview.tsx nested-array bug**

In `.storybook/preview.tsx`, change line 23 from:

```typescript
handlers: [handlers],
```

To:

```typescript
handlers: handlers,
```

- [ ] **Step 3: Run unit tests + build Storybook**

Run: `npx vitest run && npm run build-storybook`
Expected: Both pass.

- [ ] **Step 4: Commit**

```bash
git add src/mocks/story-handlers.ts .storybook/preview.tsx
git commit -m "refactor: composable story-handlers, fix Storybook nested-array bug"
```

---

### Task 5: Make E2E GraphQL mocks query-aware

**Files:**

- Modify: `e2e/utils/github-api-mocks.ts:96-137`

- [ ] **Step 1: Rewrite mockGraphQLRepos to handle each query type**

```typescript
export async function mockGraphQLRepos(page: Page): Promise<void> {
  await page.route("https://api.github.com/graphql", async (route) => {
    const body = (await route.request().postDataJSON()) as {
      query: string;
      variables?: Record<string, unknown>;
    };

    if (body.query.includes("getCurrentUser")) {
      return void route.fulfill({
        json: { data: { viewer: mockUser } },
      });
    }

    if (body.query.includes("getRepositories")) {
      return void route.fulfill({
        json: {
          data: {
            user: {
              ...mockUser,
              repositories: {
                nodes: mockRepos,
                pageInfo: { endCursor: null, hasNextPage: false },
              },
            },
          },
        },
      });
    }

    if (body.query.includes("getOrganizations")) {
      return void route.fulfill({
        json: {
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
        },
      });
    }

    if (body.query.includes("getOrgRepositories")) {
      const orgRepos = mockRepos.filter((r) => r.isInOrganization);
      return void route.fulfill({
        json: {
          data: {
            organization: {
              login: "testorg",
              url: "https://github.com/testorg",
              repositories: {
                nodes: orgRepos,
                pageInfo: { endCursor: null, hasNextPage: false },
              },
            },
          },
        },
      });
    }

    void route.fulfill({ json: { data: {} } });
  });
}
```

Note: E2E uses Playwright `page.route()`, not MSW — we can't use `graphql.query()` here. String matching with `return` guards is the right approach for Playwright route handlers.

- [ ] **Step 2: Apply same pattern to mockGraphQLReposEmpty**

```typescript
export async function mockGraphQLReposEmpty(page: Page): Promise<void> {
  await page.route("https://api.github.com/graphql", async (route) => {
    const body = (await route.request().postDataJSON()) as { query: string };

    if (body.query.includes("getCurrentUser")) {
      return void route.fulfill({ json: { data: { viewer: mockUser } } });
    }

    if (body.query.includes("getRepositories")) {
      return void route.fulfill({
        json: {
          data: {
            user: {
              ...mockUser,
              repositories: {
                nodes: [],
                pageInfo: { endCursor: null, hasNextPage: false },
              },
            },
          },
        },
      });
    }

    if (body.query.includes("getOrganizations")) {
      return void route.fulfill({
        json: {
          data: {
            user: {
              organizations: {
                nodes: [],
                pageInfo: { endCursor: null, hasNextPage: false },
              },
            },
          },
        },
      });
    }

    void route.fulfill({ json: { data: {} } });
  });
}
```

- [ ] **Step 3: Run E2E tests**

Run: `npx playwright test`
Expected: All pass.

- [ ] **Step 4: Commit**

```bash
git add e2e/utils/github-api-mocks.ts
git commit -m "fix: E2E GraphQL mocks now return correct shape per query type"
```

---

## Chunk 3: Integration Tests — The Missing Layer

This is the Testing Trophy's biggest layer and we have zero. These tests render real component trees with real context, real hooks, and MSW intercepting at the network boundary. No `vi.mock()` of child components.

### Task 6: Integration test — selection → confirmation modal flow

Tests that selecting repos and clicking archive/delete passes the correct repos to the modal, and that the modal renders them. No mocking of ConfirmationModal.

**Files:**

- Create: `src/components/repo-table/repo-table.integration.test.tsx`

- [ ] **Step 1: Write the integration test**

```tsx
import { type Repository } from "@octokit/graphql-schema";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  GitHubContext,
  type GitHubContextType,
} from "@/contexts/github-context";
import { createMockRepo } from "@/mocks/static-fixtures";
import { render } from "@/utils/test-utils";

import RepoTable from "./repo-table";

// NO vi.mock("./confirmation-modal") — we want the real component

const mockRepos: Repository[] = [
  createMockRepo({
    id: "repo-a",
    isArchived: false,
    name: "repo-alpha",
    viewerCanAdminister: true,
  }),
  createMockRepo({
    id: "repo-b",
    isArchived: false,
    name: "repo-beta",
    viewerCanAdminister: true,
  }),
  createMockRepo({
    id: "repo-c",
    isArchived: false,
    name: "repo-gamma",
    owner: { id: "org-1", login: "someorg", url: "https://github.com/someorg" },
    viewerCanAdminister: false,
  }),
];

// Context with a real PAT so ConfirmationModal can create an Octokit instance
const mockContext: GitHubContextType = {
  error: null,
  hasPartialData: false,
  isAuthenticated: true,
  isError: false,
  isInitialized: true,
  isLoading: false,
  login: "testuser",
  logout: vi.fn(),
  mutate: vi.fn(),
  pat: "ghp_abcdefghijklmnopqrstuvwxyz1234567890",
  progress: null,
  refetchData: vi.fn(),
  repos: mockRepos,
  setLogin: vi.fn(),
  setPat: vi.fn(),
  user: null,
};

function renderRepoTable() {
  return render(
    <GitHubContext.Provider value={mockContext}>
      <RepoTable login="testuser" repos={mockRepos} />
    </GitHubContext.Provider>,
  );
}

describe("RepoTable + ConfirmationModal Integration", () => {
  it("non-admin repos are not visible in the table", () => {
    renderRepoTable();

    expect(screen.getByText("repo-alpha")).toBeInTheDocument();
    expect(screen.getByText("repo-beta")).toBeInTheDocument();
    expect(screen.queryByText("repo-gamma")).not.toBeInTheDocument();
  });

  it("selecting a repo and clicking archive opens modal with correct repo", async () => {
    const user = userEvent.setup();
    renderRepoTable();

    // Select repo-alpha by clicking its checkbox
    const checkbox = screen.getByRole("checkbox", { name: /repo-alpha/i });
    await user.click(checkbox);

    // Click the archive button
    const archiveBtn = screen.getByTestId("repo-action-button-archive");
    await user.click(archiveBtn);

    // Modal should open and show repo-alpha in the confirmation list
    await waitFor(() => {
      expect(
        screen.getByTestId("confirmation-modal-header"),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/Confirm Archival/i)).toBeInTheDocument();
    expect(screen.getByText("repo-alpha")).toBeInTheDocument();
    // repo-gamma (non-admin) should NOT be in the modal
    const modalBody = screen.getByTestId("confirmation-modal-body");
    expect(modalBody).not.toHaveTextContent("repo-gamma");
  });

  it("confirm button is disabled until correct username is entered", async () => {
    const user = userEvent.setup();
    renderRepoTable();

    // Select and open modal
    await user.click(screen.getByRole("checkbox", { name: /repo-alpha/i }));
    await user.click(screen.getByTestId("repo-action-button-archive"));

    await waitFor(() => {
      expect(
        screen.getByTestId("confirmation-modal-confirm"),
      ).toBeInTheDocument();
    });

    const confirmBtn = screen.getByTestId("confirmation-modal-confirm");
    const input = screen.getByTestId("confirmation-modal-input");

    expect(confirmBtn).toBeDisabled();

    await user.type(input, "wronguser");
    expect(confirmBtn).toBeDisabled();

    await user.clear(input);
    await user.type(input, "testuser");
    expect(confirmBtn).toBeEnabled();
  });
});
```

- [ ] **Step 2: Run the integration test**

Run: `npx vitest run src/components/repo-table/repo-table.integration.test.tsx`
Expected: All pass. If ConfirmationModal throws due to missing providers, the `render` from `@/utils/test-utils` should handle it (wraps with providers).

Note: this test may need the `GitHubContext.Provider` wrapper to override the default from `test-utils` since ConfirmationModal reads `pat` from context.

- [ ] **Step 3: Commit**

```bash
git add src/components/repo-table/repo-table.integration.test.tsx
git commit -m "test: add integration tests for selection → confirmation modal flow"
```

---

### Task 7: Integration test — confirm → execute → result with MSW

The highest-stakes code: `handleConfirm()` loops through repos calling `processRepo()`. Test the full state machine transition with MSW catching the actual REST calls.

**Files:**

- Create: `src/components/repo-table/confirmation-modal.integration.test.tsx`

- [ ] **Step 1: Write integration test for archive flow**

```tsx
import { type Repository } from "@octokit/graphql-schema";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

import {
  GitHubContext,
  type GitHubContextType,
} from "@/contexts/github-context";
import { createMockRepo } from "@/mocks/static-fixtures";
import { render } from "@/utils/test-utils";

import ConfirmationModal from "./confirmation-modal";

// Track which repos were archived/deleted via MSW
const archivedRepos: string[] = [];
const deletedRepos: string[] = [];

const server = setupServer(
  http.patch("https://api.github.com/repos/:owner/:repo", ({ params }) => {
    archivedRepos.push(params.repo as string);
    return HttpResponse.json({ archived: true });
  }),
  http.delete("https://api.github.com/repos/:owner/:repo", ({ params }) => {
    deletedRepos.push(params.repo as string);
    return new HttpResponse(null, { status: 204 });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => {
  server.resetHandlers();
  archivedRepos.length = 0;
  deletedRepos.length = 0;
});
afterAll(() => server.close());

const testRepos: Repository[] = [
  createMockRepo({ id: "r1", name: "repo-one" }),
  createMockRepo({ id: "r2", name: "repo-two" }),
];

const mockContext: GitHubContextType = {
  error: null,
  hasPartialData: false,
  isAuthenticated: true,
  isError: false,
  isInitialized: true,
  isLoading: false,
  login: "testuser",
  logout: vi.fn(),
  mutate: vi.fn(),
  pat: "ghp_abcdefghijklmnopqrstuvwxyz1234567890",
  progress: null,
  refetchData: vi.fn(),
  repos: testRepos,
  setLogin: vi.fn(),
  setPat: vi.fn(),
  user: null,
};

const baseProps = {
  isOpen: true,
  login: "testuser",
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  repos: testRepos,
};

function renderModal(action: "archive" | "delete") {
  return render(
    <GitHubContext.Provider value={mockContext}>
      <ConfirmationModal {...baseProps} action={action} />
    </GitHubContext.Provider>,
  );
}

describe("ConfirmationModal Integration — Full Execution Flow", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("archive flow: confirmation → progress → result, actually calls API", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderModal("archive");

    // Confirmation mode
    expect(screen.getByText(/Confirm Archival/i)).toBeInTheDocument();
    expect(screen.getByText("repo-one")).toBeInTheDocument();
    expect(screen.getByText("repo-two")).toBeInTheDocument();

    // Type username and confirm
    const input = screen.getByTestId("confirmation-modal-input");
    await user.type(input, "testuser");

    const confirmBtn = screen.getByTestId("confirmation-modal-confirm");
    expect(confirmBtn).toBeEnabled();
    await user.click(confirmBtn);

    // Should transition to progress mode
    await waitFor(() => {
      expect(
        screen.getByTestId("confirmation-modal-progress"),
      ).toBeInTheDocument();
    });

    // Advance timers to complete processing (1s per repo + 3s minimum)
    await vi.advanceTimersByTimeAsync(10000);

    // Should transition to result mode
    await waitFor(() => {
      expect(
        screen.getByTestId("confirmation-modal-result"),
      ).toBeInTheDocument();
    });

    // Verify actual REST calls were made via MSW
    expect(archivedRepos).toContain("repo-one");
    expect(archivedRepos).toContain("repo-two");
    expect(deletedRepos).toHaveLength(0);

    // Result should show success
    expect(
      screen.getByText(/2 out of 2 repos archived successfully/i),
    ).toBeInTheDocument();
  });

  it("delete flow: confirmation → progress → result", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderModal("delete");

    expect(screen.getByText(/Confirm Deletion/i)).toBeInTheDocument();

    const input = screen.getByTestId("confirmation-modal-input");
    await user.type(input, "testuser");
    await user.click(screen.getByTestId("confirmation-modal-confirm"));

    await vi.advanceTimersByTimeAsync(10000);

    await waitFor(() => {
      expect(
        screen.getByTestId("confirmation-modal-result"),
      ).toBeInTheDocument();
    });

    expect(deletedRepos).toContain("repo-one");
    expect(deletedRepos).toContain("repo-two");
    expect(archivedRepos).toHaveLength(0);
  });

  it("handles partial failures — shows errors for failed repos", async () => {
    // Override handler: first repo fails, second succeeds
    server.use(
      http.patch("https://api.github.com/repos/:owner/repo-one", () => {
        return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
      }),
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderModal("archive");

    const input = screen.getByTestId("confirmation-modal-input");
    await user.type(input, "testuser");
    await user.click(screen.getByTestId("confirmation-modal-confirm"));

    await vi.advanceTimersByTimeAsync(10000);

    await waitFor(() => {
      expect(
        screen.getByTestId("confirmation-modal-result"),
      ).toBeInTheDocument();
    });

    // 1 success, 1 failure
    expect(
      screen.getByText(/1 out of 2 repos archived successfully/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 error occurred/i)).toBeInTheDocument();
  });

  it("double-click confirm does not process twice", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderModal("archive");

    const input = screen.getByTestId("confirmation-modal-input");
    await user.type(input, "testuser");

    const confirmBtn = screen.getByTestId("confirmation-modal-confirm");
    // Click twice rapidly
    await user.click(confirmBtn);
    await user.click(confirmBtn);

    await vi.advanceTimersByTimeAsync(10000);

    await waitFor(() => {
      expect(
        screen.getByTestId("confirmation-modal-result"),
      ).toBeInTheDocument();
    });

    // Should only have archived each repo once
    expect(archivedRepos.filter((r) => r === "repo-one")).toHaveLength(1);
    expect(archivedRepos.filter((r) => r === "repo-two")).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run integration test**

Run: `npx vitest run src/components/repo-table/confirmation-modal.integration.test.tsx`
Expected: All pass. This test exercises the real `handleConfirm` → `processRepo` → `archiveRepo`/`deleteRepo` → Octokit REST call → MSW intercept chain.

Note: The fake timers + `shouldAdvanceTime: true` + `advanceTimersByTimeAsync` pattern is needed because `handleConfirm` uses `setTimeout` for minimum display times. If tests hang, adjust the timer advancement.

- [ ] **Step 3: Commit**

```bash
git add src/components/repo-table/confirmation-modal.integration.test.tsx
git commit -m "test: integration tests for confirm→execute→result flow with MSW"
```

---

## Chunk 4: E2E Gap Fill + Cleanup

### Task 8: Add E2E delete flow test

The irreversible delete action has zero E2E coverage. Add one focused test.

**Files:**

- Modify: `e2e/dashboard.spec.ts`

- [ ] **Step 1: Add delete flow E2E test**

Add `mockDeleteRepo` to the imports and add inside the Confirmation Modal describe:

```typescript
import { mockArchiveRepo, mockDeleteRepo } from "@e2e/utils/github-api-mocks";

// ... inside Confirmation Modal describe block:

test("should handle delete flow end-to-end", async () => {
  await dashboard.selectDeleteAction();
  await dashboard.deleteButton.click();

  await dashboard.expectModalInMode("confirmation");
  await dashboard.expectModalTitle(/Confirm Deletion/i);
  await dashboard.expectText(/I understand the consequences, delete/i);

  await mockDeleteRepo(dashboard.page, "repo-1");
  await dashboard.confirmAction("testuser");

  await dashboard.expectModalInMode("progress");
  await expect(dashboard.progressModalHeader).toContainText(
    /Deleting Repositories/i,
  );

  await dashboard.expectModalInMode("result");
  await expect(dashboard.resultModalHeader).toContainText(/Deletion Complete/i);
  await dashboard.expectSuccessMessage("deleted");
});
```

- [ ] **Step 2: Run E2E tests**

Run: `npx playwright test e2e/dashboard.spec.ts`
Expected: All pass.

- [ ] **Step 3: Commit**

```bash
git add e2e/dashboard.spec.ts
git commit -m "test: add E2E coverage for irreversible delete flow"
```

---

### Task 9: Fix unit test imports to use `@/utils/test-utils`

Five test files bypass the custom render. Fix them to use the existing `@/utils/test-utils`.

**Files:**

- Modify: `src/components/repo-table/confirmation-modal.test.tsx` — change import
- Modify: `src/components/repo-table/repo-table.test.tsx` — change import, remove `vi.mock("./confirmation-modal")`
- Modify: `src/components/dashboard.test.tsx` — change import
- Modify: `src/components/github-token-form.test.tsx` — change import
- Modify: `src/components/repo-table/repo-filters.test.tsx` — change import

- [ ] **Step 1: Update imports in each file**

In each file, change:

```typescript
import { render, screen } from "@testing-library/react";
```

To:

```typescript
import { render, screen } from "@/utils/test-utils";
```

For `repo-table.test.tsx`, also remove the `vi.mock("./confirmation-modal")` and the `vi.mock("@heroui/react", ...)` since the integration test (Task 6) now covers that path properly. If the existing unit test breaks without the mock, wrap the render in `GitHubContext.Provider` with a mock value (same pattern as the integration test).

- [ ] **Step 2: Run all unit tests**

Run: `npx vitest run`
Expected: All pass. Some tests may need provider wrapping adjustments.

- [ ] **Step 3: Commit**

```bash
git add src/components/repo-table/confirmation-modal.test.tsx \
  src/components/repo-table/repo-table.test.tsx \
  src/components/dashboard.test.tsx \
  src/components/github-token-form.test.tsx \
  src/components/repo-table/repo-filters.test.tsx
git commit -m "refactor: fix test imports to use @/utils/test-utils custom render"
```

---

## Summary

| Task                                  | Type         | Layer           | What it proves                                        |
| ------------------------------------- | ------------ | --------------- | ----------------------------------------------------- |
| 1. Fix select-all bug                 | Code fix     | —               | Users can't accidentally act on hidden repos          |
| 2. Fix E2E mock bugs                  | Infra fix    | E2E             | Tests don't silently double-fulfill or miss org repos |
| 3. MSW graphql.query()                | Infra fix    | Unit            | No more false-match risk in mock handlers             |
| 4. Composable story-handlers          | Infra fix    | Storybook       | DRY handlers, fix nested-array bug                    |
| 5. Query-aware E2E mocks              | Infra fix    | E2E             | E2E tests the real multi-query fetch sequence         |
| 6. Selection→modal integration        | **New test** | **Integration** | Selecting repos passes correct list to modal          |
| 7. Confirm→execute→result integration | **New test** | **Integration** | The highest-stakes code actually works                |
| 8. E2E delete flow                    | New test     | E2E             | Irreversible action has coverage                      |
| 9. Fix test imports                   | Cleanup      | Unit            | All tests use providers correctly                     |

**Testing Trophy distribution after this work:**

- Static: TypeScript strict + ESLint (unchanged, solid)
- Unit: Pure logic hooks, token validation, utilities (unchanged, solid)
- **Integration: Selection→modal, confirm→execute→result, error handling (NEW)**
- E2E: Critical paths — auth, archive, delete, pagination (trimmed to essentials)
