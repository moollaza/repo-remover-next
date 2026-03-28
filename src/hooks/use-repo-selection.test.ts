import { type Repository } from "@octokit/graphql-schema";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useRepoSelection } from "./use-repo-selection";

// Helper to create a minimal mock repository
function createMockRepo(overrides: Partial<Repository> = {}): Repository {
  return {
    description: "A test repository",
    id: "repo-1",
    isArchived: false,
    isDisabled: false,
    isFork: false,
    isInOrganization: false,
    isLocked: false,
    isMirror: false,
    isPrivate: false,
    isTemplate: false,
    name: "test-repo",
    owner: {
      login: "testuser",
      url: "https://github.com/testuser",
    },
    updatedAt: "2024-01-01T00:00:00Z",
    url: "https://github.com/testuser/test-repo",
    viewerCanAdminister: true,
    ...overrides,
  } as Repository;
}

const defaultIsRepoDisabled = () => false;

describe("useRepoSelection", () => {
  it("should initialize with empty selection", () => {
    const repos = [
      createMockRepo({ id: "1", name: "repo-1" }),
      createMockRepo({ id: "2", name: "repo-2" }),
    ];

    const { result } = renderHook(() =>
      useRepoSelection({
        disabledKeys: new Set(),
        filteredRepos: repos,
        isRepoDisabled: defaultIsRepoDisabled,
        paginatedRepos: repos,
      }),
    );

    expect(result.current.selectedRepoKeys).toEqual(new Set());
    expect(result.current.selectedRepos).toEqual([]);
    expect(result.current.allSelectableSelected).toBe(false);
  });

  it("should select a single repo via handleRowSelect", () => {
    const repos = [
      createMockRepo({ id: "1", name: "repo-1" }),
      createMockRepo({ id: "2", name: "repo-2" }),
    ];

    const { result } = renderHook(() =>
      useRepoSelection({
        disabledKeys: new Set(),
        filteredRepos: repos,
        isRepoDisabled: defaultIsRepoDisabled,
        paginatedRepos: repos,
      }),
    );

    act(() => {
      result.current.handleRowSelect("1");
    });

    expect(result.current.selectedRepoKeys).toEqual(new Set(["1"]));
    expect(result.current.selectedRepos).toHaveLength(1);
    expect(result.current.selectedRepos[0].name).toBe("repo-1");
  });

  it("should deselect a repo when toggled again", () => {
    const repos = [createMockRepo({ id: "1", name: "repo-1" })];

    const { result } = renderHook(() =>
      useRepoSelection({
        disabledKeys: new Set(),
        filteredRepos: repos,
        isRepoDisabled: defaultIsRepoDisabled,
        paginatedRepos: repos,
      }),
    );

    act(() => {
      result.current.handleRowSelect("1");
    });
    expect(result.current.selectedRepoKeys).toEqual(new Set(["1"]));

    act(() => {
      result.current.handleRowSelect("1");
    });
    expect(result.current.selectedRepoKeys).toEqual(new Set());
    expect(result.current.selectedRepos).toHaveLength(0);
  });

  it("should not select a disabled repo", () => {
    const repos = [
      createMockRepo({ id: "1", name: "repo-1" }),
      createMockRepo({ id: "2", name: "disabled-repo" }),
    ];

    const { result } = renderHook(() =>
      useRepoSelection({
        disabledKeys: new Set(["2"]),
        filteredRepos: repos,
        isRepoDisabled: (r) => r.id === "2",
        paginatedRepos: repos,
      }),
    );

    act(() => {
      result.current.handleRowSelect("2");
    });

    expect(result.current.selectedRepoKeys).toEqual(new Set());
    expect(result.current.selectedRepos).toHaveLength(0);
  });

  it("should select all selectable repos via handleSelectAll", () => {
    const repos = [
      createMockRepo({ id: "1", name: "repo-1" }),
      createMockRepo({ id: "2", name: "repo-2" }),
      createMockRepo({ id: "3", name: "repo-3" }),
    ];

    const { result } = renderHook(() =>
      useRepoSelection({
        disabledKeys: new Set(),
        filteredRepos: repos,
        isRepoDisabled: defaultIsRepoDisabled,
        paginatedRepos: repos,
      }),
    );

    act(() => {
      result.current.handleSelectAll();
    });

    expect(result.current.selectedRepoKeys).toEqual(new Set(["1", "2", "3"]));
    expect(result.current.selectedRepos).toHaveLength(3);
    expect(result.current.allSelectableSelected).toBe(true);
  });

  it("should deselect all when handleSelectAll called with all selected", () => {
    const repos = [
      createMockRepo({ id: "1", name: "repo-1" }),
      createMockRepo({ id: "2", name: "repo-2" }),
    ];

    const { result } = renderHook(() =>
      useRepoSelection({
        disabledKeys: new Set(),
        filteredRepos: repos,
        isRepoDisabled: defaultIsRepoDisabled,
        paginatedRepos: repos,
      }),
    );

    // Select all
    act(() => {
      result.current.handleSelectAll();
    });
    expect(result.current.allSelectableSelected).toBe(true);

    // Deselect all
    act(() => {
      result.current.handleSelectAll();
    });
    expect(result.current.selectedRepoKeys).toEqual(new Set());
    expect(result.current.selectedRepos).toHaveLength(0);
    expect(result.current.allSelectableSelected).toBe(false);
  });

  it("should skip disabled repos when selecting all", () => {
    const repos = [
      createMockRepo({ id: "1", name: "repo-1" }),
      createMockRepo({ id: "2", isArchived: true, name: "disabled-repo" }),
      createMockRepo({ id: "3", name: "repo-3" }),
    ];

    const isRepoDisabled = (r: Repository) => r.isArchived;

    const { result } = renderHook(() =>
      useRepoSelection({
        disabledKeys: new Set(["2"]),
        filteredRepos: repos,
        isRepoDisabled,
        paginatedRepos: repos,
      }),
    );

    act(() => {
      result.current.handleSelectAll();
    });

    // Only non-disabled repos should be selected
    expect(result.current.selectedRepoKeys).toEqual(new Set(["1", "3"]));
    expect(result.current.selectedRepos).toHaveLength(2);
  });

  it("should report allSelectableSelected correctly when no selectable repos exist", () => {
    const repos = [
      createMockRepo({ id: "1", isArchived: true, name: "disabled-1" }),
      createMockRepo({ id: "2", isArchived: true, name: "disabled-2" }),
    ];

    const { result } = renderHook(() =>
      useRepoSelection({
        disabledKeys: new Set(["1", "2"]),
        filteredRepos: repos,
        isRepoDisabled: () => true,
        paginatedRepos: repos,
      }),
    );

    expect(result.current.allSelectableSelected).toBe(false);
    expect(result.current.selectableRepos).toHaveLength(0);
  });

  it("should compute selectableRepos excluding disabled keys", () => {
    const repos = [
      createMockRepo({ id: "1", name: "repo-1" }),
      createMockRepo({ id: "2", name: "disabled-repo" }),
      createMockRepo({ id: "3", name: "repo-3" }),
    ];

    const { result } = renderHook(() =>
      useRepoSelection({
        disabledKeys: new Set(["2"]),
        filteredRepos: repos,
        isRepoDisabled: (r) => r.id === "2",
        paginatedRepos: repos,
      }),
    );

    expect(result.current.selectableRepos).toHaveLength(2);
    expect(result.current.selectableRepos.map((r) => r.id)).toEqual(["1", "3"]);
  });

  it("should handle empty repos list", () => {
    const { result } = renderHook(() =>
      useRepoSelection({
        disabledKeys: new Set(),
        filteredRepos: [],
        isRepoDisabled: defaultIsRepoDisabled,
        paginatedRepos: [],
      }),
    );

    expect(result.current.selectedRepoKeys).toEqual(new Set());
    expect(result.current.selectedRepos).toHaveLength(0);
    expect(result.current.allSelectableSelected).toBe(false);
    expect(result.current.selectableRepos).toHaveLength(0);
  });

  it("should handle selecting multiple repos individually", () => {
    const repos = [
      createMockRepo({ id: "1", name: "repo-1" }),
      createMockRepo({ id: "2", name: "repo-2" }),
      createMockRepo({ id: "3", name: "repo-3" }),
    ];

    const { result } = renderHook(() =>
      useRepoSelection({
        disabledKeys: new Set(),
        filteredRepos: repos,
        isRepoDisabled: defaultIsRepoDisabled,
        paginatedRepos: repos,
      }),
    );

    act(() => {
      result.current.handleRowSelect("1");
    });
    act(() => {
      result.current.handleRowSelect("3");
    });

    expect(result.current.selectedRepoKeys).toEqual(new Set(["1", "3"]));
    expect(result.current.selectedRepos).toHaveLength(2);
  });

  it("should correctly derive selectedRepos from filteredRepos and keys", () => {
    const allRepos = [
      createMockRepo({ id: "1", name: "repo-1" }),
      createMockRepo({ id: "2", name: "repo-2" }),
      createMockRepo({ id: "3", name: "repo-3" }),
    ];
    // Simulate pagination: only first 2 on current page
    const paginatedRepos = allRepos.slice(0, 2);

    const { result } = renderHook(() =>
      useRepoSelection({
        disabledKeys: new Set(),
        filteredRepos: allRepos,
        isRepoDisabled: defaultIsRepoDisabled,
        paginatedRepos,
      }),
    );

    // Select all (should include all filtered repos, not just paginated)
    act(() => {
      result.current.handleSelectAll();
    });

    expect(result.current.selectedRepos).toHaveLength(3);
  });
});
