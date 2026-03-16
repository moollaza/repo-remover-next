import { type Selection, type SortDescriptor } from "@heroui/react";
import { type Repository } from "@octokit/graphql-schema";
import { useCallback, useMemo, useState } from "react";

import { COLUMNS, REPO_TYPES } from "@/config/repo-config";
import { type RepositoryWithKey } from "@/hooks/use-repo-selection";

export interface UseRepoFiltersProps {
  /**
   * Current user's GitHub login for permission filtering
   */
  login: null | string;
  /**
   * Array of repositories to filter and sort
   */
  repos: RepositoryWithKey[];
}

export interface UseRepoFiltersReturn {
  /**
   * Filtered and sorted repositories
   */
  filteredRepos: RepositoryWithKey[];
  /**
   * Handle sort change from HeroUI Table's onSortChange
   */
  handleSortChange: (descriptor: SortDescriptor) => void;
  /**
   * Current search query for filtering by name/description
   */
  nameFilter: string;
  /**
   * Update the search query
   */
  setNameFilter: (query: string) => void;
  /**
   * Update the type filters and reset pagination
   */
  setTypeFilters: (keys: Selection) => void;
  /**
   * Current sort configuration
   */
  sortDescriptor: SortDescriptor;
  /**
   * Set of selected repository type filters
   */
  typeFilters: SelectionSet;
}

// Remove unused `all` type from the Selection type
type SelectionSet = Exclude<Selection, "all">;

/**
 * Custom hook for filtering and sorting repositories.
 *
 * Handles:
 * - Search filtering by name and description
 * - Type filtering (private, fork, archived, etc.)
 * - Permission filtering (only show repos user can administer)
 * - Sorting by column (name, updatedAt)
 *
 * @example
 * ```tsx
 * const {
 *   filteredRepos,
 *   handleSortChange,
 *   nameFilter,
 *   setNameFilter,
 *   typeFilters,
 *   setTypeFilters,
 *   sortDescriptor
 * } = useRepoFilters({ repos: reposWithKeys, login: user.login });
 *
 * // Pass handleSortChange to HeroUI Table's onSortChange
 * <Table onSortChange={handleSortChange} sortDescriptor={sortDescriptor} />
 * ```
 */
export function useRepoFilters({
  login,
  repos,
}: UseRepoFiltersProps): UseRepoFiltersReturn {
  const [nameFilter, setNameFilter] = useState("");
  const [typeFilters, setTypeFiltersState] = useState<SelectionSet>(
    new Set(REPO_TYPES.map((type) => type.key)),
  );
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: COLUMNS.updatedAt.key,
    direction: "descending",
  });

  // Callback for type filter changes that can trigger pagination reset in parent
  const setTypeFilters = useCallback((keys: Selection) => {
    setTypeFiltersState(keys as SelectionSet);
  }, []);

  // Handle sort change from HeroUI Table's onSortChange
  const handleSortChange = useCallback((descriptor: SortDescriptor) => {
    setSortDescriptor(descriptor);
  }, []);

  // First filter repos by search query, selected types, and admin permissions
  const filteredByQueryAndType = useMemo(() => {
    if (!repos) return [];

    return repos.filter((repo) => {
      // Check if user can administer this repo (either they own it or have admin rights)
      const canAdminister =
        repo.owner.login === login || repo.viewerCanAdminister === true;

      // If user can't administer this repo, filter it out
      if (!canAdminister) return false;

      const matchesSearchQuery =
        repo.name.toLowerCase().includes(nameFilter.toLowerCase()) ||
        repo.description?.toLowerCase().includes(nameFilter.toLowerCase());

      const matchesType =
        // For each type, if it is not selected, we check if the repo has it and return false
        REPO_TYPES.every((type) => {
          // If the type is not selected, check if the repo has it and return false
          if (!typeFilters.has(type.key)) {
            if (repo[type.key as keyof Repository]) {
              return false;
            }
            return true;
          }
          return true;
        });

      return matchesSearchQuery && matchesType;
    });
  }, [repos, nameFilter, typeFilters, login]);

  // Then sort the filtered repos
  const filteredRepos = useMemo(() => {
    return [...filteredByQueryAndType].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof Repository] as string;
      const second = b[sortDescriptor.column as keyof Repository] as string;

      let cmp = 0;

      if (sortDescriptor.column === COLUMNS.name.key) {
        cmp = first.localeCompare(second);
      } else if (sortDescriptor.column === COLUMNS.updatedAt.key) {
        cmp = new Date(first).getTime() - new Date(second).getTime();
      }

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [filteredByQueryAndType, sortDescriptor]);

  return {
    filteredRepos,
    handleSortChange,
    nameFilter,
    setNameFilter,
    setTypeFilters,
    sortDescriptor,
    typeFilters,
  };
}
