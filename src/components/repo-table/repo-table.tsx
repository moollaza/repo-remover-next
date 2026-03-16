import {
  Chip,
  Link,
  Pagination,
  type Selection,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
} from "@heroui/react";
import { type Repository } from "@octokit/graphql-schema";
import { formatDistanceToNow } from "date-fns";
import { useCallback, useEffect, useMemo } from "react";

import { COLUMN_ORDER } from "@/config/repo-config";
import { useRepoFilters } from "@/hooks/use-repo-filters";
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
  const { isOpen, onClose, onOpen } = useDisclosure();

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
    handleSortChange,
    nameFilter,
    setNameFilter,
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
    disabledKeys,
    handleRepoActionChange,
    handleSelectionChange,
    isRepoDisabled,
    selectedRepoAction,
    selectedRepoKeys,
    selectedRepos,
  } = useRepoSelection({ filteredRepos, paginatedRepos, repos });

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
      debug.log("Deleting selected repos:", Array.from(selectedRepoKeys));
    } else if (selectedRepoAction.has("archive")) {
      debug.log("Archiving selected repos:", Array.from(selectedRepoKeys));
    }

    // Open the confirmation modal
    onOpen();
  };

  const handleConfirm = useCallback(() => {
    // TODO: Record # of repos deleted/archived?
  }, []);

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
      <div className="border border-divider rounded-lg overflow-hidden">
        <Table
          aria-label="GitHub repositories table"
          classNames={{
            table: "table-fixed",
            td: [
              "py-3",
              "border-b",
              "border-divider",
              // First column (checkbox) should be narrow
              "first:w-12",
              // Remove rounded corners from hover/selection backgrounds
              "group-data-[first=true]/tr:first:before:rounded-none",
              "group-data-[first=true]/tr:last:before:rounded-none",
              "group-data-[middle=true]/tr:before:rounded-none",
              "group-data-[last=true]/tr:first:before:rounded-none",
              "group-data-[last=true]/tr:last:before:rounded-none",
            ],
            th: [
              "bg-default-100",
              "border-b",
              "border-divider",
              // First column (checkbox) should be narrow
              "first:w-12",
            ],
          }}
          data-testid="repo-table"
          disabledKeys={disabledKeys}
          onSelectionChange={handleSelectionChange}
          onSortChange={handleSortChange}
          removeWrapper
          selectedKeys={selectedRepoKeys}
          selectionMode="multiple"
          sortDescriptor={sortDescriptor}
        >
          <TableHeader columns={[...COLUMN_ORDER]}>
            {(column) => (
              <TableColumn
                allowsSorting
                className={column.className}
                key={column.key}
              >
                {column.label}
              </TableColumn>
            )}
          </TableHeader>

          {/* TABLE BODY */}
          <TableBody
            emptyContent={"No repos to display."}
            isLoading={false}
            items={paginatedRepos}
            loadingContent={<Spinner label="Loading..." />}
          >
            {(repo) => (
              <TableRow
                className={
                  isRepoDisabled(repo) ? "pointer-events-none opacity-50" : ""
                }
                data-testid="repo-row"
                key={repo.id}
              >
                <TableCell>
                  <div data-testid="repo-details">
                    <div className="mb-1.5" data-testid="repo-name">
                      <Link
                        className="font-medium text-base"
                        href={repo.url as string}
                        isExternal
                      >
                        {repo.name}
                      </Link>
                    </div>
                    <div className="flex gap-2 mb-2" data-testid="repo-tags">
                      {repo.isPrivate && (
                        <Chip radius="sm" size="sm" variant="bordered">
                          Private
                        </Chip>
                      )}
                      {repo.isInOrganization && (
                        <Chip radius="sm" size="sm" variant="bordered">
                          Organization
                        </Chip>
                      )}
                      {repo.isFork && (
                        <Chip radius="sm" size="sm" variant="bordered">
                          Fork
                        </Chip>
                      )}
                      {repo.isArchived && (
                        <Chip
                          color="warning"
                          radius="sm"
                          size="sm"
                          variant="bordered"
                        >
                          Archived
                        </Chip>
                      )}
                    </div>

                    {repo.owner.login !== login && (
                      <div
                        className="mb-1 text-default-500 text-sm"
                        data-testid="repo-owner"
                      >
                        Owned by{" "}
                        <Link
                          className="text-sm"
                          href={repo.owner.url as string}
                          isExternal
                        >
                          {repo.owner.login}
                        </Link>
                      </div>
                    )}

                    <div className="text-sm" data-testid="repo-description">
                      {repo.description ?? <i>No description</i>}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    data-testid="repo-updated-at"
                    title={new Date(repo.updatedAt as string).toLocaleString(
                      navigator.language,
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      },
                    )}
                  >
                    {formatDistanceToNow(new Date(repo.updatedAt as string))}
                  </span>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINATION - Outside table border */}
      {totalPages > 1 && (
        <div className="flex w-full justify-center">
          <Pagination
            data-testid="table-pagination"
            onChange={setCurrentPage}
            page={currentPage}
            showControls
            showShadow
            total={totalPages}
          />
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {repos && selectedRepos && login && (
        <ConfirmationModal
          action={Array.from(selectedRepoAction)[0] as "archive" | "delete"}
          data-testid="repo-confirmation-modal"
          isOpen={isOpen}
          login={login}
          onClose={onClose}
          onConfirm={handleConfirm}
          repos={selectedRepos}
        />
      )}
    </div>
  );
}
