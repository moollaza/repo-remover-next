import { type Repository } from "@octokit/graphql-schema";
import { useCallback, useMemo, useState } from "react";

import { REPO_ACTIONS } from "@/config/repo-config";

import { type Selection, type SelectionSet } from "./use-repo-filters";

export interface RepositoryWithKey extends Repository {
  key: string;
}

export interface UseRepoSelectionProps {
  /**
   * All filtered repos (used for building selectedRepos list and select-all)
   */
  filteredRepos: RepositoryWithKey[];
  /**
   * Current page of repos (used for disabledKeys and selectableRepos)
   */
  paginatedRepos: RepositoryWithKey[];
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
   * Handle toggling select-all
   */
  handleSelectAll: () => void;
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
   * Currently selected repo keys (Selection type)
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
 * - Disabled repo logic (locked repos, archived repos when archive action)
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
 * } = useRepoSelection({ filteredRepos, paginatedRepos });
 * ```
 */
export function useRepoSelection({
  filteredRepos,
  paginatedRepos,
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
      return filteredRepos;
    }
    return filteredRepos.filter((repo) => selectedRepoKeys.has(repo.id));
  }, [filteredRepos, selectedRepoKeys]);

  const handleRepoActionChange = useCallback(
    (keys: Selection) => {
      setSelectedRepoAction(keys as SelectionSet);
    },
    [setSelectedRepoAction],
  );

  // Helper function to determine if a repo should be disabled for selection
  const isRepoDisabled = useCallback(
    (repo: Repository): boolean => {
      // Locked repos cannot be archived or deleted — they will 403/422
      if (repo.isLocked) return true;
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
  const selectableRepos = useMemo(
    () => paginatedRepos.filter((r) => !disabledKeys.has(r.id)),
    [paginatedRepos, disabledKeys],
  );

  // Whether all selectable repos on the current page are selected
  const allSelectableSelected = useMemo(() => {
    if (selectedRepoKeys === "all") return true;
    if (selectableRepos.length === 0) return false;
    return selectableRepos.every((r) => selectedRepoKeys.has(r.id));
  }, [selectedRepoKeys, selectableRepos]);

  // Toggle select-all: selects all filteredRepos (not just current page) to match "all" behavior
  const handleSelectAll = useCallback(() => {
    if (allSelectableSelected) {
      // Deselect all
      setSelectedRepoKeys(new Set());
    } else {
      // Select all filteredRepos that aren't disabled
      const allIds = new Set(
        filteredRepos.filter((r) => !isRepoDisabled(r)).map((r) => r.id),
      );
      setSelectedRepoKeys(allIds);
    }
  }, [allSelectableSelected, filteredRepos, isRepoDisabled]);

  // Toggle selection for a single repo
  const handleRowSelect = useCallback(
    (repoId: string) => {
      if (disabledKeys.has(repoId)) return;

      setSelectedRepoKeys((prev) => {
        const prevSet =
          prev === "all"
            ? new Set(filteredRepos.map((r) => r.id))
            : new Set(prev);
        if (prevSet.has(repoId)) {
          prevSet.delete(repoId);
        } else {
          prevSet.add(repoId);
        }
        return prevSet;
      });
    },
    [disabledKeys, filteredRepos],
  );

  return {
    allSelectableSelected,
    disabledKeys,
    handleRepoActionChange,
    handleRowSelect,
    handleSelectAll,
    isRepoDisabled,
    selectableRepos,
    selectedRepoAction,
    selectedRepoKeys,
    selectedRepos,
  };
}
