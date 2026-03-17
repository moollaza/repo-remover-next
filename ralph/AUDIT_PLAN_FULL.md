# Pre-Launch Audit Plan

> This file is populated by the review loop (`ralph/PROMPT_review.md`).
> Each finding has a unique ID, severity, and checkbox for completion tracking.
> The build loop (`ralph/PROMPT_build.md`) works through items by priority.

## Summary

- Total findings: 179
- Completed: 0
- Remaining: 179

---

## `src/utils/github-api.ts` — reviewed 2026-03-16

### Bugs

- [x] **[BUG-001] severity:high** — `permissionWarning` returned from both functions but absent from `FetchResult` interface
  - File: `src/utils/github-api.ts:195-199` (interface) / `:391-396` and `:650-655` (return sites)
  - Impact: Callers typed as `FetchResult` silently drop the permission warning string; the UI warning path may never fire because the data is structurally invisible to TypeScript consumers
  - Fix: Add `permissionWarning?: string` to the `FetchResult` interface

- [ ] **[BUG-002] severity:medium** — `fetchGitHubData` is exported but never imported — dead code
  - File: `src/utils/github-api.ts:206-408`
  - Impact: ~200 lines of maintenance burden; any bug fixes to `fetchGitHubDataWithProgress` must be mirrored manually (and likely won't be)
  - Fix: Delete the function entirely; callers should use `fetchGitHubDataWithProgress` with a no-op callback if progress isn't needed

- [ ] **[BUG-003] severity:medium** — Divergent error handling in `fetchAllOrganizations` between the two implementations
  - File: `src/utils/github-api.ts:255-271` (fetchGitHubData version, swallows all non-scope errors silently) vs `:460-469` (fetchGitHubDataWithProgress version, re-throws all Error instances)
  - Impact: Behavioural inconsistency — network timeouts or 500s during org fetch: dead version silently continues with 0 orgs; live version re-throws to outer handler and surfaces a user-visible warning
  - Fix: Moot if BUG-002 is fixed. Otherwise, align both to the same policy.

- [ ] **[BUG-004] severity:low** — 14 raw `console.error/warn/log` calls instead of the `debug` utility
  - File: `src/utils/github-api.ts` lines 249, 256, 307, 314, 321, 372, 398, 454, 461, 499, 506, 512, 601, 657, 703, 706
  - Impact: In production, error details (including potential API response snippets) leak to browser DevTools; violates `security.md` ("Do NOT add console.log in production — use `debug` utility"). Line 706 specifically logs a raw `GraphqlResponseError.message`.
  - Fix: Replace all `console.*` calls with `debug.log()` / `debug.warn()` / `debug.error()` from `@/utils/debug`

### Simplification

- [ ] **[SIMP-001] severity:medium** — ~350 lines duplicated between `fetchGitHubData` and `fetchGitHubDataWithProgress`
  - File: `src/utils/github-api.ts:206-667`
  - Detail: Both functions define identical `fetchAllOrganizations`, `fetchAllOrgRepos`, and `fetchUserRepos` inner functions, plus nearly identical outer orchestration. The only difference is that the progress version calls `onProgress()` at key points.
  - Fix: Delete `fetchGitHubData` (see BUG-002); if a no-progress variant is ever needed, implement it as a thin wrapper over `fetchGitHubDataWithProgress` with a no-op callback

### Testing Gaps

- [ ] **[TEST-001] severity:high** — No unit tests exist for `src/utils/github-api.ts`
  - What to test: happy path (`fetchGitHubDataWithProgress` with mocked Octokit returning personal repos + org repos), progress callback sequence (personal → orgs → complete stages), empty org list, PAT missing guard, user login resolution via `GET_CURRENT_USER`
  - Test type: unit (mock Octokit graphql responses via MSW or direct mock)

- [ ] **[TEST-002] severity:high** — `fetchRepositories` GraphQL partial response path completely untested
  - File: `src/utils/github-api.ts:704-735`
  - What to test: When GitHub returns a `GraphqlResponseError` (e.g. SAML enforcement), the function should return partial repos from `error.data.user.repositories.nodes` and partial `userData`; verify partial data is not `null`
  - Test type: unit (throw a `GraphqlResponseError` from Octokit mock)

- [ ] **[TEST-003] severity:medium** — Org permission and SAML error handling paths untested
  - File: `src/utils/github-api.ts:576-604`
  - What to test: `required scopes` error → `permissionWarning` includes 'read:org' message; `SAML enforcement` error → `permissionWarning` includes SSO message; unknown error → generic "temporary issue" warning; verify personal repos are still returned despite org fetch failure
  - Test type: unit

- [ ] **[TEST-004] severity:medium** — `onProgress` callback sequence and parallelism untested
  - File: `src/utils/github-api.ts:562-644`
  - What to test: Progress fires with `stage: "personal"` before org fetches begin; fires with `stage: "orgs"` for each completed org; fires with `stage: "complete"` at end with full repo list; `orgsLoaded` increments correctly across parallel org fetches
  - Test type: unit

---

## `src/utils/github-utils.ts` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-005] severity:medium** — `isValidGitHubToken` minimum length for `github_pat_` tokens is far too permissive
  - File: `src/utils/github-utils.ts:84`
  - Impact: `token.length >= 40` means the prefix (11 chars) + only 29 chars of payload passes. Real fine-grained PATs are 80–120 chars. A synthetically short `github_pat_abcdefghijklmnopqrstuvwxyzabc` (40 chars total) would pass client-side validation and confusingly return a 401 from GitHub — making the user think their valid-looking token is wrong.
  - Fix: Raise the minimum: `token.length >= 72` (GitHub's documented minimum for fine-grained PATs) or `token.length >= 50` as a conservative safe floor.

- [ ] **[BUG-006] severity:low** — `processRepo` contains three dead runtime guards that TypeScript already prevents
  - File: `src/utils/github-utils.ts:144-154`
  - Impact: `!octokit`, `!repo`, `!action` can never be true — `action` is typed `"archive" | "delete"` (always truthy), and the other two are non-nullable. The `!action` branch is structurally unreachable dead code; it also masks the exhaustiveness of the `if/else if` chain below, making a future reader wonder why there's no `else` clause.
  - Fix: Remove the three guards; TypeScript already enforces non-null at call sites. If runtime safety is desired, use `if (process.env.NODE_ENV !== "production") throw ...` assertions.

- [ ] **[BUG-007] severity:low** — `generateRepos` delays 500ms after the last repo creation (wasted time)
  - File: `src/utils/github-utils.ts:66`
  - Impact: For N repos the total delay is N × 500ms; the 500ms after the final iteration serves no throttling purpose.
  - Fix: Move the `setTimeout` to the start of the loop body (skip on first iteration), or break early after the last iteration.

### Simplification

- [ ] **[SIMP-002] severity:low** — `processRepo` `if/else if` without `else` is needlessly open-ended
  - File: `src/utils/github-utils.ts:158-166`
  - Detail: `action` is a union of two literals; removing the dead guards (BUG-006) makes the exhaustive `if/else` pattern clearer. Use `if (action === "archive") { ... } else { ... }` so the compiler flags any future third action that doesn't have a branch.

### Testing Gaps

- [ ] **[TEST-005] severity:high** — `createThrottledOctokit` is completely untested
  - File: `src/utils/github-utils.ts:174-197`
  - What to test: Returns an Octokit instance; `onRateLimit` returns `true` on first retry (retryCount=0) and `false` on second (retryCount=1); `onSecondaryRateLimit` always returns `false`; created instance uses the provided token as `auth`
  - Test type: unit (spy on ThrottledOctokit constructor or pass a mock throttle handler)

- [ ] **[TEST-006] severity:medium** — `processRepo` analytics calls are untested
  - File: `src/utils/github-utils.ts:161-165`
  - What to test: `analytics.trackRepoArchived()` called once after successful archive; `analytics.trackRepoDeleted()` called once after successful delete; neither is called if the API throws
  - Test type: unit (mock `analytics` module)

- [ ] **[TEST-007] severity:medium** — `isValidGitHubToken` does not cover the underscore-only `github_pat_` edge case
  - File: `src/utils/github-utils.ts:83-85`
  - What to test: `"github_pat_" + "_".repeat(29)` (40 chars, all underscores after prefix) currently returns `true` but should return `false` — underscore-only payloads are not real GitHub tokens
  - Test type: unit

- [ ] **[TEST-008] severity:low** — `generateRepos` timer test only checks call count, not rate-limit spacing
  - File: `src/utils/github-utils.ts:57-73`
  - What to test: Each repo creation is separated by ~500ms; `setLoading(false)` is always called even when the error occurs mid-loop (already covered) and also when `numberOfRepos = 0` (empty loop — not tested)
  - Test type: unit

---

## `src/providers/github-data-provider.tsx` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-008] severity:low** — 8 raw `console.*` calls instead of the `debug` utility
  - File: `src/providers/github-data-provider.tsx` lines 66, 120, 125, 161, 169, 176, 182, 199, 212
  - Impact: Violates `security.md` ("Do NOT add console.log in production — use `debug` utility"). Line 120 (`console.error("GitHub API error:", err)`) is the most dangerous — SWR errors can include response bodies that may contain token fragments in error messages.
  - Fix: Replace all `console.*` calls with `debug.log()` / `debug.warn()` / `debug.error()` from `@/utils/debug`

- [ ] **[BUG-009] severity:medium** — `logout` wraps async `removeItem` calls in a synchronous try/catch — rejection is unhandled
  - File: `src/providers/github-data-provider.tsx:194-201`
  - Impact: `secureStorage.removeItem` returns a Promise. The try/catch block only catches synchronous throws; async rejections are silently swallowed. If storage clearing fails after logout (e.g., IndexedDB lock), the old PAT stays in encrypted storage — user thinks they logged out but token persists across browser restarts.
  - Fix: Either `await` both calls (make `logout` async or use `.catch()`) or convert to `.catch((err) => debug.warn(...))` pattern used elsewhere in this file (e.g., lines 167-170)

- [ ] **[BUG-010] severity:low** — `setPat(remember=false)` `removeItem` calls silently drop errors
  - File: `src/providers/github-data-provider.tsx:185-188`
  - Impact: Same class as BUG-009 — `secureStorage.removeItem` is called fire-and-forget with no `.catch()`. Failed clearing goes unnoticed.
  - Fix: Add `.catch()` or `await` on both calls, same as the `.catch()` pattern used for `setItem` calls at lines 167 and 181.

### Simplification

- [ ] **[SIMP-003] severity:low** — `useLayoutEffect` is semantically wrong for async storage hydration; empty cleanup body is dead code
  - File: `src/providers/github-data-provider.tsx:56-78`
  - Detail: The callback is `async` — `useLayoutEffect` fires before browser paint but the async part (storage read) resolves asynchronously regardless. The timing guarantee of `useLayoutEffect` is lost entirely. `useEffect` is the correct hook here. Additionally, the cleanup body (lines 74-77) is an empty function with a comment — pure dead code.
  - Fix: Replace `useLayoutEffect` with `useEffect`; remove the empty cleanup return entirely.

- [ ] **[SIMP-004] severity:low** — `typeof window !== "undefined"` guards are unnecessary in a Vite SPA
  - File: `src/providers/github-data-provider.tsx:166, 180, 184, 194`
  - Detail: This is a client-side-only Vite app — `window` is always defined. The guards are SSR boilerplate that adds noise.
  - Fix: Remove all four `typeof window !== "undefined"` checks.

### Testing Gaps

- [ ] **[TEST-009] severity:medium** — `setPat(remember=false)` behavior is untested
  - File: `src/providers/github-data-provider.tsx:173-189`
  - What to test: Calling `setPat(token, false)` should NOT write PAT to storage; should ALSO clear any previously stored login from storage (lines 186-187 — the double-clear side-effect is surprising and important to document via test)
  - Test type: unit

- [ ] **[TEST-010] severity:medium** — `refetchData` 5-second rate limiting is untested
  - File: `src/providers/github-data-provider.tsx:205-213`
  - What to test: First call triggers `mutate()`; second call within 5s is silently ignored (no error thrown, no return value); call after 5s triggers `mutate()` again
  - Test type: unit (use `vi.useFakeTimers()`)

- [ ] **[TEST-011] severity:medium** — `permissionWarning` context exposure is untested
  - File: `src/providers/github-data-provider.tsx:244`
  - What to test: When `fetchGitHubDataWithProgress` resolves with a `permissionWarning` string, the context value exposes it via `context.permissionWarning`; when no warning, `context.permissionWarning` is `undefined`
  - Test type: unit (mock `fetchGitHubDataWithProgress` to return `{ permissionWarning: "token lacks read:org" }`)

- [ ] **[TEST-012] severity:medium** — `isLoading` state machine is untested
  - File: `src/providers/github-data-provider.tsx:143`
  - What to test: `isLoading=true` when authenticated + no data yet; `isLoading=true` when `progress !== null` even if data exists (progressive loading); `isLoading=false` once data arrives and progress cleared; `isLoading=false` immediately after logout
  - Test type: unit

- [ ] **[TEST-013] severity:low** — SWR `onError` 401/auth detection path is untested
  - File: `src/providers/github-data-provider.tsx:119-127`
  - What to test: When SWR error message contains "401", the `console.warn` fires (currently no auto-logout happens — but the check at line 124 is a future auto-logout hook; a regression test ensures any future change to that code path is intentional)
  - Test type: unit (mock `fetchGitHubDataWithProgress` to throw an Error with "401" in message)

---

## `src/hooks/use-confirmation-modal.ts` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-011] severity:medium** — `octokit` not memoized — new `ThrottledOctokit` instance per render
  - File: `src/hooks/use-confirmation-modal.ts:78`
  - Impact: Every `dispatch` call during processing (one per repo + error events) triggers a re-render that constructs a new `ThrottledOctokit`, discarding its internal rate-limit counter state. The running `handleConfirm` loop is unaffected (it captured the original instance), but ~10–20 wasted constructions per batch. On a second modal open, the user gets a fresh rate-limit window, potentially masking 429s.
  - Fix: `const octokit = useMemo(() => pat ? createThrottledOctokit(pat) : null, [pat]);`

- [ ] **[BUG-012] severity:medium** — Stale-closure double-submit: confirm button not disabled during `state.confirming`
  - File: `src/hooks/use-confirmation-modal.ts:87` / `src/components/repo-table/confirmation-modal.tsx:227`
  - Impact: The guard `if (!octokit || state.confirming) return` reads render-time state. If the user double-clicks the confirm button before React re-renders to unmount it (mode switches to "progress"), both clicks see `state.confirming = false` and spawn two parallel processing loops, archiving/deleting each repo twice.
  - Fix: Add `disabled={!isCorrectUsername || state.confirming}` to the confirm button, or use a `useRef` flag set synchronously before the first `dispatch`

- [ ] **[BUG-013] severity:low** — `handleOnClose` always calls `mutate()`, even on cancel before any processing
  - File: `src/hooks/use-confirmation-modal.ts:157-165`
  - Impact: Canceling on the confirmation screen (no repos touched) unconditionally fires a full SWR refetch — an expensive GitHub API call for no reason. On slow connections or when near rate limits, this wastes quota.
  - Fix: Guard with `if (state.mode === "result") void mutate();` — only refetch after operations actually ran

- [ ] **[BUG-014] severity:low** — `isOpen` declared in `UseConfirmationModalOptions` but never used by the hook
  - File: `src/hooks/use-confirmation-modal.ts:35, 65-71`
  - Impact: Misleading API — callers believe `isOpen` affects hook behavior (e.g., might assume Octokit isn't constructed when closed). In reality `createThrottledOctokit(pat)` runs on every render regardless. Any future reader adding early-return logic conditioned on `isOpen` will be surprised.
  - Fix: Remove `isOpen` from `UseConfirmationModalOptions`; the component already guards `if (!isOpen) return null` before rendering the hook's output

### Simplification

- [ ] **[SIMP-005] severity:low** — `handleSetUsername` functional updater is overcomplicated for a plain text input
  - File: `src/hooks/use-confirmation-modal.ts:167-180`
  - Detail: The `React.Dispatch<React.SetStateAction<string>>` signature + updater branch adds ~10 lines for a case that never occurs in the single caller (which always passes `e.target.value` directly). Worse, the functional updater path uses render-time `state.username` as "prev state" — stale if called multiple times before a re-render. A simple `(value: string) => void` type would be correct and half the code.

- [ ] **[SIMP-006] severity:low** — `handleConfirm` wrapped in anonymous arrow on every render
  - File: `src/hooks/use-confirmation-modal.ts:186`
  - Detail: `handleConfirm: () => void handleConfirm()` creates a new function reference on every render. If passed to any `memo`-wrapped child, it invalidates memoization on every dispatch during the progress loop. Should be wrapped with `useCallback` or inlined as a `useCallback`.

### Testing Gaps

- [ ] **[TEST-014] severity:high** — `handleStop` mid-batch abort is completely untested
  - File: `src/hooks/use-confirmation-modal.ts:148-150` (handleStop) / `:103` (abortRef check)
  - What to test: Clicking "Stop" mid-loop sets `abortRef.current = true`; the loop breaks after the current repo finishes; remaining repos are not processed; state still transitions to "result" with partial counts
  - Test type: integration (fake timers + MSW; advance timers partway then call stop)

- [ ] **[TEST-015] severity:high** — 401 early-stop path is untested
  - File: `src/hooks/use-confirmation-modal.ts:117-122`
  - What to test: When the first repo returns a 401, the `break` fires immediately; subsequent repos are NOT processed (distinct from 403 which records an error and continues); the error list contains exactly one entry; result shows 1 error, not N
  - Test type: integration (MSW returning 401 on the archive/delete endpoint)

- [ ] **[TEST-016] severity:medium** — Analytics events at submission are untested
  - File: `src/hooks/use-confirmation-modal.ts:93-97`
  - What to test: `analytics.trackArchiveActionSubmitted(repos.length)` fires once on archive confirm; `analytics.trackDeleteActionSubmitted(repos.length)` fires once on delete confirm; neither fires if `!octokit` guard triggers early return
  - Test type: unit (mock `analytics` module)

- [ ] **[TEST-017] severity:medium** — `handleOnClose` behavior on cancel vs post-result is untested
  - File: `src/hooks/use-confirmation-modal.ts:157-165`
  - What to test: `mutate()` is called when closing from confirmation screen (cancel, no repos processed) — this is the current behavior and it may be unintentional (see BUG-013); `onClose()` is always called; `RESET` dispatched resets state to `initialState`
  - Test type: unit

---

## `src/hooks/use-repo-selection.ts` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-015] severity:medium** — Action change leaves stale disabled repos in `selectedRepoKeys`
  - File: `src/hooks/use-repo-selection.ts:106-111` (`handleRepoActionChange`)
  - Impact: User can select archived repos while "delete" action is active, then switch back to "archive" action. The archived repo IDs remain in `selectedRepoKeys` — `selectedRepos` (line 103) still includes them and they are passed to the confirmation modal and processed. GitHub will receive a redundant archive request for an already-archived repo, potentially causing errors or silent waste.
  - Fix: In `handleRepoActionChange`, after updating `selectedRepoAction`, also call `setSelectedRepoKeys` to remove IDs of repos that would now be disabled under the new action.

### Simplification

- [ ] **[SIMP-007] severity:low** — Dead `"all"` string sentinel branches throughout the hook
  - File: `src/hooks/use-repo-selection.ts:100, 139, 164`
  - Detail: `Selection = Set<string> | "all"`, but `selectedRepoKeys` is only ever set via `handleSelectAll` (always a `Set<string>`) and `handleRowSelect` (always a `Set<string>`). The `=== "all"` guard in `selectedRepos` (returns all filteredRepos including disabled ones — wrong), in `allSelectableSelected` (returns `true`), and the `prev === "all"` expansion in `handleRowSelect` are all unreachable. They add noise and the `selectedRepos` branch would include disabled repos if somehow triggered.
  - Fix: Remove the `"all"` branches and narrow the state type to `Set<string>`, or add a comment documenting why `"all"` is a no-op and will never be set.

### Testing Gaps

- [ ] **[TEST-018] severity:high** — Stale selection after action change is untested
  - File: `src/hooks/use-repo-selection.ts:106-111`
  - What to test: Switch to "delete" action, select an archived repo (now enabled), switch back to "archive" action — `selectedRepos` should NOT include the archived repo; `disabledKeys` should include it; `allSelectableSelected` should reflect the corrected selection
  - Test type: unit

- [ ] **[TEST-019] severity:medium** — `filteredRepos` change after selection is untested
  - File: `src/hooks/use-repo-selection.ts:99-104`
  - What to test: Select repo A, then re-render the hook with `filteredRepos` that no longer includes repo A (e.g. user applied a filter) — `selectedRepos` should be empty even though `selectedRepoKeys` still contains repo A's ID; `allSelectableSelected` should reflect no selection
  - Test type: unit (re-render hook via `rerender` from `renderHook`)

- [ ] **[TEST-020] severity:low** — `allSelectableSelected` when all repos are disabled is not explicitly tested
  - File: `src/hooks/use-repo-selection.ts:138-142`
  - What to test: When all `paginatedRepos` are locked (all disabled → `selectableRepos.length === 0`), `allSelectableSelected` should return `false` regardless of `selectedRepoKeys`; clicking select-all in this state should not select anything
  - Test type: unit

---

## `src/hooks/use-repo-filters.ts` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-016] severity:medium** — `setTypeFilters` unsafely casts `"all"` to `SelectionSet` — runtime crash if HeroUI emits `"all"`
  - File: `src/hooks/use-repo-filters.ts:107`
  - Impact: HeroUI selection components emit the string `"all"` when the user selects all items via a "select all" control. If that signal reaches `setTypeFilters`, `typeFilters` is set to the string `"all"`. On the next render, `typeFilters.has(type.key)` throws `TypeError: typeFilters.has is not a function`, crashing the filter view.
  - Fix: Guard against `"all"` in `setTypeFilters`: if `keys === "all"` set the full key set `new Set(REPO_TYPES.map(t => t.key))`; otherwise cast normally.

### Simplification

- [ ] **[SIMP-008] severity:low** — `if (!repos) return []` guard is dead code
  - File: `src/hooks/use-repo-filters.ts:112`
  - Detail: TypeScript types `repos: RepositoryWithKey[]` (non-nullable), so the `!repos` check can never be true. An empty array is the correct way to signal no repos and is already handled by the filter returning `[]`. Remove the guard.

### Testing Gaps

- [ ] **[TEST-021] severity:medium** — `login: null` case is untested
  - File: `src/hooks/use-repo-filters.ts:116-117`
  - What to test: When `login` is `null`, `repo.owner.login === null` is always false; repos are only shown if `viewerCanAdminister` is true. Verify that a repo with `viewerCanAdminister: false` is hidden when `login` is null, and one with `viewerCanAdminister: true` is shown.
  - Test type: unit

- [ ] **[TEST-022] severity:medium** — `isSource` type filter is untested
  - File: `src/hooks/use-repo-filters.ts:127-133`
  - What to test: Source repo (not fork, not mirror, not template) is shown when `isSource` is in `typeFilters`; same repo is hidden when `isSource` is deselected (removed from the set); a fork is never hidden by the `isSource` filter regardless of selection state (it has its own `isFork` filter).
  - Test type: unit

- [ ] **[TEST-023] severity:low** — `setTypeFilters("all")` crash path untested (see BUG-016)
  - File: `src/hooks/use-repo-filters.ts:107`
  - What to test: Calling `setTypeFilters("all")` should not throw; all repos should be visible afterward (equivalent to selecting all type filters)
  - Test type: unit

---

## `src/hooks/use-repo-pagination.ts` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-017] severity:medium** — Internal `currentPage` state diverges from `effectivePage` — stale page resurfaces when items expand after clamping
  - File: `src/hooks/use-repo-pagination.ts:79-80`
  - Impact: User navigates to page 4 (20 items), applies a filter that reduces to 5 items (`totalPages=1`). The hook returns `currentPage: 1` (clamped). User removes the filter (20 items, `totalPages=4`). Internal `currentPage` was never cleared — `effectivePage` unclamped back to 4, silently jumping the user to page 4 instead of staying at page 1. No pagination button was clicked; the jump is invisible and unexpected.
  - Fix: Sync the actual state via `useEffect`: when `totalPages > 0 && currentPage > totalPages`, call `setCurrentPage(1)` to permanently reset the state, eliminating the divergence.

- [ ] **[BUG-018] severity:low** — `setPerPage` with empty Set or `"all"` produces `NaN`, silently breaking pagination
  - File: `src/hooks/use-repo-pagination.ts:92`
  - Impact: `Array.from(new Set())[0]` is `undefined`; `Number(undefined)` is `NaN`. `setPerPageState(NaN)` causes `Math.ceil(n / NaN) = NaN` total pages and `items.slice(NaN, NaN) = []`, showing an empty list with no recoverable UI. If `keys === "all"`, `Array.from("all") = ["a","l","l"]` and `Number("a") = NaN`. Same crash.
  - Fix: Validate before setting: `const n = Number(Array.from(keys as Set<string>)[0]); if (Number.isFinite(n) && n > 0) setPerPageState(n);`

### Testing Gaps

- [ ] **[TEST-024] severity:medium** — Page state divergence after clamp-then-expand is untested (see BUG-017)
  - File: `src/hooks/use-repo-pagination.ts:79-80`
  - What to test: Navigate to page 4 (20 items), re-render with 5 items (clamp to page 1), re-render with 20 items again — `currentPage` should remain 1, not silently jump back to 4
  - Test type: unit (use `rerender` from `renderHook`)

- [ ] **[TEST-025] severity:low** — Out-of-bounds `setCurrentPage` calls are untested
  - File: `src/hooks/use-repo-pagination.ts:71`
  - What to test: `setCurrentPage(0)` and `setCurrentPage(-1)` produce `paginatedItems: []` (silent empty page, no crash); `setCurrentPage(100)` on a 3-page list also produces empty results. Document whether these are accepted or need guarding.
  - Test type: unit

---

## `src/utils/secure-storage.ts` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-019] severity:low** — 5 raw `console.*` calls instead of the `debug` utility
  - File: `src/utils/secure-storage.ts:36, 95, 158, 182, 193`
  - Impact: Violates `security.md` ("Do NOT add console.log in production — use `debug` utility"). Line 36 logs the raw decryption error object; line 95 logs the encryption error. In production these appear in DevTools for any observer.
  - Fix: Replace all `console.*` with `debug.warn()` / `debug.error()` from `@/utils/debug`

- [ ] **[BUG-020] severity:high** — `setItem` silently falls back to plaintext storage when encryption fails
  - File: `src/utils/secure-storage.ts:192-195`
  - Impact: If `encryptData` throws (e.g., transient Web Crypto failure, memory pressure), the catch block writes the GitHub PAT **in cleartext** to localStorage with only a `console.warn`. All security guarantees are silently lost — the user believes their token is encrypted but it is not. On next load `getItem` tries to decrypt a plaintext string, fails, and returns the raw string (see BUG-022), accidentally working but only because of the fallback-on-failure in `getItem`.
  - Fix: Do not fall back to plaintext; re-throw the error and surface it to the user with a clear message that storage failed.

- [ ] **[BUG-021] severity:high** — `navigator.userAgent` in the fingerprint changes on every browser auto-update, silently invalidating all stored tokens
  - File: `src/utils/secure-storage.ts:117`
  - Impact: `navigator.userAgent` includes the browser version string (e.g., `Chrome/132.0.6834.110`). Major browsers auto-update every 4–6 weeks. After any browser update the fingerprint changes, PBKDF2 derives a different key, AES-GCM decryption of the stored blob fails, and `getItem` falls through to returning the raw base64 ciphertext (see BUG-022). The user's session appears broken with no explanation — they see an invalid-token error even though they stored a valid one. The comment at lines 111–113 explicitly flags screen dimensions as unstable but misses the equally unstable `userAgent`.
  - Fix: Replace `navigator.userAgent` with a stable signal (e.g., `navigator.platform`, `navigator.hardwareConcurrency`, or a persisted random device ID stored separately in localStorage unencrypted). Or accept that the fingerprint is a convenience, not a security control, and document the known auto-logout risk clearly.

- [ ] **[BUG-022] severity:medium** — `getItem` returns raw base64 ciphertext when decryption fails, not `null`
  - File: `src/utils/secure-storage.ts:157-159`
  - Impact: When decryption fails (wrong key after browser update, corrupted data), the catch block returns `stored` — the raw base64-encoded AES-GCM ciphertext — to the caller as if it were the plaintext value. `github-data-provider.tsx` then uses this garbage string as a GitHub PAT, which is rejected with 401. The user sees an "invalid token" error with no path to recovery other than manually clearing localStorage. The correct behavior is to return `null` (treat corrupted storage as absent) or throw.
  - Fix: Change the fallback to `return null` after logging, and clear the corrupted key: `localStorage.removeItem(STORAGE_KEY_PREFIX + key);`

### Simplification

- [ ] **[SIMP-009] severity:low** — Double-logging on crypto failure: inner function logs AND re-throws, outer function catches and logs again
  - File: `src/utils/secure-storage.ts:35-38` (decryptData) + `:157-159` (getItem); `:94-97` (encryptData) + `:192-194` (setItem)
  - Detail: `decryptData` calls `console.error(...)` then `throw new Error(...)`. `getItem` catches that re-thrown error and calls `console.warn(...)` again. Every decryption failure generates two separate console entries. Same pattern in `encryptData` → `setItem`. Either remove logging from the inner helpers and let callers log, or remove the outer catches.

- [ ] **[SIMP-010] severity:low** — Verbose `String.fromCharCode.apply(null, Array.from(combined))` can be simplified
  - File: `src/utils/secure-storage.ts:93`
  - Detail: `Array.from(combined)` allocates an extra array; `apply(null, [...])` is the old pre-spread pattern. `String.fromCharCode(...combined)` is shorter and avoids the intermediate allocation. Safe for the token sizes used here (~130 bytes total).

### Testing Gaps

- [ ] **[TEST-026] severity:high** — The encrypted (production) code path is never exercised in tests
  - File: `src/utils/secure-storage.ts:70-98` (encryptData), `:10-39` (decryptData)
  - What to test: `setItem` in a non-test environment actually encrypts (stored value ≠ original); `getItem` round-trips correctly through encrypt → store → retrieve → decrypt; different salt/IV are used on each `setItem` call (verify stored values differ for same input).
  - Test type: unit (mock `import.meta.env.MODE` to return `"production"` or mock `isWebCryptoAvailable` to return `true`)

- [ ] **[TEST-027] severity:medium** — `getItem` decryption-failure fallback behavior is untested
  - File: `src/utils/secure-storage.ts:155-160`
  - What to test: Store a value encrypted with one key, then call `getItem` after fingerprint changes (mock `getBrowserFingerprint` to return a different value) — should return `null` (after BUG-022 is fixed) rather than raw ciphertext; existing tests should codify the correct behavior so regressions are caught.
  - Test type: unit

- [ ] **[TEST-028] severity:medium** — Silent plaintext fallback in `setItem` is untested
  - File: `src/utils/secure-storage.ts:192-195`
  - What to test: When `encryptData` throws (mock it to reject), `setItem` either falls back to plaintext (current behavior) or re-throws (after BUG-020 is fixed); verify which behavior is actually implemented after the fix; ensure no partial storage of garbage data.
  - Test type: unit

- [ ] **[TEST-029] severity:low** — `secureStorage.hasItem` is completely untested
  - File: `src/utils/secure-storage.ts:166-168`
  - What to test: `hasItem` returns `false` before any write; `true` after `setItem`; `false` again after `removeItem`
  - Test type: unit

- [ ] **[TEST-030] severity:low** — `secureStorage.removeItem` is completely untested
  - File: `src/utils/secure-storage.ts:173-175`
  - What to test: After `setItem`, `removeItem` makes `getItem` return `null`; `hasItem` returns `false`; calling `removeItem` on a non-existent key is a no-op (no throw)
  - Test type: unit

- [ ] **[TEST-031] severity:medium** — Fingerprint instability on `userAgent` change is undocumented by tests
  - File: `src/utils/secure-storage.ts:117`
  - What to test: Mock `navigator.userAgent` to a new browser version; verify fingerprint changes (documents the known limitation); contrast with the existing screen-dimension test that verifies stability. This test documents intended vs. actual behaviour so the breakage is visible if BUG-021 is later fixed.
  - Test type: unit

---

## `src/components/repo-table/repo-table.tsx` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-023] severity:high** — `window.repos` assignment runs unconditionally in production, exposing all repo data globally
  - File: `src/components/repo-table/repo-table.tsx:38`
  - Impact: Every time repos load in production, the full repo list (including private repo names, descriptions, and owner logins) is assigned to `window.repos`. Any injected script, browser extension, or XSS payload can read `window.repos` for the entire session. The surrounding `debug.group/table/groupEnd` calls are no-ops in production, but the `window` assignment has no `isDevelopment` guard.
  - Fix: Wrap the `window.repos` assignment inside a dev guard: `if (import.meta.env.DEV) { (window as ...).repos = repos; }`

- [ ] **[BUG-024] severity:medium** — `action` prop passed to `ConfirmationModal` can be `undefined` — unsafe cast hides it
  - File: `src/components/repo-table/repo-table.tsx:472`
  - Impact: `Array.from(selectedRepoAction)[0] as "archive" | "delete"` — if `selectedRepoAction` is an empty `Set` (which cannot happen via the UI today but is not structurally impossible), `Array.from(...)[0]` is `undefined`. The `as` cast silences TypeScript. `ConfirmationModal` receives `undefined` as `action` and likely renders incorrect UI or crashes. The actual initial value is always `"archive"`, so this is latent but fragile.
  - Fix: Use a fallback: `(Array.from(selectedRepoAction)[0] ?? "archive") as "archive" | "delete"`; or derive the action from `selectedRepoAction` more robustly (e.g., `selectedRepoAction.has("delete") ? "delete" : "archive"`).

- [ ] **[BUG-025] severity:low** — `aria-current="true"` on pagination buttons should be `aria-current="page"`
  - File: `src/components/repo-table/repo-table.tsx:443`
  - Impact: Screen readers announce "true" instead of "page" for the active pagination button. `aria-current="true"` is generic and valid HTML, but `aria-current="page"` is the semantically correct value for pagination — it announces "current page" to assistive technologies.
  - Fix: Change to `aria-current={page === currentPage ? "page" : undefined}`

- [ ] **[BUG-026] severity:low** — Duplicate `data-testid="repo-tags"` on mobile and desktop cells within the same row
  - File: `src/components/repo-table/repo-table.tsx:297` (mobile pills) and `:362` (desktop status)
  - Impact: Both `<div>`s within the same `<tr>` share `data-testid="repo-tags"`. Any test calling `getByTestId("repo-tags")` throws "Found multiple elements" because each repo row has two matching elements. Tests calling `getAllByTestId("repo-tags")` get twice as many results as expected.
  - Fix: Rename one: e.g., `data-testid="repo-tags-mobile"` and `data-testid="repo-tags-desktop"`.

### Simplification

- [ ] **[SIMP-011] severity:low** — `handleConfirm` is an empty dead callback
  - File: `src/components/repo-table/repo-table.tsx:120-122`
  - Detail: The `TODO` comment has been there since the component was extracted. The actual confirmation logic lives inside `useConfirmationModal` (within `ConfirmationModal`). The `onConfirm` prop passed to `ConfirmationModal` is never called back into `RepoTable`. Remove the callback and check whether `ConfirmationModal`'s `onConfirm` prop is wired up at all; if so, rename it to clarify its purpose.

- [ ] **[SIMP-012] severity:low** — `handlePerPageChange` is a trivial passthrough wrapper
  - File: `src/components/repo-table/repo-table.tsx:96-101`
  - Detail: `useCallback(() => { setPerPage(keys); }, [setPerPage])` adds a function allocation for zero benefit — `setPerPage` is already a stable reference from a `useCallback` inside `useRepoPagination`. Remove the wrapper and pass `setPerPage` directly as `onPerPageChange`.

### Testing Gaps

- [ ] **[TEST-032] severity:medium** — Sort column click behavior is completely untested
  - File: `src/components/repo-table/repo-table.tsx:125-141, 192-203, 227-238`
  - What to test: Clicking "Repository" column header sorts repos ascending on first click; clicking again reverses to descending (toggle); `aria-sort` attribute updates correctly; clicking "Last Updated" switches the active sort column and resets to ascending.
  - Test type: unit

- [ ] **[TEST-033] severity:medium** — Pagination rendering and navigation are untested
  - File: `src/components/repo-table/repo-table.tsx:423-467`
  - What to test: Pagination nav renders only when `totalPages > 1`; "prev" button is disabled on page 1; "next" button is disabled on last page; clicking a page number updates `currentPage`; clicking "prev"/"next" navigates correctly.
  - Test type: unit (render with enough repos to trigger multiple pages)

- [ ] **[TEST-034] severity:low** — `window.repos` production leak is untested (see BUG-023)
  - File: `src/components/repo-table/repo-table.tsx:38`
  - What to test: After the fix is applied, `window.repos` should NOT be set in production mode (`import.meta.env.DEV = false`); should be set in dev mode. A regression test prevents the guard from being accidentally removed.
  - Test type: unit (mock `import.meta.env.DEV`)

---

## `src/components/repo-table/confirmation-modal.tsx` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-027] severity:low** — `<ol>` elements use `list-disc` CSS class — bullet style on an ordered list
  - File: `src/components/repo-table/confirmation-modal.tsx:189, 332`
  - Impact: Both the repo list (confirmation screen) and error list (result screen) are `<ol>` elements styled with `list-disc` (bullets). Ordered lists signal enumeration to screen readers ("item 1, item 2…") but visually render bullets. Use `<ul>` for unordered bullet lists or `list-decimal` for numbered `<ol>`.

- [ ] **[BUG-028] severity:low** — Confirm button uses hardcoded Tailwind colors — violates HeroUI semantic color rule
  - File: `src/components/repo-table/confirmation-modal.tsx:222-225`
  - Impact: `bg-amber-500 hover:bg-amber-600` (archive) and `bg-red-500 hover:bg-red-600` (delete) do not adapt to the HeroUI theme system. Text contrast may break in dark mode. Violates `components.md`: "DO NOT use hardcoded Tailwind colors".
  - Fix: Use HeroUI `Button` component with `color="warning"` / `color="danger"` props, or map to HeroUI CSS variables (`bg-warning`, `bg-danger`).

- [ ] **[BUG-029] severity:medium** — `ModalOverlay` missing `role="dialog"`, `aria-modal`, and `aria-labelledby` — screen readers do not announce as a modal
  - File: `src/components/repo-table/confirmation-modal.tsx:149-158`
  - Impact: Without `role="dialog"` and `aria-modal="true"`, screen readers treat the overlay as ordinary content and do not restrict reading focus to the modal. Users of VoiceOver/NVDA can Tab to background content while the modal is open. WCAG 2.1 SC 4.1.2 failure.
  - Fix: Add `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` (pointing to the `<h3>` header) to the overlay `<div>`. Also add a focus trap (or use a library like `@radix-ui/react-focus-scope`).

- [ ] **[BUG-030] severity:medium** — `RepoActionResult` counts skipped repos as successes after a user Stop
  - File: `src/components/repo-table/confirmation-modal.tsx:318`
  - Impact: `count` is `repos.length` (total submitted). `errorCount` is failures among actually-processed repos. After stopping mid-way (e.g., 2 of 5 processed, 0 errors), the display shows "5 out of 5 repos archived successfully" — wrong. 3 repos were never touched.
  - Fix: Pass `state.progress` (processed count) to `RepoActionResult` alongside `count`. Display `state.progress - errorCount out of state.progress processed (N skipped)` or similar. Requires adding `processedCount` to the `RepoActionResultProps` interface.

### Simplification

- [ ] **[SIMP-013] severity:low** — `<div className="mt-4" />` self-closing spacer divs — presentational noise
  - File: `src/components/repo-table/confirmation-modal.tsx:194, 322`
  - Detail: Two empty `<div>` elements are used solely for spacing. Apply `mt-4` directly to the adjacent sibling element (`<strong>` at line 195, error paragraph at line 327) instead.

### Testing Gaps

- [ ] **[TEST-035] severity:medium** — Escape key dismissal is completely untested
  - File: `src/components/repo-table/confirmation-modal.tsx:127-135`
  - What to test: Pressing Escape calls `handleOnClose` when `isDismissable=true` (confirmation/result modes); pressing Escape during progress mode (where `isDismissable=false`) does NOT close the modal; `document.removeEventListener` cleans up on unmount
  - Test type: unit (use `fireEvent.keyDown(document, { key: 'Escape' })`)

- [ ] **[TEST-036] severity:medium** — Backdrop click dismissal is untested
  - File: `src/components/repo-table/confirmation-modal.tsx:143-147`
  - What to test: Clicking the overlay backdrop (`overlayRef.current`) closes the modal when dismissable; clicking inside the modal content (a child element) does NOT close it (`e.target !== overlayRef.current`); clicking during progress mode does nothing
  - Test type: unit

- [ ] **[TEST-037] severity:low** — `isOpen=false` rendering null is untested
  - File: `src/components/repo-table/confirmation-modal.tsx:55`
  - What to test: Rendering with `isOpen=false` should produce no DOM output (portal not mounted, `data-testid="repo-confirmation-modal"` absent); toggling `isOpen` from `true` to `false` removes the portal and restores `document.body.style.overflow`
  - Test type: unit

- [ ] **[TEST-038] severity:low** — Body scroll lock is untested
  - File: `src/components/repo-table/confirmation-modal.tsx:119-125`
  - What to test: `document.body.style.overflow` is set to `"hidden"` when modal mounts; restored to original value when modal unmounts; if body already had `overflow: scroll`, that value is correctly restored (not replaced with empty string)
  - Test type: unit

---

## `src/components/repo-table/repo-filters.tsx` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-031] severity:medium** — Per-page and repo-type dropdown triggers are `<div>` elements — keyboard inaccessible
  - File: `src/components/repo-table/repo-filters.tsx:160-163` (per-page), `:207-211` (repo-type)
  - Impact: Keyboard-only users cannot Tab to these dropdowns and activate them with Enter/Space. Only mouse users can access per-page and repo-type filtering. WCAG 2.1 SC 2.1.1 failure. The action dropdown's chevron IS a `<button>`, but the two filter triggers are not.
  - Fix: Replace the `<div className="relative cursor-pointer" onClick=...>` wrappers with `<button type="button">` elements so they are keyboard-reachable via Tab and activatable via Enter/Space.

- [ ] **[BUG-032] severity:low** — Action dropdown chevron button has no accessible label
  - File: `src/components/repo-table/repo-filters.tsx:294-305`
  - Impact: The button contains only a `ChevronDownIcon` SVG with no text. Screen readers announce "button" with no context — users of VoiceOver/NVDA cannot distinguish it from the main action button adjacent to it. WCAG 2.1 SC 4.1.2 failure.
  - Fix: Add `aria-label="Choose action type"` (or similar) to the chevron `<button>`.

- [ ] **[BUG-033] severity:low** — `aria-labelledby` is on the wrong element — not associated with the listbox
  - File: `src/components/repo-table/repo-filters.tsx:169`
  - Impact: `aria-labelledby="per-page-label"` is on the display `<div>`, not on the `<ul role="listbox">` at line 176. Screen readers read the label text for the div but do not announce "Repos per page" as the accessible name of the listbox widget.
  - Fix: Move `aria-labelledby="per-page-label"` from the display `<div>` to the `<ul role="listbox">` element.

### Simplification

- [ ] **[SIMP-014] severity:low** — Redundant nested `<div>` wrappers with no purpose
  - File: `src/components/repo-table/repo-filters.tsx:251-252` (search section), `:277-278` (action section)
  - Detail: Line 251 has `<div className="w-full md:flex-1"><div>` where the inner `<div>` has no className or role. Lines 277-278 have `<div className="flex"><div className="flex">` — both have identical `flex` classes; the inner adds nothing. Remove the empty inner div in search and collapse the double-flex in action to a single wrapper.

- [ ] **[SIMP-015] severity:low** — Keyboard shortcut hint hardcoded as `⌘K` — incorrect on Windows/Linux
  - File: `src/components/repo-table/repo-filters.tsx:267`
  - Detail: The handler fires on both `Ctrl+K` (line 71) and `Cmd+K`, but the hint `⌘K` is hardcoded. Windows/Linux users see a Mac-only symbol with no hint that the shortcut works for them. Fix: detect `navigator.platform.includes('Mac')` and render `Ctrl K` otherwise.

### Testing Gaps

- [ ] **[TEST-039] severity:medium** — `typesSummary` edge cases untested
  - File: `src/components/repo-table/repo-filters.tsx:146-154`
  - What to test: Render with all types deselected → trigger label shows "None"; all selected → "All"; partial selection (e.g. only "Private" and "Forked") → shows comma-joined labels
  - Test type: unit

- [ ] **[TEST-040] severity:medium** — Cmd+K / Ctrl+K keyboard shortcut untested
  - File: `src/components/repo-table/repo-filters.tsx:69-81`
  - What to test: Pressing `Ctrl+K` focuses the search input; pressing `Cmd+K` also focuses it; the `keydown` listener is removed on unmount (no focus error after unmount)
  - Test type: unit (use `fireEvent.keyDown(document, { metaKey: true, key: 'k' })`)

- [ ] **[TEST-041] severity:medium** — Click-outside-to-close behavior untested for all three dropdowns
  - File: `src/components/repo-table/repo-filters.tsx:83-110`
  - What to test: Opening the per-page dropdown then clicking outside it closes it; same for repo-type and action dropdowns; clicking inside the open dropdown does NOT close it; the `mousedown` listener is removed on unmount
  - Test type: unit (use `fireEvent.mouseDown(document.body)`)

- [ ] **[TEST-042] severity:low** — Delete action color test has a conditional skip — no assertion fires if button is not found
  - File: `src/components/repo-table/repo-filters.test.tsx:200-221`
  - What to test: The `if (actionButton)` guard silently skips the `expect` if `closest("button")` returns `null` — the test always passes regardless. Fix: add `expect(actionButton).not.toBeNull()` before the color check, or rewrite as a behavior test: verify the accessible name of the button is "Delete Selected Repos" when the delete action is active.
  - Test type: unit (fix existing test)

---

## `src/components/github-token-form.tsx` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-034] severity:high** — "Remember me" checkbox hardcoded `checked={true}` + `readOnly` — TODO never implemented
  - File: `src/components/github-token-form.tsx:195-207`
  - Impact: The `TODO: Set to false` comment reveals this was intended to be a real preference toggle. Currently it is permanently checked and the user cannot change it — false affordance. Users who do not want their token stored have no opt-out path. The preference is never passed to the parent, so even if it were interactive it would do nothing.
  - Fix: Either remove the checkbox (and document that storage is always on), or wire up a real `useState(true)` flag and pass it through `onSubmit(token, rememberMe)`.

- [ ] **[BUG-035] severity:medium** — Stale `isTokenValid`/`username` state persists after clearing the input
  - File: `src/components/github-token-form.tsx:107-109, 160-167, 213-219`
  - Impact: After a valid token is confirmed (green state), clicking the clear button resets `value` to `""` via `onValueChange("")`. The `useEffect` bails early at `!value`, so `isTokenValid` and `username` are never reset. The description still reads "Token is valid. Welcome X, click submit to continue!" and the submit button remains visually enabled (`!isTokenValid || isValidating` → `false`). `handleSubmit` guards `!value` so clicking does nothing — but the enabled-looking button causes confusion.
  - Fix: In `handleChange`, reset validation state when the value becomes empty: `if (!newValue) { setIsTokenValid(false); setUsername(null); setLastValidatedToken(null); }`

- [ ] **[BUG-036] severity:low** — All API errors (network failure, 5xx, rate-limit 403) shown as "Invalid or expired token"
  - File: `src/components/github-token-form.tsx:63-65`
  - Impact: During a GitHub outage or after hitting rate limits, users see the same message as for a genuinely invalid token. They may unnecessarily revoke and regenerate a working PAT.
  - Fix: Inspect `err` for HTTP status: show "Invalid or expired token" for 401 only; show a "GitHub API unavailable, please try again" message for network errors, 5xx, and 403.

### Simplification

- [ ] **[SIMP-016] severity:low** — Redundant arrow-function wrapper on form `onSubmit`
  - File: `src/components/github-token-form.tsx:126`
  - Detail: `onSubmit={(e) => { handleSubmit(e); }}` is identical to `onSubmit={handleSubmit}`. Allocates an extra function on every render with no benefit.

### Testing Gaps

- [ ] **[TEST-043] severity:high** — API error path is entirely untested
  - What to test: When `getAuthenticated()` rejects (mock network error or 401 status), the "Invalid or expired token" error message is shown; `isTokenValid` stays false; the submit button remains disabled; the error clears when the user edits the input
  - Test type: unit (mock `createThrottledOctokit` to return an octokit whose `users.getAuthenticated` rejects)

- [ ] **[TEST-044] severity:medium** — Stale success state after clearing the input is untested
  - What to test: After a token validates successfully (green "Token is valid" state), clicking the clear button should reset the form to the neutral default state — description back to the hint text, button disabled, no "Token is valid" message
  - Test type: unit

- [ ] **[TEST-045] severity:low** — Enter-key form submission is untested
  - What to test: With a valid validated token in the input, pressing Enter calls `onSubmit`; with an invalid token, pressing Enter does NOT call `onSubmit`
  - Test type: unit (use `userEvent.keyboard('{Enter}')` inside the form)

- [ ] **[TEST-046] severity:low** — Debounce behaviour is untested — rapid typing should fire only one API call
  - What to test: Typing three characters in quick succession (each within the 500 ms window) results in exactly one call to `createThrottledOctokit`, not three; use `vi.useFakeTimers()` to advance time and a spy on `createThrottledOctokit` to count calls
  - Test type: unit (fake timers)

---

## `src/components/dashboard.tsx` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-037] severity:medium** — Error and permission-warning alerts use hardcoded Tailwind colors instead of HeroUI semantic colors
  - File: `src/components/dashboard.tsx:92-97` (error alert), `:99-119` (warning alert)
  - Impact: Alert backgrounds/borders are hardcoded (`bg-red-50`, `dark:bg-red-900/20`, `text-red-700`, `bg-amber-50`, `text-amber-700`, etc.) and will not adapt if the HeroUI theme is changed. Same class of issue as BUG-028 in `confirmation-modal.tsx`. The `border-divider` class is correctly used on the refresh button but inconsistently skipped on the alerts.
  - Fix: Use HeroUI semantic classes (`bg-danger-50 text-danger border-danger-200` / `bg-warning-50 text-warning border-warning-200`) or add them as CSS variables in the theme config

### Testing Gaps

- [ ] **[TEST-047] severity:medium** — `RepoLoadingProgress` is never rendered in tests
  - What to test: Render `<Dashboard isLoading={true} progress={{ stage: "user", orgsLoaded: 0, orgsTotal: 2, currentOrg: "org1" }} repos={null} .../>` and assert `RepoLoadingProgress` is visible. Also assert it is absent when `isLoading=false` even if `progress` is set (stale progress object scenario).
  - Test type: unit

- [ ] **[TEST-048] severity:low** — Multi-item `permissionWarning` splitting via `\n\n` is untested
  - What to test: Pass `permissionWarning="Org A missing\n\nOrg B missing"` and assert two `<li>` elements are rendered, each with the correct text. Single-item (no `\n\n`) case is already implicitly covered.
  - Test type: unit

---

## `src/components/header.tsx` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-038] severity:medium** — User dropdown button missing `aria-expanded` and `aria-label`
  - File: `src/components/header.tsx:166-170`
  - Impact: Screen readers cannot determine whether the dropdown is open or closed. The button conveys no semantic label (the avatar `alt` is on a child `<img>`, not the button itself). Keyboard/AT users cannot tell what the button does or its current state.
  - Fix: Add `aria-label={`Open user menu for ${user?.name ?? user?.login ?? "User"}`}` and `aria-expanded={dropdownOpen}` to the trigger button; add `aria-haspopup="menu"` if the dropdown is menu-like

- [ ] **[BUG-039] severity:low** — `handleLogout` in `Header` duplicates auth cleanup outside the context
  - File: `src/components/header.tsx:237-242`
  - Impact: Calls `secureStorage.removeItem("pat")` and `secureStorage.removeItem("login")` directly rather than delegating to the provider's logout function (BUG-009 context). If the provider's logout gains additional cleanup steps (token revocation, SWR cache invalidation, etc.), this header path will silently miss them. Two code paths doing the same thing will diverge over time.
  - Fix: Expose a `logout` function from `useGitHubData()` (it may already exist in the provider) and call it here; keep `window.location.href = "/"` for the full-reload behavior

### Simplification

- [ ] **[SIMP-017] severity:low** — `handleLogout` could delegate to context instead of calling storage directly
  - File: `src/components/header.tsx:237-242`
  - Note: See BUG-039; this is the simplification aspect of the same issue

### Testing Gaps

- [ ] **[TEST-049] severity:high** — Dashboard route (`pathname === "/dashboard"`) renders `DashboardHeader` — entirely untested
  - What to test: Mock `useLocation` to return `pathname: "/dashboard"` and mock `useGitHubData` with a user; assert `DashboardHeader` elements are present (user avatar/name, no home nav links, no "Features" link); assert user's name appears. Currently no test covers the `isDashboard` branch at all.
  - Test type: unit

- [ ] **[TEST-050] severity:medium** — User dropdown open/close toggle is untested
  - What to test: With `pathname: "/dashboard"`, click the user avatar button; assert dropdown menu appears with "Log Out" button. Click again (or elsewhere) and assert dropdown closes.
  - Test type: unit

- [ ] **[TEST-051] severity:medium** — Logout action is untested
  - What to test: Open the dropdown, click "Log Out"; assert `secureStorage.removeItem` was called for both "pat" and "login" and that `window.location.href` was set to "/". Spy on `window.location` assignment.
  - Test type: unit

- [ ] **[TEST-052] severity:medium** — Dropdown closes on Escape key — untested
  - What to test: Open dropdown, press Escape, assert dropdown is gone. The Escape handler at `:128-141` exists but has no coverage.
  - Test type: unit

- [ ] **[TEST-053] severity:medium** — Dropdown closes on outside click — untested
  - What to test: Open dropdown, simulate `mousedown` outside `dropdownRef`, assert dropdown is gone. The click-outside handler at `:109-125` has no test coverage.
  - Test type: unit

- [ ] **[TEST-054] severity:medium** — Authenticated landing page shows "Go to Dashboard" link — untested
  - What to test: Mock `useGitHubData` to return `isAuthenticated: true` with `pathname: "/"`, and assert a link with text "Go to Dashboard" pointing to `/dashboard` is visible. The current test only checks the unauthenticated (no link) case.
  - Test type: unit

---

## `src/components/token-form-section.tsx` + `src/routes/dashboard.tsx` + `src/utils/sanitize-tokens.ts` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-040] severity:medium** — `analytics.trackTokenValidated()` fires on form submission, not on confirmed API success
  - File: `src/components/token-form-section.tsx:21`
  - Impact: Any user who submits a syntactically valid but semantically invalid token (wrong scopes, expired, revoked) gets a "token validated" analytics event recorded, skewing funnel metrics. The actual API validation happens asynchronously in `GitHubDataProvider` after navigation; this component has no knowledge of the outcome.
  - Fix: Move `analytics.trackTokenValidated()` into `GitHubDataProvider` after a successful API response (or wire a success callback from the provider to the form section)

- [ ] **[BUG-041] severity:medium** — `sanitize-tokens.ts` uses exact `{36}` length for `ghp_` but no fallback — diverges from `debug.ts` coverage
  - File: `src/utils/sanitize-tokens.ts:7` vs `src/utils/debug.ts:20`
  - Impact: `sanitize-tokens.ts` (used by Sentry) only redacts `ghp_[a-zA-Z0-9]{36}` (exactly 36 chars). `debug.ts` uses `/gh[porus]_[a-zA-Z0-9]+/gi` which covers `ghp_` at any length. If GitHub ever issues `ghp_` tokens with a different payload length, or if a test/dev token is shorter, Sentry would receive the raw token. Additionally, `sanitize-tokens.ts` uses case-sensitive `/g` while `debug.ts` uses `/gi` — all-caps tokens would escape Sentry redaction.
  - Fix: Unify both files to use `/ghp_[a-zA-Z0-9]+/g` (unbounded) in a shared `sanitize-tokens.ts`, and have `debug.ts` import from it

### Testing Gaps

- [ ] **[TEST-055] severity:medium** — `TokenFormSection` has zero tests
  - What to test: (1) `handleSubmit` calls `setPat` with the token, fires `analytics.trackTokenValidated()`, and navigates to `/dashboard`; (2) dev token pre-population: when `import.meta.env.DEV` is true and `VITE_GITHUB_DEV_TOKEN` is set, the input is pre-populated; (3) `onValueChange` propagates correctly to keep `value` state in sync
  - Test type: unit

- [ ] **[TEST-056] severity:medium** — `Dashboard` route has zero tests
  - What to test: (1) unauthenticated redirect: when `isInitialized=true` and `pat=null`, `navigate("/")` is called; (2) no redirect before init: when `isInitialized=false`, even with `pat=null`, no navigation fires; (3) authenticated render: when `pat` is set, `DashboardComponent` is rendered with all props forwarded correctly (`repos`, `isLoading`, `isError`, `login`, `permissionWarning`, `progress`, `onRefresh`); (4) `ErrorBoundary` catches errors thrown by `DashboardComponent` without propagating to the route
  - Test type: unit

- [ ] **[TEST-057] severity:low** — `sanitize-tokens.ts` tests do not cover non-standard `ghp_` lengths
  - What to test: (1) `ghp_` token shorter than 36 chars (e.g. `ghp_shorttoken`) should be redacted — currently would NOT be by line 7 and has no fallback; (2) `ghp_` token longer than 36 chars should be redacted; (3) mixed-case token e.g. `GHP_TOKEN` — currently case-sensitive patterns would NOT match
  - Test type: unit

---

## `src/utils/debug.ts` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-042] severity:high** — `sanitize()` converts `Error` objects to empty `{}`, silently destroying error context
  - File: `src/utils/debug.ts:104-120`
  - Impact: `Object.entries(new Error("details"))` returns `[]` because Error properties (`message`, `stack`, `name`) are non-enumerable. Any call like `debug.error("oops", new Error("PAT: ghp_xxx"))` logs `{}` instead of the error — the original error is completely lost, making debugging impossible. Worse, this is the path that's supposed to protect against token leaks in errors, so it silently fails at its primary job.
  - Fix: Before the generic object branch, add `if (value instanceof Error) return { message: sanitize(value.message), name: value.name }`

- [ ] **[BUG-043] severity:medium** — `sanitize()` has no circular-reference guard — will stack overflow on circular objects
  - File: `src/utils/debug.ts:100-120`
  - Impact: `sanitize({ a: null })` is fine, but any object where a nested property eventually references an ancestor (e.g. a DOM node, a SWR cache entry, or React fiber) will recurse infinitely and throw `RangeError: Maximum call stack size exceeded`, crashing the calling code path.
  - Fix: Pass a `seen = new WeakSet()` down the recursion; if `seen.has(value)` return `"[Circular]"`

- [ ] **[BUG-044] severity:low** — `key.toLowerCase().includes("key")` is overly broad — redacts values for innocuous keys
  - File: `src/utils/debug.ts:109-113`
  - Impact: Object keys such as `"monkey"`, `"jockey"`, `"foreignKey"`, `"primaryKey"`, `"keyboard"`, `"apiKey"` all contain `"key"` and will have their values silently replaced with `"[REDACTED]"`. This could hide useful debugging information for non-sensitive fields.
  - Fix: Use exact-match or whole-word check: `key === "key" || key.endsWith("Key") || key.endsWith("_key")`

### Simplification

- [ ] **[SIMP-018] severity:low** — Redundant `if (sanitizedData.length > 0)` branch in `log()`, `warn()`, `error()`
  - File: `src/utils/debug.ts:33-39, 76-82, 148-155`
  - Spreading an empty array (`console.log("msg", ...[])`) is identical to `console.log("msg")` in all JS engines. The if/else adds ~6 lines of dead branching per function for no benefit.
  - Fix: Remove the conditional; always spread `sanitizedData`

### Testing Gaps

- [ ] **[TEST-058] severity:high** — Zero tests for `debug.ts` — a security-critical module with no coverage
  - What to test: (1) `sanitize()` strips GitHub PATs from strings; (2) `sanitize()` strips tokens from nested object string values; (3) `sanitize()` redacts known key names (token, password, secret); (4) `log()`/`warn()`/`group()`/`table()` are suppressed when `isDevelopment=false`; (5) `error()` always fires regardless of `isDevelopment`; (6) `sanitize()` with an `Error` instance (expose BUG-042)
  - Test type: unit

- [ ] **[TEST-059] severity:medium** — `sanitize()` with `Error` objects returns `{}` — behavior is surprising and untested
  - What to test: `sanitize(new Error("token ghp_abc"))` should return something meaningful (message, name), not an empty object. Adding this test would both document the current broken behavior and guard against regression once BUG-042 is fixed.
  - Test type: unit

- [ ] **[TEST-060] severity:low** — Key-name false-positive redaction is untested
  - What to test: `sanitize({ monkey: "safe-value", jockey: "also-safe" })` — confirm whether these values are incorrectly redacted (BUG-044 scenario)
  - Test type: unit

---

## `src/utils/analytics.ts` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-045] severity:low** — `console.warn` on error fires in production (line 29)
  - File: `src/utils/analytics.ts:29`
  - Impact: Users with ad blockers (who block Fathom) will see "Failed to track event:" warnings in the browser console on every tracked action. Violates project rule: "Do NOT add console.log in production — use `debug` utility". Fathom is frequently blocked, so this fires often for real users.
  - Fix: Replace `console.warn('Failed to track event:', error)` with `debug.warn('Failed to track event:', error)` so it's suppressed in production

### Simplification

- [ ] **[SIMP-019] severity:low** — Dev log uses `value ? ...` falsy check, silently omits `value=0`
  - File: `src/utils/analytics.ts:18`
  - `value ? \`(value: ${value})\` : ''` evaluates to empty string when `value` is `0`. For a theoretical `trackArchiveActionSubmitted(0)`, the dev log would show no value — making it look like a value-less event. Fix: use `value !== undefined ? ...` (already used in the production branch at line 23)

### Testing Gaps

- [ ] **[TEST-061] severity:medium** — Zero tests for `analytics.ts`
  - What to test: (1) `track()` in dev returns early and logs to console without calling `trackEvent`; (2) `track()` in prod calls `trackEvent` with the correct event name and value; (3) `track()` in prod with `value=undefined` calls `trackEvent` without `_value`; (4) `track()` swallows `trackEvent` throws silently; (5) all `analytics.*` convenience methods call `track` with the right event name and count
  - Test type: unit

---

## `src/components/error-boundary.tsx` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-046] severity:low** — Default fallback UI missing `role="alert"` — screen readers won't announce the error state
  - File: `src/components/error-boundary.tsx:62`
  - Impact: When an error boundary catches an error and replaces content with the fallback, assistive technology users get no notification that something went wrong. The content changes silently from their perspective.
  - Fix: Add `role="alert"` to the outermost `<div>` of the default fallback (line 62)

### Simplification

- [ ] **[SIMP-020] severity:low** — Raw `console.error` in `componentDidCatch` dev block instead of `debug.error()`
  - File: `src/components/error-boundary.tsx:45`
  - Inconsistent with the project's `debug` utility pattern. Using `debug.error()` would be more coherent, though functionally equivalent since both are dev-only here.

### Testing Gaps

- [ ] **[TEST-062] severity:high** — Zero tests for `error-boundary.tsx`
  - What to test: (1) renders children when no error; (2) renders default fallback when child throws; (3) "Try Again" button resets the error state and re-renders children; (4) custom `fallback` prop is rendered instead of default UI when provided; (5) `Sentry.captureException` is called with the caught error (mock Sentry)
  - Test type: unit

---

## `src/components/repo-loading-progress.tsx` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-047] severity:low** — Hardcoded CSS variable `bg-[var(--brand-blue)]` on progress bar fill (line 58)
  - File: `src/components/repo-loading-progress.tsx:58`
  - Impact: Uses an arbitrary Tailwind CSS variable override instead of a HeroUI semantic color. Violates project convention ("DO NOT use hardcoded Tailwind colors — use HeroUI semantic colors"). If `--brand-blue` is not defined or changes, the progress bar fill becomes transparent. Should be `bg-primary`.
  - Fix: Replace `bg-[var(--brand-blue)]` with `bg-primary`

### Testing Gaps

- [ ] **[TEST-063] severity:low** — `orgsTotal === 0` edge case untested
  - What to test: When a user has no organizations, `totalSteps = 1` and `currentStep = 1` during "personal" stage — progress bar shows 100% while still loading. Verify the component renders correctly and percentage is clamped/displayed sensibly.
  - Test type: unit

---

## `src/contexts/github-context.tsx` + `src/hooks/use-github-data.ts` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-048] severity:low** — `useGitHubData()` silently returns no-op defaults when called outside `<GitHubDataProvider>`
  - File: `src/hooks/use-github-data.ts:15`
  - Impact: Components accidentally rendered outside the provider tree (e.g. in isolated tests or mis-placed routes) receive `isAuthenticated: false`, `repos: null`, and all mutation functions are no-ops — no error or warning is raised, making the failure invisible. The defensive pattern (`createContext<T | undefined>(undefined)` + throw in hook) would surface this at render time.
  - Fix: Initialize context with `undefined` and add a guard: `const ctx = useContext(GitHubContext); if (!ctx) throw new Error("useGitHubData must be used within GitHubDataProvider"); return ctx;`

### Simplification

- [ ] **[SIMP-021] severity:low** — `mutate` default value uses redundant `async/await` wrapper
  - File: `src/contexts/github-context.tsx:128-129`
  - `async () => await Promise.resolve(...)` is equivalent to `() => Promise.resolve(...)` — the extra async wrapping adds a tick and is misleading.

### Testing Gaps

- [ ] **[TEST-064] severity:low** — Zero tests for `useGitHubData` / `GitHubContext`
  - What to test: (1) Hook returns correct context values when rendered inside `<GitHubDataProvider>`; (2) All fields from `GitHubContextType` are present and have correct types at runtime; (3) Confirm behavior (error or silent default) when hook is used outside the provider.
  - Test type: unit

---

## `src/mocks/handlers.ts` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-049] severity:medium** — `getOrgRepositories` handler ignores which org is queried — always returns `testorg` data
  - File: `src/mocks/handlers.ts:48-62`
  - Impact: The handler filters by `isInOrganization` and hardcodes `login: "testorg"` in the response. When tests (or the real data provider) call `getOrgRepositories` for `anotherorg`, they still receive `testorg` repos with `login: "testorg"`. Org isolation bugs in `fetchGitHubDataWithProgress` are invisible in unit tests because all orgs look identical.
  - Fix: Capture the `org` variable from the GraphQL request body and filter `MOCK_REPOS` by matching `owner.login` (or add a `orgLogin` param to the handler context)

### Simplification

- [ ] **[SIMP-022] severity:low** — `http.get('/users/:username')` handler appears to be dead code
  - File: `src/mocks/handlers.ts:87-93`
  - No production code calls `GET /api.github.com/users/:username` directly; `getCurrentUser` uses GraphQL and `GET /user` serves the auth flow. This handler adds noise to the mock surface and could mask unexpected requests that should trigger `onUnhandledRequest: "error"`.
  - Fix: Remove unless there is a verified call site

### Testing Gaps

- [ ] **[TEST-065] severity:high** — No error scenario handlers — rate limit, scope, server error, network failure not mockable
  - File: `src/mocks/handlers.ts`
  - What to test: Tests need `server.use()` overrides for: 401 (bad token), 403 with scope error body, 429 rate-limit (with `Retry-After` header), 500 server error, network-level failure (MSW passthrough/network error). Without these, the error handling paths in `github-api.ts`, `github-utils.ts`, and `github-data-provider.tsx` are completely untested.
  - Test type: unit (via `server.use()` in individual tests)

- [ ] **[TEST-066] severity:high** — Pagination never exercised — `hasNextPage: true` scenario has no handler
  - File: `src/mocks/handlers.ts:21-33`
  - What to test: `getRepositories` and `getOrgRepositories` always return `hasNextPage: false`. The pagination loop in `fetchGitHubDataWithProgress` accumulates pages until `hasNextPage` is false — but this second iteration is never tested. A bug where the cursor is not threaded correctly, or the accumulation logic is wrong, would never be caught.
  - Test type: unit (handler override returning `hasNextPage: true` on first call, `false` on second)

---

## `src/mocks/static-fixtures.ts` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-050] severity:medium** — `repo-2` is `isInOrganization: true` with `ownerType: "current-user"` — contradictory fixture data
  - File: `src/mocks/static-fixtures.ts:71-82`
  - Impact: `getOrgRepositories` handler filters by `isInOrganization`, so `repo-2` appears in org repo results but has `owner.login = "testuser"`. Any code distinguishing org repos by owner login (e.g. `repo.owner.login !== viewer.login`) will behave differently for `repo-2` vs real data, masking filtering bugs.
  - Fix: Either set `isInOrganization: false` on `repo-2` (it's a user repo being archived) or change `ownerType` to `"organization"` and set `owner` accordingly

- [ ] **[BUG-051] severity:low** — `createMockRepo()` shallow-merges `owner` from personal repo base — org overrides get wrong `id` and `url`
  - File: `src/mocks/static-fixtures.ts:161-171`
  - Impact: `createMockRepo({ ownerType: 'organization' })` still produces `owner.id = 'user-123456'` and `owner.url = 'https://github.com/testuser'` because the base is always `MOCK_REPOS[0]` (a personal repo). Tests asserting on `owner.id` or `owner.url` for org repos will produce wrong results silently.
  - Fix: Derive `owner` from `ownerType` in `createMockRepo` (same logic as in `createMockRepository`)

### Simplification

- [ ] **[SIMP-023] severity:low** — `manyMockRepos` contains duplicate repo IDs (items 0–9 repeat as 10–19)
  - File: `src/mocks/static-fixtures.ts:194`
  - `[...MOCK_REPOS, ...MOCK_REPOS]` produces 20 repos where IDs `repo-1` through `repo-10` appear twice. React uses keys for reconciliation — duplicate IDs will cause key collision warnings and non-deterministic rendering. Any deduplication logic in production code would silently drop half the list.
  - Fix: If large datasets are needed, use a factory that generates unique IDs (e.g. `Array.from({length: 20}, (_, i) => createMockRepository({id: \`repo-\${i+1}\`, ...}))`)

### Testing Gaps

- [ ] **[TEST-067] severity:medium** — No fixtures with `isLocked`, `isTemplate`, or `isMirror` set to `true`
  - File: `src/mocks/static-fixtures.ts` (all `createMockRepository` calls)
  - What to test: These three flags are hardcoded `false` in `createMockRepository`. The app may filter, display, or warn differently for locked/template/mirror repos. Tests for those branches cannot be written without inline fixture construction, which is verbose and error-prone.
  - Test type: unit (add at least one fixture variant per flag)

---

## `src/utils/test-utils/render.tsx` + `src/utils/test-utils/index.tsx` + `src/mocks/server.ts` — reviewed 2026-03-16

### Testing Gaps

- [ ] **[TEST-068] severity:low** — No way to inject pre-seeded GitHub context state into `renderWithProviders`
  - File: `src/utils/test-utils/render.tsx:11-16`
  - What to test: `renderWithProviders` always starts from a fresh unauthenticated `GitHubDataProvider`. Tests that need a specific authenticated state (loaded repos, error state, mid-deletion) must set it up entirely via MSW handler ordering, which is indirect and fragile. A `contextOverrides` option would allow tests to pass initial state directly.
  - Test type: n/a (infrastructure improvement; impacts all future component tests)

- [ ] **[TEST-069] severity:low** — No tests for `renderWithProviders` itself
  - File: `src/utils/test-utils/render.tsx`
  - What to test: (1) Components rendered with `renderWithProviders` receive the `GitHubContext`; (2) Components rendered with `renderWithProviders` can use `useNavigate` without crashing; (3) RTL re-exports (`screen`, `fireEvent`, `waitFor`) are all present in the `index.tsx` barrel.
  - Test type: unit

---

## `src/components/landing/hero-section.tsx` + `features-section.tsx` + `testimonials-section.tsx` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-052] severity:low** — Star icons in `TestimonialsSection` use hardcoded Tailwind colors `fill-yellow-400 text-yellow-400`, violating the HeroUI semantic color rule
  - File: `src/components/landing/testimonials-section.tsx:57`
  - Impact: Stars remain yellow in both themes instead of adapting. HeroUI's `text-warning` / `fill-warning` are the semantic equivalents and would respect the design token system.
  - Fix: Replace `fill-yellow-400 text-yellow-400` with `fill-warning text-warning`

- [ ] **[BUG-053] severity:low** — Star rating container in `TestimonialsSection` has no accessible text — screen readers report nothing about the numeric rating
  - File: `src/components/landing/testimonials-section.tsx:53-59`
  - Impact: Screen reader users cannot determine the rating (e.g., "5 out of 5 stars").
  - Fix: Add `aria-label={`${t.rating} out of 5 stars`}` on the star container div, and `aria-hidden="true"` on each `<Star>` icon.

### Simplification

- [ ] **[SIMP-024] severity:low** — `FeaturesSection` uses magic number `index === 0` to decide which feature gets the "Try It Now" CTA button; if the `features` array is reordered the wrong card gets the button
  - File: `src/components/landing/features-section.tsx:87`
  - Fix: Add an optional `cta?: boolean` field to the feature data type and set it on the first entry explicitly, rather than relying on array position.

- [ ] **[SIMP-025] severity:low** — `HeroSection` scroll button at line 30 is missing `type="button"`, inconsistent with the equivalent button in `features-section.tsx:94` which has the attribute
  - File: `src/components/landing/hero-section.tsx:30`
  - Fix: Add `type="button"` for consistency (no functional impact since the button is outside a form).

---

## `src/components/landing/get-started-section.tsx`, `faq-section.tsx`, `cta-section.tsx` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-054] severity:high** — Token validation race condition in `InlinePATForm`: the debounced `getAuthenticated()` call starts inside `setTimeout`, so the cleanup `clearTimeout` only cancels an unfired timer. Once the network call is in flight, clearing the token re-runs the effect and sets `isValid=false`, but the pending promise still resolves and calls `setIsValid(true)` / `setIsValidating(false)`. Result: `token=""` with `canSubmit=true`, so `handleSubmit` passes its guard and calls `setPat("", remember)` then navigates to `/dashboard` with an empty token.
  - File: `src/components/landing/get-started-section.tsx:100-115`
  - Impact: User ends up on the dashboard with an empty/invalid PAT; all API calls immediately fail. Harder to reproduce on fast connections, reproducible on slow/throttled network.
  - Fix: Use an `isCancelled` flag or an `AbortController` ref to ignore the response if the token has changed by the time the promise settles — e.g. `let cancelled = false; ... .then(() => { if (!cancelled) { setIsValid(true); ... } }); return () => { cancelled = true; clearTimeout(timeout); };`

- [ ] **[BUG-055] severity:low** — `InlinePATForm` uses hardcoded Tailwind colors `border-emerald-600` (line 139) and `text-emerald-700 dark:text-emerald-400` (line 158) for the "valid" state, violating the HeroUI semantic color convention
  - File: `src/components/landing/get-started-section.tsx:139,158`
  - Impact: Valid-state styling does not adapt correctly to custom themes; `text-emerald-700` is hardcoded light-mode only (the manual dark override `dark:text-emerald-400` is fragile).
  - Fix: Replace with `border-success` / `text-success`, consistent with how other success states are styled across the app.

### Simplification

- [ ] **[SIMP-026] severity:low** — `CTASection` scroll button (line 22) is missing `type="button"`, the same pattern already flagged as SIMP-025 for `hero-section.tsx`
  - File: `src/components/landing/cta-section.tsx:22`
  - Fix: Add `type="button"` for consistency and to be explicit about intent.

### Testing Gaps

- [ ] **[TEST-070] severity:high** — Race condition in `InlinePATForm` token validation (BUG-054) has no test: no test verifies that clearing the token while a validation call is in flight does not leave `canSubmit=true` with an empty token string
  - What to test: mock `createThrottledOctokit` to return a delayed promise; type a valid token, advance timers past debounce, then clear the token before the promise resolves; assert submit button remains disabled
  - Test type: unit (vitest + RTL + fake timers)

- [ ] **[TEST-071] severity:medium** — `InlinePATForm` has zero unit tests; all interactive logic (debounce validation, success/error states, remember-me checkbox, tooltip open/close on click-outside, form submit + navigation) is untested
  - What to test: (a) invalid token → error shown, (b) valid token → success state + submit enabled, (c) unchecking remember-me passes `false` to `setPat`, (d) submit calls `setPat` and navigates to `/dashboard`, (e) tooltip opens and closes on outside click
  - Test type: unit (vitest + RTL)

## `src/components/landing/product-showcase.tsx` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-056] severity:low** — `Archive Selected` button uses `text-black` hardcoded (line 97), violating the HeroUI semantic color convention
  - File: `src/components/landing/product-showcase.tsx:97`
  - Impact: `text-black` does not adapt to theme; in custom or high-contrast themes, black text on `amber-500` may fail contrast checks. Inconsistent with the rest of the codebase which avoids hardcoded colors.
  - Fix: Replace `text-black` with `text-foreground` or HeroUI's warning color foreground.

- [ ] **[BUG-057] severity:low** — Status badges use hardcoded `bg-amber-*` / `bg-emerald-*` Tailwind colors (lines 165, 170), same pattern as BUG-052/BUG-055
  - File: `src/components/landing/product-showcase.tsx:165,170`
  - Impact: Badge colors don't adapt to custom themes; dark-mode overrides are manual and fragile.
  - Fix: Replace with `bg-warning-100 text-warning-700` (archived) and `bg-success-100 text-success-700` (public), consistent with HeroUI semantic conventions used elsewhere.

### Simplification

- [ ] **[SIMP-027] severity:low** — Four `<button>` elements (lines 97, 101, 183, 193) are missing `type="button"`, same pattern as SIMP-025/SIMP-026
  - File: `src/components/landing/product-showcase.tsx:97,101,183,193`
  - Fix: Add `type="button"` to all four. They are decorative mockup elements but the missing attribute is still technically incorrect.

## `src/components/footer.tsx` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-058] severity:medium** — Icon-only social links (GitHub and Bluesky, lines 36–52) have no accessible text label — screen readers announce nothing meaningful
  - File: `src/components/footer.tsx:36-52`
  - Impact: Screen reader users cannot identify or navigate to these links. WCAG 2.1 SC 2.4.4 (Link Purpose) and 4.1.2 (Name, Role, Value) are violated.
  - Fix: Add `aria-label="GitHub"` and `aria-label="Bluesky"` to the respective `<a>` elements.

## `src/components/scrolling-quotes.tsx` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-059] severity:low** — `prefers-reduced-motion` is read once at mount (line 52) with no `MediaQueryList` listener; if the user toggles their OS accessibility setting while the page is open, the JS `reduceMotion` state does not update
  - File: `src/components/scrolling-quotes.tsx:50-57`
  - Impact: After the user enables reduced motion at runtime, `onMouseEnter/Leave` still calls `setIsPaused`, and `hover:scale-105` still applies — the JS-driven interactive effects ignore the updated preference. (The CSS animation stops correctly via the `@media` rule in the module, so the animation itself is safe.)
  - Fix: Use `window.matchMedia(...).addEventListener('change', handler)` with cleanup in the effect, or replace with the `@media` CSS rule entirely and drop the JS read.

### Simplification

- [ ] **[SIMP-028] severity:low** — Two `useEffect` hooks with identical `[]` dependency arrays (lines 45–48 and 50–57) can be merged into a single effect
  - File: `src/components/scrolling-quotes.tsx:45-57`
  - Fix: Merge into one `useEffect(() => { /* shuffle */ /* reduced-motion check */ }, [])`.

- [ ] **[SIMP-029] severity:low** — `shuffledQuotes` initialised as `[]` (line 41) causes a flash of empty content on first render; the quotes only appear after the `useEffect` fires post-paint
  - File: `src/components/scrolling-quotes.tsx:41`
  - Impact: Visible layout jump on initial page load — the scrolling section is empty until React's first effect cycle.
  - Fix: Use a lazy initialiser: `useState(() => [...quotes].sort(() => Math.random() - 0.5))`. This runs synchronously on first render with no effect needed, eliminating the flash. The separate shuffle effect can then be removed entirely.

### Testing Gaps

- [ ] **[TEST-072] severity:low** — `ScrollingQuotes` has zero tests; reduced-motion behaviour (paused state, no scale class) and mouse-hover pause are untested
  - What to test: (a) renders quote cards, (b) hover pause is no-op when `prefers-reduced-motion` is set, (c) hover sets/unsets `isPaused` class when motion is allowed
  - Test type: unit (vitest + RTL)

---

## `src/components/scroll-button.tsx` + `theme-switcher.tsx` + `generate-repos-button.tsx` + `fathom-analytics.tsx` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-060] severity:medium** — `variantMap` builds Tailwind classes via string interpolation — not included in JIT CSS bundle
  - File: `src/components/scroll-button.tsx:42-50`
  - Impact: Classes like `border-${color}`, `text-${color}`, `bg-${color}/10`, `shadow-${color}/40` are assembled at runtime. Tailwind's JIT compiler scans source for literal class strings only; dynamically constructed strings are never added to the production CSS. Any use of `bordered`, `flat`, `ghost`, `light`, or `shadow` variants will render an unstyled button in production. Only `solid` is safe (it routes through `colorMap` which uses literal strings).
  - Fix: Either replace with a lookup table of complete literal class strings (one entry per color×variant combination), or replace the entire custom button with HeroUI's `Button` component which already handles all variants natively.

- [ ] **[BUG-061] severity:low** — `faded` is a valid prop value but missing from `variantMap` — silently falls back to `solid`
  - File: `src/components/scroll-button.tsx:17-24` (prop type), `:41-51` (variantMap)
  - Impact: `ScrollButtonProps` lists `"faded"` as a valid variant. When passed, `variantMap["faded"]` is `undefined`; the `!variantMap[variant]` guard at line 78 is `true`, so the code falls back to `colorMap` (solid styling). No error, no warning — the button silently ignores the `faded` variant request.
  - Fix: Either add a `faded` entry to `variantMap` or remove `"faded"` from the prop type.

- [ ] **[BUG-062] severity:low** — `GenerateReposButton` creates a new `Octokit` instance on every render — throttling state is lost
  - File: `src/components/generate-repos-button.tsx:17`
  - Impact: `createThrottledOctokit(pat)` is called unconditionally on every render with no `useMemo`. Each render produces a fresh Octokit instance with a fresh rate-limiter, wiping any accumulated throttle state. In practice this is dev-only, but it means rapid renders could trigger unthrottled API calls.
  - Fix: Wrap in `useMemo`: `const octokit = useMemo(() => pat ? createThrottledOctokit(pat) : null, [pat])`

- [ ] **[BUG-063] severity:medium** — `VITE_FATHOM_SITE_ID` env var name is documented incorrectly in multiple files as `NEXT_PUBLIC_FATHOM_SITE_ID`
  - File: `src/components/fathom-analytics.tsx:9` (correct) vs `docs/ROADMAP.md:32`, `.claude/rules/architecture.md:95` (wrong)
  - Impact: If an operator sets `NEXT_PUBLIC_FATHOM_SITE_ID` in Cloudflare Workers following the docs, Fathom analytics silently loads nothing — no error is raised because the code just returns early on missing `siteId`. All analytics events and pageviews are lost in production with no indication.
  - Fix: Update `docs/ROADMAP.md` and `.claude/rules/architecture.md` to use `VITE_FATHOM_SITE_ID` consistently. Also update project `MEMORY.md` which still documents `NEXT_PUBLIC_FATHOM_SITE_ID`.

- [ ] **[BUG-064] severity:low** — `FathomAnalytics` pageview effect fires unconditionally — does not guard on Fathom being initialized
  - File: `src/components/fathom-analytics.tsx:24-30`
  - Impact: The pageview `useEffect` runs on every route change regardless of whether `Fathom.load()` was called (i.e., regardless of whether `VITE_FATHOM_SITE_ID` is set). Calling `Fathom.trackPageview()` before `Fathom.load()` queues the event in the fathom-client buffer but it is never flushed — pageviews are silently lost on the initial route. On subsequent navigations after `load()` completes, tracking resumes. The initial pageview is reliably missed.
  - Fix: Gate the pageview effect on whether `siteId` is set, or use a ref to track initialization state: `if (!initializedRef.current) return;` before calling `trackPageview`.

### Simplification

- [ ] **[SIMP-030] severity:low** — `scroll-button.test.tsx` imports `render` from `@testing-library/react` directly instead of `@/utils/test-utils`
  - File: `src/components/scroll-button.test.tsx:1`
  - Detail: The project convention (`.claude/rules/testing.md`) requires using the custom `render` from `@/utils/test-utils` so components are wrapped with `GitHubDataProvider`. While `ScrollButton` itself doesn't need the provider today, importing bare RTL is inconsistent and will silently break if the component ever gains context dependencies.
  - Fix: Replace `import { render, screen } from "@testing-library/react"` with `import { render, screen } from "@/utils/test-utils"`.

- [ ] **[SIMP-031] severity:low** — `GenerateReposButton` uses hardcoded CSS variables `var(--brand-blue)` for all styling
  - File: `src/components/generate-repos-button.tsx:27-30`
  - Detail: Dev-only component but still inconsistent with the project convention to use HeroUI semantic colors. If `--brand-blue` is not defined in a given theme, the button renders with no border, text color, or focus ring. Use `border-primary text-primary hover:bg-primary hover:text-primary-foreground` instead.

### Testing Gaps

- [ ] **[TEST-073] severity:medium** — `ThemeSwitcher` has zero tests
  - File: `src/components/theme-switcher.tsx`
  - What to test: (a) renders loading skeleton (`aria-label="Theme switcher loading"`) before mount; (b) after mount in light mode renders moon icon with `aria-label="Switch to dark theme"`; (c) after mount in dark mode renders sun icon with `aria-label="Switch to light theme"`; (d) clicking the button calls `setTheme` with the opposite theme
  - Test type: unit (mock `next-themes` `useTheme`)

- [ ] **[TEST-074] severity:low** — `scroll-button.tsx` variant tests assert only `toBeInTheDocument()` — no CSS class assertions; `faded` variant entirely untested
  - File: `src/components/scroll-button.test.tsx:68-77`
  - What to test: (a) `variant="bordered"` applies expected border/background classes to the button; (b) `variant="faded"` — currently falls back to solid (BUG-061); add a test that documents the current behavior and will catch a regression fix; (c) an unknown variant gracefully falls back to solid
  - Test type: unit

- [ ] **[TEST-075] severity:low** — `FathomAnalytics` has zero tests
  - File: `src/components/fathom-analytics.tsx`
  - What to test: (a) `Fathom.load()` is called with `siteId` when `VITE_FATHOM_SITE_ID` is set, and NOT called when it is not set; (b) `Fathom.trackPageview()` is called on each route change; (c) `Fathom.load()` is called only once even if the component re-renders
  - Test type: unit (mock `fathom-client` and `react-router-dom`)

- [ ] **[TEST-076] severity:low** — `GenerateReposButton` loading state UI is untested
  - File: `src/components/generate-repos-button.test.tsx`
  - What to test: While `generateRepos` is in-flight, the button should be disabled and show "Generating..." text with a spinner. The existing tests use `waitFor` after click but do not assert the intermediate disabled/loading state.
  - Test type: unit (use `vi.fn()` that never resolves to freeze in loading state)

---

## `src/components/repo-table/repo-table-skeleton.tsx` + `src/components/repo-table/repo-filters-skeleton.tsx` — reviewed 2026-03-16

No findings. Both components use HeroUI semantic colors (`bg-default-200`, `border-divider`, `bg-content1`), have proper accessible labels (`aria-label="Loading repositories"` on the table), and `repo-table-skeleton.tsx` has thorough test coverage (11 tests covering row counts, column headers, accessibility, and edge cases). `repo-filters-skeleton.tsx` is tested indirectly through the skeleton container test.

---

## `src/components/ui/accordion.tsx` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-065] severity:high** — `outline-none` removes browser focus ring, and the replacement `focus-visible:ring-ring/50` references undefined `--color-ring` CSS variable — keyboard focus is completely invisible
  - File: `src/components/ui/accordion.tsx:36`
  - Impact: The trigger explicitly removes the browser default outline (`outline-none`) and relies on `focus-visible:ring-3 focus-visible:ring-ring/50` as the replacement. However, `--color-ring` (Tailwind v4) / `--ring` (shadcn) is not defined in `globals.css` and HeroUI does not define it, so the computed ring color is transparent. Keyboard users navigating the FAQ accordion have zero visible focus state. WCAG 2.1 SC 2.4.7 (Focus Visible) violation. Same issue affects `focus-visible:border-ring` and `focus-visible:after:border-ring`.
  - Fix: Replace `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:after:border-ring` with `focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)]` to match the project's established focus-ring pattern, or define `--color-ring: var(--brand-blue)` in `globals.css`

- [ ] **[BUG-066] severity:low** — `text-muted-foreground` CSS variable undefined — chevron icon inherits full-contrast parent color instead of being muted
  - File: `src/components/ui/accordion.tsx:36`
  - Impact: `**:data-[slot=accordion-trigger-icon]:text-muted-foreground` applied to the chevron icons references `--color-muted-foreground` (Tailwind v4) / `--muted-foreground` (shadcn), neither of which is defined in `globals.css` or by HeroUI. The chevron renders at full text contrast rather than grayed-out, making it harder to visually distinguish from the label text.
  - Fix: Replace `text-muted-foreground` with `text-default-400` (HeroUI semantic muted gray)

### Testing Gaps

- [ ] **[TEST-077] severity:low** — `accordion.tsx` has zero tests; open/close and keyboard behavior untested
  - File: `src/components/ui/accordion.tsx` — used in `faq-section.tsx` for all FAQ items
  - What to test: (a) item opens on trigger click and chevron swaps icon; (b) item closes on second click; (c) keyboard Enter/Space activates the trigger; (d) `AccordionContent` is hidden when closed and visible when open; (e) multiple items can be open if `openMultiple` is allowed
  - Test type: unit (vitest + RTL)

---

## `src/components/ui/button.tsx` + `src/components/ui/checkbox.tsx` + `src/lib/utils.ts` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-067] severity:medium** — `button.tsx` uses shadcn CSS variables not defined in this project — `outline`, `ghost`, `secondary` variants render incorrectly
  - File: `src/components/ui/button.tsx:12-18`
  - Impact: The `outline` variant uses `border-border bg-background hover:bg-muted hover:text-foreground` and `dark:border-input dark:bg-input/30 dark:hover:bg-input/50`. The `secondary` variant uses `bg-secondary text-secondary-foreground`. The `ghost` variant uses `hover:bg-muted`. None of `--color-border`, `--color-input`, `--color-muted`, `--color-muted-foreground`, `--color-secondary`, `--color-secondary-foreground` are defined in `globals.css` or emitted by the HeroUI plugin. In Tailwind v4, unresolved CSS variables resolve to `initial` — affected variants render with transparent/no backgrounds, wrong borders, and unreadable text. Since the component is currently dead code (see SIMP-032), this only matters if the component is ever activated.
  - Fix: Replace shadcn CSS variables with HeroUI semantic equivalents: `border-divider bg-background hover:bg-content2` for outline; `bg-primary-100 text-primary` for secondary; `hover:bg-content2` for ghost.

### Simplification

- [ ] **[SIMP-032] severity:medium** — `button.tsx` is dead code — never imported anywhere in the codebase
  - File: `src/components/ui/button.tsx`
  - Detail: Grep for `from "@/components/ui/button"` returns zero matches. `buttonVariants` is only referenced within button.tsx itself. The file was generated by `shadcn add` (shadcn CLI is in `dependencies`) but was never integrated. It adds a `@base-ui/react` dependency path alongside HeroUI, creating mixed-library confusion. Fix: Either wire up and fix the component (see BUG-067) or delete the file entirely and remove `class-variance-authority` if it has no other consumers.

- [ ] **[SIMP-033] severity:low** — `[a]:hover:bg-primary/80` in `default` variant is a no-op — `[a]` matches elements with the HTML attribute named `a`, not `<a>` anchor elements
  - File: `src/components/ui/button.tsx:11`
  - Detail: In Tailwind v4, `[a]:hover:*` generates CSS like `[a]:hover .class { ... }` matching elements with attribute named `a`. The intent was likely to apply a different hover tint when the button renders as a link (`<a>`), but the arbitrary variant syntax used is wrong. Fix: Either remove the class (the default `hover:bg-primary/80` would cover all hover cases) or use the correct pattern `[@render=a]:hover:bg-primary/80` if base-ui supports a `render` data attribute.

### Testing Gaps

- [ ] **[TEST-078] severity:medium** — `checkbox.tsx` has zero tests — used in the critical repo-selection path (`repo-table.tsx`) with no coverage
  - File: `src/components/ui/checkbox.tsx` (used in `src/components/repo-table/repo-table.tsx`)
  - What to test: (a) renders unchecked by default with correct border color; (b) renders checked with `data-checked` attribute and brand-blue background; (c) `disabled` prop applies `disabled:cursor-not-allowed disabled:opacity-50` classes; (d) `CheckIcon` is visible when checked and absent when unchecked (base-ui `Indicator` hides children when unchecked); (e) focus ring appears on keyboard focus with brand-blue color
  - Test type: unit (vitest + RTL)

`src/lib/utils.ts` — no findings (6-line `clsx` + `twMerge` wrapper; trivially correct, no test warranted).

---

## `src/config/repo-config.ts` + `src/config/api-config.ts` + `src/providers/providers.tsx` + `src/routes/home.tsx` + `src/app.tsx` + `src/hero.ts` — reviewed 2026-03-16

No findings. All six files are either pure constant exports, trivial compositional wrappers, or straightforward configuration. `repo-config.ts` and `api-config.ts` use `as const` correctly with proper type exports. `providers.tsx` correctly layers `NextThemesProvider` → `GitHubDataProvider`. `app.tsx` correctly places `ErrorBoundary` at the root, uses `config.autoAddCss = false` with a manual CSS import to prevent FOUC, and the catch-all `path="*"` redirect is intentional. `hero.ts` correctly scopes the dark background override to only the `background` color token.

---

## `src/main.tsx` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-068] severity:medium** — `event.breadcrumbs.forEach(...)` in `beforeSend` may fail at runtime — Sentry's `Event.breadcrumbs` type is `Breadcrumbs | undefined` where `Breadcrumbs = { values?: Breadcrumb[] }`, not `Breadcrumb[]`
  - File: `src/main.tsx:44`
  - Impact: If `Breadcrumbs` is still an object (not an array) in Sentry v10, calling `.forEach()` on it throws `TypeError: event.breadcrumbs.forEach is not a function`. Sentry's SDK catches throws inside `beforeSend` and returns `null`, **dropping the event entirely**. Any Sentry event that has breadcrumbs (virtually all of them in practice) would be silently discarded — no error reporting. Additionally, the breadcrumb sanitization never runs, so token-containing breadcrumb messages could be sent to Sentry if the event is somehow not dropped. Verify against `@sentry/react@10.43.0` node_modules; if `Breadcrumbs` is still an object, the fix is `event.breadcrumbs.values?.forEach(...)`.
  - Fix: Change `event.breadcrumbs.forEach(...)` → `event.breadcrumbs.values?.forEach(...)`

### Testing Gaps

- [ ] **[TEST-079] severity:high** — Sentry `beforeSend` token-scrubbing logic has zero tests — this is the critical privacy barrier preventing GitHub PATs from leaking into error reports
  - File: `src/main.tsx:13-67`
  - What to test: (a) token in `event.message` is scrubbed; (b) token in `exception.value` is scrubbed; (c) token in `exception.stacktrace.frames[].vars` is scrubbed; (d) token in `breadcrumb.message` is scrubbed; (e) token in `breadcrumb.data` values is scrubbed; (f) `event.user.ip_address` is deleted; (g) `event.request.headers.Authorization` is deleted; (h) the full event is returned (not null) after scrubbing; (i) `Sentry.init` is NOT called when `VITE_SENTRY_DSN` is not set. Since `beforeSend` is an inline function, extract it to a named export to enable unit testing without mocking Sentry internals.
  - Test type: unit

---

## `.eslintrc.json` — reviewed 2026-03-16

### Simplification

- [ ] **[SIMP-034] severity:medium** — All test files are in `ignorePatterns`, making the `overrides` block for test files dead code and leaving test files completely unlinted
  - File: `.eslintrc.json:12-27` (ignorePatterns) vs `:29-44` (overrides)
  - ESLint v8 `ignorePatterns` excludes files from processing entirely, before `overrides` is evaluated. `**/*.test.ts`, `**/*.test.tsx`, `**/*.spec.ts`, `**/*.spec.tsx`, and `e2e/` are all in `ignorePatterns`, so the `overrides` block that disables `@typescript-eslint/no-unsafe-*` for test files is dead code — those files never reach the override stage. More practically, test files receive zero linting: unused imports, unsafe casts, and type errors in test code go unchecked.
  - Fix: Remove test file patterns from `ignorePatterns` and keep them only in the `overrides` section (with the unsafe rules turned off). The E2E folder can stay ignored since Playwright tests use a different tsconfig.

- [ ] **[SIMP-035] severity:medium** — No `no-console` rule — the project convention to use `debug.*` instead of `console.*` is never enforced automatically
  - File: `.eslintrc.json:28` (`"rules": {}`)
  - The project's own CLAUDE.md rule ("Do NOT add console.log in production — use `debug` utility") is unenforced by lint. BUG-004, BUG-008, BUG-019, BUG-042, BUG-045, SIMP-020 were all `console.*` violations found by manual audit — none would have been flagged by ESLint. Future contributors can add raw console calls without any automated check.
  - Fix: Add `"no-console": "warn"` to `"rules"` (allowing E2E and test files to continue using console via the existing `overrides` pattern).

---

## `.github/workflows/ci.yml` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-069] severity:high** — No TypeScript type-check step in CI — `bun run build` uses Vite/esbuild which transpiles without type-checking
  - File: `.github/workflows/ci.yml:22-24` (lint-and-test job)
  - Impact: `vite build` uses `esbuild` under the hood, which strips TypeScript types but does not perform type checking. A PR with a real type error (wrong prop type, missing required field, unsafe cast) can pass lint, unit tests, and build without any CI failure. The only TypeScript validation is the developer's local `tsc --noEmit`, which CLAUDE.md recommends but is not enforced.
  - Fix: Add a type-check step to `lint-and-test`: `- name: Type check\n  run: bunx tsc --noEmit` (or add a `"type-check": "tsc --noEmit"` script to `package.json`)

- [ ] **[BUG-070] severity:medium** — E2E job has no `GITHUB_TEST_TOKEN` secret — tests that need a real token silently skip or partially pass
  - File: `.github/workflows/ci.yml:60-61` (Playwright test step)
  - Impact: `testing.md` states "E2E Tests: Require real GitHub token in `.env.test` file (`GITHUB_TEST_TOKEN`)". The CI job sets no `env:` with this secret. If any E2E test uses the real GitHub API, it either silently skips (matching the "1 skipped" test in the suite) or fails with an auth error that is hidden by `fail-fast: false`. Token-dependent flows are never exercised in CI.
  - Fix: Add `env: GITHUB_TEST_TOKEN: ${{ secrets.GITHUB_TEST_TOKEN }}` to the `Run Playwright tests` step and document the required secret in `README.md`.

### Simplification

- [ ] **[SIMP-036] severity:low** — `lint-and-test` and `build` jobs have no `timeout-minutes` — can run up to GitHub's 6-hour default if tests hang
  - File: `.github/workflows/ci.yml:13` (`lint-and-test`), `:77` (`build`)
  - The `e2e-tests` job correctly has `timeout-minutes: 60`. The other two jobs have no limit. A unit test with an unresolved promise or an infinite retry loop would burn Actions minutes for 6 hours before GitHub kills it.
  - Fix: Add `timeout-minutes: 15` to `lint-and-test` and `timeout-minutes: 10` to `build`.

---

## `.env.example` — reviewed 2026-03-16

### Bugs

- [ ] **[BUG-071] severity:high** — Scope documentation is incomplete: `delete_repo` scope is required for deletion but not mentioned
  - File: `.env.example:5`
  - Impact: The comment says "Required scopes: 'repo' (for repository management)". On GitHub classic PATs, `repo` grants read/write repository access but does NOT include the `delete_repo` scope — that is a separate, explicitly opt-in scope. Users who follow the documentation and create a token with only `repo` scope will receive `403 Forbidden` errors when attempting to delete repositories (the app's primary function). The failure is silent from the token setup perspective — the app authenticates successfully but deletion fails with a permissions error.
  - Fix: Update the comment to: `# Required scopes: 'repo' (for read/write + archive) and 'delete_repo' (for deleting repositories)`

---

## `e2e/home.spec.ts` + `e2e/dashboard.spec.ts` + `e2e/layout.spec.ts` + `e2e/theme-basic.spec.ts` + `e2e/theme.spec.ts` — reviewed 2026-03-17

Also reviewed: `e2e/pages/base-page.ts`, `e2e/pages/dashboard.ts`, `e2e/pages/home.ts`, `e2e/utils/github-api-mocks.ts`

### Bugs

- [ ] **[BUG-072] severity:high** — `dashboard.spec.ts` "handles repository processing errors" test (lines 385–393) uses `.isVisible()` instead of `expect(...).toBeVisible()` — the assertions are silently no-ops
  - File: `e2e/dashboard.spec.ts:385-393`
  - Impact: `dashboard.page.getByText("1 error occurred...").isVisible()` returns a `Promise<boolean>` that is never awaited or checked. The result is discarded. The test marks as "passed" even if the error message is completely absent from the UI. Any regression in the error display path goes undetected by this test.
  - Fix: Replace `.isVisible()` with `await expect(...).toBeVisible()` on both lines.

- [ ] **[BUG-073] severity:medium** — Skipped test in `home.spec.ts` (line 66) references `home.rememberCheckbox` and `home.toggleRememberMe()` — neither exists on `HomePage`
  - File: `e2e/home.spec.ts:68,71` / `e2e/pages/home.ts`
  - Impact: The test is currently `test.skip(...)`. The moment it is un-skipped (e.g., after BUG-034 is fixed), it will immediately throw `TypeError: Cannot read properties of undefined` on line 68 before any test logic runs. TypeScript would also flag these as type errors, but CI has no `tsc --noEmit` step (BUG-069) and ESLint ignores test files (SIMP-034), so neither catch this automatically.
  - Fix: Add `readonly rememberCheckbox: Locator` and `async toggleRememberMe()` to `HomePage`, or remove the skipped test if remember-me is being dropped.

- [ ] **[BUG-074] severity:low** — `theme.spec.ts` `beforeEach` navigates to `/dashboard` without auth mocks — first three tests pass only because the unauthenticated redirect lands on home (which also has a theme switcher)
  - File: `e2e/theme.spec.ts:10-16`
  - Impact: The `beforeEach` calls `page.goto("/dashboard")` with no `mockLocalStorage`/`mockOctokitInit`. If the app's unauthenticated redirect behavior changes (e.g., redirects to `/login` or shows an error page instead of `/`), the first three tests ("theme switcher displays proper icons", "can switch between themes", "persistence") will break in an opaque way. Tests for these scenarios already exist in `theme-basic.spec.ts` against `/`, making these implicitly-routed dashboard tests redundant and fragile.
  - Fix: Either add `await mockLocalStorage(page); await mockOctokitInit(page);` to the `beforeEach`, or remove the three duplicate tests and rely on `theme-basic.spec.ts` (which explicitly uses `/`).

### Simplification

- [ ] **[SIMP-037] severity:low** — `theme.spec.ts` and `theme-basic.spec.ts` contain 3 near-identical duplicate tests, doubling CI time for those scenarios
  - Files: `e2e/theme.spec.ts:18-43,65-82` / `e2e/theme-basic.spec.ts:12-43,45-63`
  - Detail: "theme switcher displays proper icons", "can switch between light and dark themes", and "theme preference persists across page reloads" are virtually identical in both files, with the only difference being that `theme.spec.ts` uses `/dashboard` (implicitly redirected) and `theme-basic.spec.ts` uses `/`. The unique tests in `theme.spec.ts` ("dark theme has proper contrast" and "keyboard shortcuts work in both themes") are worth keeping; the duplicates are not.
  - Fix: Delete the three duplicate tests from `theme.spec.ts` and keep only the two tests that genuinely need dashboard context (contrast check, keyboard shortcuts).

- [ ] **[SIMP-038] severity:low** — `page.waitForTimeout(500)` / `page.waitForTimeout(1000)` used 7 times across theme test files instead of deterministic waits
  - Files: `e2e/theme.spec.ts:43,59,69,94,149` / `e2e/theme-basic.spec.ts:32,39,52,59`
  - Detail: Arbitrary `waitForTimeout` calls are a Playwright anti-pattern: too short on slow CI agents → flaky failures; too long on fast machines → wasted time. Theme class application is synchronous (`next-themes` adds the class synchronously on click), so a deterministic wait can be used instead.
  - Fix: Replace `await page.waitForTimeout(500)` after each theme toggle with `await expect(html).toHaveClass(/dark/)` (for switch-to-dark) or `await expect(html).not.toHaveClass(/dark/)` (for switch-to-light). These Playwright auto-retry until the condition is met.

- [ ] **[SIMP-039] severity:low** — `mockBulkActions` in `e2e/utils/github-api-mocks.ts` is exported but never imported or called anywhere
  - File: `e2e/utils/github-api-mocks.ts:39-53`
  - Fix: Delete the function, or add a test that uses it (bulk multi-repo processing error path).

- [ ] **[SIMP-040] severity:low** — `DashboardPage` defines four methods that are never called from any test: `archiveSelectedRepos`, `deleteSelectedRepos`, `getSortDirection`, `sortBy`
  - File: `e2e/pages/dashboard.ts:88-95,135-139,297-319,407-439`
  - Detail: All four are dead test-helper code. `archiveSelectedRepos` and `deleteSelectedRepos` are superseded by the inline open-modal → confirm pattern used in the actual tests. `getSortDirection` and `sortBy` were likely intended for sorting tests but the tests use `columnHeader.click()` directly.
  - Fix: Delete all four dead methods.

### Testing Gaps

- [ ] **[TEST-080] severity:medium** — No E2E test for the "Stop" button during active repository processing
  - File: `e2e/dashboard.spec.ts` — "shows progress during repository processing" reaches the progress modal but never clicks Stop
  - What to test: While processing is in-flight (use a delayed mock, e.g., `mockArchiveRepo(page, name, { delay: 2000 })`), click the Stop button; assert modal transitions to result mode with a "stopped" or "partial" message; verify no further API calls are made after stop.
  - Test type: E2E

- [ ] **[TEST-081] severity:medium** — No E2E test for 401 cascade during processing (matching unit TEST-015)
  - File: `e2e/dashboard.spec.ts` — error test only covers 403; 401 triggers a different code path (early-stop cascade)
  - What to test: Mock archive/delete endpoint to return 401; confirm action; assert modal shows auth error and stops processing all subsequent repos; verify user is prompted to re-authenticate or the session is cleared.
  - Test type: E2E

- [ ] **[TEST-082] severity:medium** — No E2E test for authentication redirect behavior
  - What to test: (a) unauthenticated user navigating to `/dashboard` is redirected to `/`; (b) authenticated user navigating to `/` is redirected to `/dashboard`. Both are critical routing correctness guarantees.
  - Test type: E2E

- [ ] **[TEST-083] severity:low** — `mockGraphQLRepos` in `github-api-mocks.ts` uses `body.query.includes(...)` string matching — same fragility as BUG-049 in `handlers.ts`
  - File: `e2e/utils/github-api-mocks.ts:84,90,106,123`
  - What to test: Not a test gap per se, but a mock infrastructure quality issue: if any GraphQL operation name changes or the query is reformatted, all dependent E2E tests fail with cryptic "No repos to display" or redirect-to-home failures rather than a clear mock miss. Add a catch-all `console.warn` in the final `route.fulfill` branch to log unmatched query types, making failures easier to diagnose.
  - Test type: test infrastructure

- [ ] **[TEST-084] severity:low** — No E2E test for GitHub API rate limit handling
  - What to test: Mock the GitHub GraphQL endpoint to return `{ errors: [{ type: "RATE_LIMITED", message: "..." }] }` with a `Retry-After` header; assert the app shows an informative error state rather than an empty table or a crash.
  - Test type: E2E
