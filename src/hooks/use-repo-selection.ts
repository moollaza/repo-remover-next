import { type Repository } from "@octokit/graphql-schema";
import { useCallback, useMemo, useState } from "react";

import { type Selection } from "@/hooks/use-repo-filters";

// --- Types ---

export interface UseRepoSelectionProps {
  /** Keys of repos that cannot be selected (e.g. locked or already archived) */
  disabledKeys: Set<string>;
  /** All repos matching the current filters (not just current page) */
  filteredRepos: Repository[];
  /** Callback to determine if a repo should be disabled */
  isRepoDisabled: (repo: Repository) => boolean;
  /** Repos on the current page */
  paginatedRepos: Repository[];
}

export interface UseRepoSelectionReturn {
  /** Whether all selectable repos on the current page are selected */
  allSelectableSelected: boolean;
  /** Toggle a single row's selection state */
  handleRowSelect: (repoId: string) => void;
  /** Toggle select-all for all filtered (not just paginated) repos */
  handleSelectAll: () => void;
  /** Selectable repos on the current page (excludes disabled) */
  selectableRepos: Repository[];
  /** The resolved list of selected Repository objects */
  selectedRepos: Repository[];
  /** Current selection state (Set of IDs or "all") */
  selectedRepoKeys: Selection;
  /** Set selection state directly (for external control if needed) */
  setSelectedRepoKeys: React.Dispatch<React.SetStateAction<Selection>>;
}

/**
 * Custom hook for managing repository selection state.
 *
 * Handles:
 * - Individual row selection/deselection
 * - Select all / deselect all across all filtered repos
 * - Disabled key awareness (skips locked/archived repos)
 * - Resolving selected keys to Repository objects
 *
 * @example
 * ```tsx
 * const {
 *   selectedRepoKeys,
 *   selectedRepos,
 *   allSelectableSelected,
 *   selectableRepos,
 *   handleSelectAll,
 *   handleRowSelect,
 * } = useRepoSelection({ disabledKeys, filteredRepos, isRepoDisabled, paginatedRepos });
 * ```
 */
export function useRepoSelection({
  disabledKeys,
  filteredRepos,
  isRepoDisabled,
  paginatedRepos,
}: UseRepoSelectionProps): UseRepoSelectionReturn {
  const [selectedRepoKeys, setSelectedRepoKeys] = useState<Selection>(
    new Set(),
  );

  // Build the list of selected repos based on the keys
  const selectedRepos = useMemo(() => {
    if (selectedRepoKeys === "all") {
      return filteredRepos;
    }
    return filteredRepos.filter((repo) => selectedRepoKeys.has(repo.id));
  }, [filteredRepos, selectedRepoKeys]);

  const selectableRepos = useMemo(
    () => paginatedRepos.filter((r) => !disabledKeys.has(r.id)),
    [paginatedRepos, disabledKeys],
  );

  const allSelectableSelected = useMemo(() => {
    if (selectedRepoKeys === "all") return true;
    if (selectableRepos.length === 0) return false;
    return selectableRepos.every((r) => selectedRepoKeys.has(r.id));
  }, [selectedRepoKeys, selectableRepos]);

  const handleSelectAll = useCallback(() => {
    if (allSelectableSelected) {
      // Deselect all
      setSelectedRepoKeys(new Set());
    } else {
      // Select all filteredRepos (not just current page) to match HeroUI "all" behavior
      const allIds = new Set(
        filteredRepos.filter((r) => !isRepoDisabled(r)).map((r) => r.id),
      );
      setSelectedRepoKeys(allIds);
    }
  }, [allSelectableSelected, filteredRepos, isRepoDisabled]);

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
    handleRowSelect,
    handleSelectAll,
    selectableRepos,
    selectedRepoKeys,
    selectedRepos,
    setSelectedRepoKeys,
  };
}
