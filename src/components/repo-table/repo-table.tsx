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
import { useCallback, useEffect, useMemo, useState } from "react";

import { COLUMN_ORDER, REPO_ACTIONS } from "@/config/repo-config";
import { useRepoFilters } from "@/hooks/use-repo-filters";
import { useRepoPagination } from "@/hooks/use-repo-pagination";
import { debug } from "@/utils/debug";

import ConfirmationModal from "./confirmation-modal";
import RepoFilters from "./repo-filters";

interface RepositoryWithKey extends Repository {
  key: string;
}

interface RepoTableProps {
  login: null | string;
  repos: null | Repository[];
}

// Remove unused `all` type from the Selection type
type SelectionSet = Exclude<Selection, "all">;

export default function RepoTable({
  login,
  repos,
}: RepoTableProps): JSX.Element {
  const [selectedRepoKeys, setSelectedRepoKeys] = useState<Selection>(
    new Set(),
  );
  const [selectedRepoAction, setSelectedRepoAction] = useState<SelectionSet>(
    new Set([REPO_ACTIONS[0].key]),
  );

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

  // Use custom hooks for filtering and pagination
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

  // Build the list of selected repos based on the keys
  const selectedRepos = useMemo(() => {
    if (selectedRepoKeys === "all") {
      return repos ?? [];
    }
    return repos?.filter((repo) => selectedRepoKeys.has(repo.id)) ?? [];
  }, [repos, selectedRepoKeys]);

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

  const handleConfirm = useCallback(() => {
    // TODO: Record # of repos deleted/archived?
  }, []);

  return (
    <div className="space-y-5" data-testid="repo-table-container">
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
      <Table
        aria-label="GitHub repositories table"
        bottomContent={
          <div className="flex w-full justify-center">
            {/* PAGINATION */}
            <Pagination
              data-testid="table-pagination"
              hidden={totalPages <= 1}
              onChange={setCurrentPage}
              page={currentPage}
              showControls
              showShadow
              total={totalPages}
            />
          </div>
        }
        className="mb-5"
        data-testid="repo-table"
        disabledKeys={disabledKeys}
        isStriped
        onSelectionChange={setSelectedRepoKeys}
        onSortChange={setSortDescriptor}
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
                isRepoDisabled(repo) ? "opacity-50 pointer-events-none" : ""
              }
              data-testid="repo-row"
              key={repo.id}
            >
              <TableCell>
                <div data-testid="repo-details">
                  <div className="mb-2" data-testid="repo-name">
                    <Link
                      className="font-semibold text-xl"
                      href={repo.url as string}
                      isExternal
                    >
                      {repo.name}
                    </Link>
                  </div>
                  <div className="flex gap-2 mb-5" data-testid="repo-tags">
                    {repo.isPrivate && <Chip size="sm">Private</Chip>}
                    {repo.isInOrganization && (
                      <Chip size="sm">Organization</Chip>
                    )}
                    {repo.isFork && <Chip size="sm">Fork</Chip>}
                    {repo.isArchived && (
                      <Chip color="warning" size="sm">
                        Archived
                      </Chip>
                    )}
                  </div>

                  {repo.owner.login !== login && (
                    <div
                      className="mb-2 text-default-500 text-sm"
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

                  <div data-testid="repo-description">
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
