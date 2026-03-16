import { type Repository } from "@octokit/graphql-schema";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { type RepositoryWithKey, useRepoSelection } from "./use-repo-selection";

// Helper to create a mock repository with key
function createMockRepo(
  overrides: {
    key?: string;
    owner?: { login: string; url: string };
  } & Partial<Omit<Repository, "owner">> = {},
): RepositoryWithKey {
  const id = overrides.id ?? "repo-1";
  return {
    description: "A test repository",
    id,
    isArchived: false,
    isDisabled: false,
    isFork: false,
    isInOrganization: false,
    isLocked: false,
    isMirror: false,
    isPrivate: false,
    isTemplate: false,
    key: overrides.key ?? id,
    name: "test-repo",
    owner: {
      login: "testuser",
      url: "https://github.com/testuser",
    },
    updatedAt: "2024-01-01T00:00:00Z",
    url: "https://github.com/testuser/test-repo",
    viewerCanAdminister: true,
    ...overrides,
  } as RepositoryWithKey;
}

describe("useRepoSelection", () => {
  const defaultProps = {
    filteredRepos: [] as RepositoryWithKey[],
    paginatedRepos: [] as RepositoryWithKey[],
    repos: [] as Repository[],
  };

  it("should initialize with empty selection and archive action", () => {
    const { result } = renderHook(() => useRepoSelection(defaultProps));

    expect(result.current.selectedRepoKeys).toEqual(new Set());
    expect(result.current.selectedRepoAction.has("archive")).toBe(true);
    expect(result.current.selectedRepos).toEqual([]);
  });

  describe("isRepoDisabled", () => {
    it("returns true for archived repos when archive action is selected", () => {
      const archivedRepo = createMockRepo({ isArchived: true });
      const { result } = renderHook(() => useRepoSelection(defaultProps));

      // Default action is archive
      expect(result.current.isRepoDisabled(archivedRepo)).toBe(true);
    });

    it("returns false for non-archived repos when archive action is selected", () => {
      const activeRepo = createMockRepo({ isArchived: false });
      const { result } = renderHook(() => useRepoSelection(defaultProps));

      expect(result.current.isRepoDisabled(activeRepo)).toBe(false);
    });

    it("returns false for archived repos when delete action is selected", () => {
      const archivedRepo = createMockRepo({ isArchived: true });
      const { result } = renderHook(() => useRepoSelection(defaultProps));

      // Switch to delete action
      act(() => {
        result.current.handleRepoActionChange(new Set(["delete"]));
      });

      expect(result.current.isRepoDisabled(archivedRepo)).toBe(false);
    });
  });

  describe("handleRowSelect", () => {
    it("toggles selection on", () => {
      const repo = createMockRepo({ id: "repo-1", key: "repo-1" });
      const repos = [repo];
      const { result } = renderHook(() =>
        useRepoSelection({
          filteredRepos: repos,
          paginatedRepos: repos,
          repos,
        }),
      );

      act(() => {
        result.current.handleRowSelect("repo-1");
      });

      expect(
        (result.current.selectedRepoKeys as Set<string>).has("repo-1"),
      ).toBe(true);
    });

    it("toggles selection off", () => {
      const repo = createMockRepo({ id: "repo-1", key: "repo-1" });
      const repos = [repo];
      const { result } = renderHook(() =>
        useRepoSelection({
          filteredRepos: repos,
          paginatedRepos: repos,
          repos,
        }),
      );

      // Select then deselect
      act(() => {
        result.current.handleRowSelect("repo-1");
      });
      act(() => {
        result.current.handleRowSelect("repo-1");
      });

      expect(
        (result.current.selectedRepoKeys as Set<string>).has("repo-1"),
      ).toBe(false);
    });
  });

  describe("handleSelectAll", () => {
    it("selects all non-disabled repos on the current page", () => {
      const repos = [
        createMockRepo({
          id: "repo-1",
          isArchived: false,
          key: "repo-1",
          name: "active-1",
        }),
        createMockRepo({
          id: "repo-2",
          isArchived: false,
          key: "repo-2",
          name: "active-2",
        }),
        createMockRepo({
          id: "repo-3",
          isArchived: true,
          key: "repo-3",
          name: "archived-1",
        }),
      ];
      const { result } = renderHook(() =>
        useRepoSelection({
          filteredRepos: repos,
          paginatedRepos: repos,
          repos,
        }),
      );

      act(() => {
        result.current.handleSelectAll();
      });

      const selected = result.current.selectedRepoKeys as Set<string>;
      expect(selected.has("repo-1")).toBe(true);
      expect(selected.has("repo-2")).toBe(true);
      // Archived repo should NOT be selected (disabled when archive action)
      expect(selected.has("repo-3")).toBe(false);
    });

    it("deselects all when all selectable are already selected", () => {
      const repos = [
        createMockRepo({ id: "repo-1", isArchived: false, key: "repo-1" }),
        createMockRepo({ id: "repo-2", isArchived: false, key: "repo-2" }),
      ];
      const { result } = renderHook(() =>
        useRepoSelection({
          filteredRepos: repos,
          paginatedRepos: repos,
          repos,
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
      expect((result.current.selectedRepoKeys as Set<string>).size).toBe(0);
    });
  });

  describe("disabledKeys", () => {
    it("includes archived repos when archive action is selected", () => {
      const repos = [
        createMockRepo({ id: "active-1", isArchived: false, key: "active-1" }),
        createMockRepo({
          id: "archived-1",
          isArchived: true,
          key: "archived-1",
        }),
        createMockRepo({
          id: "archived-2",
          isArchived: true,
          key: "archived-2",
        }),
      ];
      const { result } = renderHook(() =>
        useRepoSelection({
          filteredRepos: repos,
          paginatedRepos: repos,
          repos,
        }),
      );

      // Default action is archive
      expect(result.current.disabledKeys.has("archived-1")).toBe(true);
      expect(result.current.disabledKeys.has("archived-2")).toBe(true);
      expect(result.current.disabledKeys.has("active-1")).toBe(false);
    });

    it("does not include archived repos when delete action is selected", () => {
      const repos = [
        createMockRepo({ id: "active-1", isArchived: false, key: "active-1" }),
        createMockRepo({
          id: "archived-1",
          isArchived: true,
          key: "archived-1",
        }),
      ];
      const { result } = renderHook(() =>
        useRepoSelection({
          filteredRepos: repos,
          paginatedRepos: repos,
          repos,
        }),
      );

      // Switch to delete action
      act(() => {
        result.current.handleRepoActionChange(new Set(["delete"]));
      });

      expect(result.current.disabledKeys.has("archived-1")).toBe(false);
      expect(result.current.disabledKeys.has("active-1")).toBe(false);
    });
  });

  describe("selectableRepos", () => {
    it("excludes disabled repos", () => {
      const repos = [
        createMockRepo({ id: "active-1", isArchived: false, key: "active-1" }),
        createMockRepo({
          id: "archived-1",
          isArchived: true,
          key: "archived-1",
        }),
      ];
      const { result } = renderHook(() =>
        useRepoSelection({
          filteredRepos: repos,
          paginatedRepos: repos,
          repos,
        }),
      );

      // Default action is archive, so archived repos are disabled
      expect(result.current.selectableRepos).toHaveLength(1);
      expect(result.current.selectableRepos[0].id).toBe("active-1");
    });
  });

  describe("selectedRepos", () => {
    it("returns full Repository objects for selected keys", () => {
      const repos = [
        createMockRepo({ id: "repo-1", key: "repo-1", name: "first" }),
        createMockRepo({ id: "repo-2", key: "repo-2", name: "second" }),
      ];
      const { result } = renderHook(() =>
        useRepoSelection({
          filteredRepos: repos,
          paginatedRepos: repos,
          repos,
        }),
      );

      act(() => {
        result.current.handleRowSelect("repo-1");
      });

      expect(result.current.selectedRepos).toHaveLength(1);
      expect(result.current.selectedRepos[0].name).toBe("first");
    });
  });

  describe("handleSelectionChange", () => {
    it("updates selectedRepoKeys", () => {
      const repos = [
        createMockRepo({ id: "repo-1", key: "repo-1" }),
        createMockRepo({ id: "repo-2", key: "repo-2" }),
      ];
      const { result } = renderHook(() =>
        useRepoSelection({
          filteredRepos: repos,
          paginatedRepos: repos,
          repos,
        }),
      );

      act(() => {
        result.current.handleSelectionChange(new Set(["repo-1", "repo-2"]));
      });

      const selected = result.current.selectedRepoKeys as Set<string>;
      expect(selected.has("repo-1")).toBe(true);
      expect(selected.has("repo-2")).toBe(true);
    });
  });

  describe("handleRepoActionChange", () => {
    it("switches from archive to delete action", () => {
      const { result } = renderHook(() => useRepoSelection(defaultProps));

      expect(result.current.selectedRepoAction.has("archive")).toBe(true);

      act(() => {
        result.current.handleRepoActionChange(new Set(["delete"]));
      });

      expect(result.current.selectedRepoAction.has("delete")).toBe(true);
      expect(result.current.selectedRepoAction.has("archive")).toBe(false);
    });
  });
});
