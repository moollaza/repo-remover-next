import { type Selection } from "@heroui/react";
import { type Repository } from "@octokit/graphql-schema";
import { useCallback, useMemo, useState } from "react";

import { REPO_ACTIONS } from "@/config/repo-config";

export interface RepositoryWithKey extends Repository {
  key: string;
}

// Remove unused `all` type from the Selection type
export type SelectionSet = Exclude<Selection, "all">;

export interface UseRepoSelectionProps {
  /**
   * All filtered repos (used for building selectedRepos list)
   */
  filteredRepos: RepositoryWithKey[];
  /**
   * Current page of repos (used for disabledKeys calculation)
   */
  paginatedRepos: RepositoryWithKey[];
  /**
   * Full original repos array (used for "all" selection)
   */
  repos: null | Repository[];
}

export interface UseRepoSelectionReturn {
  /**
   * Whether all selectable repos on the current page are selected
   */
  allSelectableSelected: boolean;
  /**
   * Set of repo IDs that should be disabled in the table
   */
  disabledKeys: Set<string>;
  /**
   * Handle changing the bulk action (archive/delete)
   */
  handleRepoActionChange: (keys: Selection) => void;
  /**
   * Handle selecting/deselecting a single repo row
   */
  handleRowSelect: (repoId: string) => void;
  /**
   * Handle toggling select-all for the current page
   */
  handleSelectAll: () => void;
  /**
   * Handle HeroUI Table's onSelectionChange callback
   */
  handleSelectionChange: (keys: Selection) => void;
  /**
   * Check if a specific repo should be disabled for selection
   */
  isRepoDisabled: (repo: Repository) => boolean;
  /**
   * Repos on the current page that are selectable (not disabled)
   */
  selectableRepos: RepositoryWithKey[];
  /**
   * Currently selected bulk action (archive or delete)
   */
  selectedRepoAction: SelectionSet;
  /**
   * Currently selected repo keys (Selection type from HeroUI)
   */
  selectedRepoKeys: Selection;
  /**
   * Full Repository objects for the selected repos
   */
  selectedRepos: Repository[];
}

/**
 * Custom hook for managing repository selection state.
 *
 * Handles:
 * - Selection state (selectedRepoKeys, selectedRepoAction)
 * - Disabled repo logic (archived repos when archive action is selected)
 * - Select-all / row-select callbacks
 * - Derived lists (selectedRepos, selectableRepos, disabledKeys)
 *
 * @example
 * ```tsx
 * const {
 *   selectedRepoKeys,
 *   selectedRepos,
 *   handleSelectAll,
 *   handleRowSelect,
 *   isRepoDisabled,
 *   disabledKeys,
 * } = useRepoSelection({ filteredRepos, paginatedRepos, repos });
 * ```
 */
export function useRepoSelection({
  paginatedRepos,
  repos,
}: UseRepoSelectionProps): UseRepoSelectionReturn {
  const [selectedRepoKeys, setSelectedRepoKeys] = useState<Selection>(
    new Set(),
  );
  const [selectedRepoAction, setSelectedRepoAction] = useState<SelectionSet>(
    new Set([REPO_ACTIONS[0].key]),
  );

  // Build the list of selected repos based on the keys
  const selectedRepos = useMemo(() => {
    if (selectedRepoKeys === "all") {
      return repos ?? [];
    }
    return repos?.filter((repo) => selectedRepoKeys.has(repo.id)) ?? [];
  }, [repos, selectedRepoKeys]);

  const handleRepoActionChange = useCallback(
    (keys: Selection) => {
      setSelectedRepoAction(keys as SelectionSet);
    },
    [setSelectedRepoAction],
  );

  // Helper function to determine if a repo should be disabled for selection
  const isRepoDisabled = useCallback(
    (repo: Repository): boolean => {
      // If archive action is selected and repo is already archived, disable it
      return selectedRepoAction.has("archive") && repo.isArchived;
    },
    [selectedRepoAction],
  );

  // Get disabled repo keys for the table
  const disabledKeys = useMemo(() => {
    return new Set(
      paginatedRepos.filter(isRepoDisabled).map((repo) => repo.id),
    );
  }, [paginatedRepos, isRepoDisabled]);

  // Repos on the current page that can be selected
  const selectableRepos = useMemo(() => {
    return paginatedRepos.filter((repo) => !isRepoDisabled(repo));
  }, [paginatedRepos, isRepoDisabled]);

  // Whether all selectable repos on the current page are selected
  const allSelectableSelected = useMemo(() => {
    if (selectableRepos.length === 0) return false;
    if (selectedRepoKeys === "all") return true;
    return selectableRepos.every((repo) => selectedRepoKeys.has(repo.id));
  }, [selectableRepos, selectedRepoKeys]);

  // Toggle select-all for the current page
  const handleSelectAll = useCallback(() => {
    if (allSelectableSelected) {
      setSelectedRepoKeys(new Set());
    } else {
      setSelectedRepoKeys(new Set(selectableRepos.map((repo) => repo.id)));
    }
  }, [allSelectableSelected, selectableRepos]);

  // Toggle selection for a single repo
  const handleRowSelect = useCallback((repoId: string) => {
    setSelectedRepoKeys((prev) => {
      const prevSet = prev === "all" ? new Set<string>() : new Set(prev);
      if (prevSet.has(repoId)) {
        prevSet.delete(repoId);
      } else {
        prevSet.add(repoId);
      }
      return prevSet;
    });
  }, []);

  // Handle HeroUI Table's onSelectionChange
  const handleSelectionChange = useCallback((keys: Selection) => {
    setSelectedRepoKeys(keys);
  }, []);

  return {
    allSelectableSelected,
    disabledKeys,
    handleRepoActionChange,
    handleRowSelect,
    handleSelectAll,
    handleSelectionChange,
    isRepoDisabled,
    selectableRepos,
    selectedRepoAction,
    selectedRepoKeys,
    selectedRepos,
  };
}
