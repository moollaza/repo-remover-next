import { type Repository } from "@octokit/graphql-schema";
import { formatDistanceToNow } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  type Selection,
  type SortDescriptor,
  useRepoFilters,
} from "@/hooks/use-repo-filters";
import { useRepoPagination } from "@/hooks/use-repo-pagination";
import {
  type RepositoryWithKey,
  useRepoSelection,
} from "@/hooks/use-repo-selection";
import { debug } from "@/utils/debug";

import ConfirmationModal from "./confirmation-modal";
import RepoFilters from "./repo-filters";

interface RepoTableProps {
  login: null | string;
  repos: null | Repository[];
}

export default function RepoTable({
  login,
  repos,
}: RepoTableProps): JSX.Element {
  // For the confirmation modal
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = useCallback(() => setIsOpen(true), []);
  const onClose = useCallback(() => setIsOpen(false), []);

  // For debugging purposes
  useEffect(() => {
    if (repos?.length) {
      (window as unknown as { repos: typeof repos } & Window).repos = repos;
      debug.group("Repos", true);
      debug.table(repos);
      debug.groupEnd();
    }
  }, [repos]);

  // Add keys to the repos for React to track them
  const reposWithKeys: RepositoryWithKey[] = useMemo(() => {
    if (!repos) return [];

    return repos.map((repo) => ({
      ...repo,
      key: repo.id,
    }));
  }, [repos]);

  // Use custom hooks for filtering, pagination, and selection
  const {
    filteredRepos,
    nameFilter,
    setNameFilter,
    setSortDescriptor,
    setTypeFilters,
    sortDescriptor,
    typeFilters,
  } = useRepoFilters({ login, repos: reposWithKeys });

  const {
    currentPage,
    paginatedItems: paginatedRepos,
    perPage,
    resetPage,
    setCurrentPage,
    setPerPage,
    totalPages,
  } = useRepoPagination({ items: filteredRepos });

  const {
    allSelectableSelected,
    handleRepoActionChange,
    handleRowSelect,
    handleSelectAll,
    isRepoDisabled,
    selectableRepos,
    selectedRepoAction,
    selectedRepoKeys,
    selectedRepos,
  } = useRepoSelection({ filteredRepos, paginatedRepos });

  const handleRepoTypesFilterChange = useCallback(
    (keys: Selection) => {
      setTypeFilters(keys);
      resetPage(); // Reset to page 1 when filters change
    },
    [setTypeFilters, resetPage],
  );

  const handlePerPageChange = useCallback(
    (keys: Selection) => {
      setPerPage(keys);
    },
    [setPerPage],
  );

  const handleRepoActionClick = () => {
    if (selectedRepoAction.has("delete")) {
      debug.log(
        "Deleting selected repos:",
        Array.from(selectedRepoKeys as Set<string>),
      );
    } else if (selectedRepoAction.has("archive")) {
      debug.log(
        "Archiving selected repos:",
        Array.from(selectedRepoKeys as Set<string>),
      );
    }

    // Open the confirmation modal
    onOpen();
  };

  const handleConfirm = useCallback(() => {
    // TODO: Record # of repos deleted/archived?
  }, []);

  // --- Sort handler ---
  const handleSortChange = useCallback(
    (columnKey: string) => {
      setSortDescriptor((prev: SortDescriptor) => {
        if (prev.column === columnKey) {
          // Toggle direction
          return {
            column: columnKey,
            direction:
              prev.direction === "ascending" ? "descending" : "ascending",
          };
        }
        // New column: default to ascending
        return { column: columnKey, direction: "ascending" };
      });
    },
    [setSortDescriptor],
  );

  // --- Pagination ---
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }, [totalPages]);

  return (
    <div className="space-y-4" data-testid="repo-table-container">
      <RepoFilters
        onPerPageChange={handlePerPageChange}
        onRepoActionChange={handleRepoActionChange}
        onRepoActionClick={handleRepoActionClick}
        onRepoTypesFilterChange={handleRepoTypesFilterChange}
        onSearchChange={setNameFilter}
        perPage={perPage}
        repoTypesFilter={typeFilters}
        searchQuery={nameFilter}
        selectedRepoAction={selectedRepoAction}
        selectedRepoKeys={selectedRepoKeys}
      />

      {/* TABLE */}
      <div className="border border-divider rounded-xl overflow-x-auto bg-content1">
        <table
          aria-label="GitHub repositories table"
          className="w-full table-fixed text-sm"
          data-testid="repo-table"
        >
          <thead>
            <tr className="bg-default-100 border-b border-divider">
              {/* Checkbox column */}
              <th className="w-12 px-3 py-3" scope="col">
                <Checkbox
                  aria-label="Select all"
                  checked={allSelectableSelected && selectableRepos.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </th>
              <th
                aria-sort={
                  sortDescriptor.column === "name"
                    ? sortDescriptor.direction
                    : "none"
                }
                className="px-3 py-3 text-left text-xs font-semibold text-default-500 uppercase tracking-wider cursor-pointer select-none hover:bg-default-200 transition-colors"
                data-sortable="true"
                onClick={() => handleSortChange("name")}
                scope="col"
              >
                <span className="inline-flex items-center gap-1">
                  Repository
                  {sortDescriptor.column === "name" && (
                    <span className="text-default-400">
                      {sortDescriptor.direction === "ascending"
                        ? "\u25B2"
                        : "\u25BC"}
                    </span>
                  )}
                </span>
              </th>
              <th
                className="hidden xl:table-cell px-3 py-3 text-left text-xs font-semibold text-default-500 uppercase tracking-wider"
                scope="col"
              >
                Owner
              </th>
              <th
                className="hidden xl:table-cell px-3 py-3 text-left text-xs font-semibold text-default-500 uppercase tracking-wider"
                scope="col"
              >
                Status
              </th>
              <th
                aria-sort={
                  sortDescriptor.column === "updatedAt"
                    ? sortDescriptor.direction
                    : "none"
                }
                className="px-3 py-3 text-left text-xs font-semibold text-default-500 uppercase tracking-wider cursor-pointer select-none hover:bg-default-200 transition-colors"
                data-sortable="true"
                onClick={() => handleSortChange("updatedAt")}
                scope="col"
              >
                <span className="inline-flex items-center gap-1">
                  Last Updated
                  {sortDescriptor.column === "updatedAt" && (
                    <span className="text-default-400">
                      {sortDescriptor.direction === "ascending"
                        ? "\u25B2"
                        : "\u25BC"}
                    </span>
                  )}
                </span>
              </th>
            </tr>
          </thead>

          {/* TABLE BODY */}
          <tbody>
            {paginatedRepos.length === 0 ? (
              <tr>
                <td
                  className="px-3 py-8 text-center text-default-500"
                  colSpan={5}
                >
                  No repos to display.
                </td>
              </tr>
            ) : (
              paginatedRepos.map((repo) => {
                const disabled = isRepoDisabled(repo);
                const isSelected =
                  selectedRepoKeys === "all" || selectedRepoKeys.has(repo.id);

                return (
                  <tr
                    className={`border-b border-divider/50 transition-colors ${
                      disabled
                        ? "pointer-events-none opacity-50"
                        : "hover:bg-default-50"
                    } ${isSelected && !disabled ? "bg-primary/5" : ""}`}
                    data-testid="repo-row"
                    key={repo.id}
                  >
                    {/* Checkbox */}
                    <td className="w-12 px-3 py-3">
                      <Checkbox
                        aria-label={repo.name}
                        checked={isSelected && !disabled}
                        disabled={disabled}
                        onCheckedChange={() => handleRowSelect(repo.id)}
                      />
                    </td>

                    {/* Repository — name + description + MOBILE-ONLY pills */}
                    <td className="px-3 py-3">
                      <div data-testid="repo-details">
                        <div className="mb-1" data-testid="repo-name">
                          <a
                            className="font-medium text-[var(--brand-link)] hover:underline"
                            href={repo.url as string}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            {repo.name}
                          </a>
                        </div>

                        {/* Mobile-only: show pills inline (hidden on lg:) */}
                        <div
                          className="flex gap-1.5 mb-1.5 flex-wrap xl:hidden"
                          data-testid="repo-tags"
                        >
                          {repo.owner.login !== login && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-default-100 text-default-500 border border-divider">
                              {repo.owner.login}
                            </span>
                          )}
                          {repo.isPrivate && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-default-100 text-default-500 border border-divider">
                              Private
                            </span>
                          )}
                          {repo.isInOrganization && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-default-100 text-default-500 border border-divider">
                              Org
                            </span>
                          )}
                          {repo.isFork && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-default-100 text-default-500 border border-divider">
                              Fork
                            </span>
                          )}
                          {repo.isArchived && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              Archived
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <div
                          className="text-xs text-default-400"
                          data-testid="repo-description"
                        >
                          {repo.description ?? <i>No description</i>}
                        </div>
                      </div>
                    </td>

                    {/* Owner — desktop only */}
                    <td
                      className="hidden xl:table-cell px-3 py-3"
                      data-testid="repo-owner"
                    >
                      {repo.owner.login !== login ? (
                        <a
                          className="text-xs text-[var(--brand-link)] hover:underline"
                          href={repo.owner.url as string}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {repo.owner.login}
                        </a>
                      ) : (
                        <span className="text-xs text-default-400">
                          {repo.owner.login}
                        </span>
                      )}
                    </td>

                    {/* Status — desktop only */}
                    <td className="hidden xl:table-cell px-3 py-3">
                      <div
                        className="flex gap-1.5 flex-wrap"
                        data-testid="repo-tags"
                      >
                        {repo.isPrivate && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-default-100 text-default-500 border border-divider">
                            Private
                          </span>
                        )}
                        {!repo.isPrivate && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            Public
                          </span>
                        )}
                        {repo.isInOrganization && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-default-100 text-default-500 border border-divider">
                            Org
                          </span>
                        )}
                        {repo.isFork && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-default-100 text-default-500 border border-divider">
                            Fork
                          </span>
                        )}
                        {repo.isArchived && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            Archived
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Last Updated */}
                    <td
                      className="px-3 py-3 text-default-400 whitespace-nowrap"
                      data-testid="repo-updated-at"
                      title={
                        repo.updatedAt
                          ? new Date(repo.updatedAt as string).toLocaleString(
                              navigator.language,
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "Unknown"
                      }
                    >
                      {repo.updatedAt
                        ? formatDistanceToNow(
                            new Date(repo.updatedAt as string),
                          )
                        : "Unknown"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION - Outside table border */}
      {totalPages > 1 && (
        <div
          className="flex w-full justify-center"
          data-testid="table-pagination"
        >
          <nav
            aria-label="Pagination"
            className="inline-flex items-center gap-1"
          >
            <button
              aria-label="prev"
              className="px-3 py-1.5 rounded-lg text-sm border border-divider bg-content1 text-foreground hover:bg-content2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              type="button"
            >
              &lsaquo;
            </button>
            {pageNumbers.map((page) => (
              <button
                aria-current={page === currentPage ? "true" : undefined}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  page === currentPage
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "border-divider bg-content1 text-foreground hover:bg-content2"
                }`}
                key={page}
                onClick={() => setCurrentPage(page)}
                type="button"
              >
                {page}
              </button>
            ))}
            <button
              aria-label="next"
              className="px-3 py-1.5 rounded-lg text-sm border border-divider bg-content1 text-foreground hover:bg-content2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              type="button"
            >
              &rsaquo;
            </button>
          </nav>
        </div>
      )}

      {/* CONFIRMATION MODAL — login derived from first selected repo's owner if prop is null */}
      {repos && selectedRepos && (
        <ConfirmationModal
          action={Array.from(selectedRepoAction)[0] as "archive" | "delete"}
          data-testid="repo-confirmation-modal"
          isOpen={isOpen}
          login={login ?? selectedRepos[0]?.owner?.login ?? ""}
          onClose={onClose}
          onConfirm={handleConfirm}
          repos={selectedRepos}
        />
      )}
    </div>
  );
}
