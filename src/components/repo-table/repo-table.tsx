import {
  Chip,
  Link,
  Pagination,
  type Selection,
  type SortDescriptor,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
} from "@heroui/react";
import { Repository } from "@octokit/graphql-schema";
import { formatDistanceToNow } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";

import ConfirmationModal from "./confirmation-modal";
import RepoFilters from "./repo-filters";

interface RepoTableProps {
  isLoading: boolean;
  login: null | string;
  repos: null | Repository[];
}

const COLUMNS = {
  name: { className: "w-4/5", key: "name", label: "Name" },
  updatedAt: { className: "w-1/5", key: "updatedAt", label: "Last Updated" },
};
const COLUMN_ORDER = [COLUMNS.name, COLUMNS.updatedAt];
const PER_PAGE_OPTIONS = [5, 10, 20, 50, 100];
const REPO_TYPES = [
  { key: "isPrivate", label: "Private" },
  { key: "isInOrganization", label: "Organization" },
  { key: "isFork", label: "Forked" },
  { key: "isArchived", label: "Archived" },
  { key: "isTemplate", label: "Template" },
  { key: "isMirror", label: "Mirror" },
  { key: "isDisabled", label: "Disabled" },
];
const REPO_ACTIONS = [
  {
    description: "This can be undone later",
    key: "archive",
    label: "Archive Selected Repos",
  },
  {
    description: "This action is irreversible",
    key: "delete",
    label: "Delete Selected Repos",
  },
];

interface RepositoryWithKey extends Repository {
  key: string;
}

// Remove unused `all` type from the Selection type
type SelectionSet = Exclude<Selection, "all">;

export default function RepoTable({
  isLoading,
  login,
  repos,
}: RepoTableProps): JSX.Element {
  const [repoTypesFilter, setRepoTypesFilter] = useState<SelectionSet>(
    new Set(REPO_TYPES.map((type) => type.key)),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [perPage, setPerPage] = useState(PER_PAGE_OPTIONS[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: COLUMNS.updatedAt.key,
    direction: "descending",
  });
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
      console.groupCollapsed("Repos");
      console.table(repos);
      console.groupEnd();
    }
  }, [repos]);

  // Build the list of selected repos based on the keys
  const selectedRepos = useMemo(() => {
    if (selectedRepoKeys === "all") {
      return repos ?? [];
    }
    return repos?.filter((repo) => selectedRepoKeys.has(repo.id)) ?? [];
  }, [repos, selectedRepoKeys]);

  // Add keys to the repos for React to track them
  const reposWithKeys: RepositoryWithKey[] = useMemo(() => {
    if (!repos) return [];

    return repos.map((repo) => ({
      ...repo,
      key: repo.id,
    }));
  }, [repos]);

  // First we filter the repos based on the search query, selected types, and admin permissions
  const filteredRepos = useMemo(() => {
    if (!reposWithKeys) return [];

    return reposWithKeys.filter((repo) => {
      // Check if user can administer this repo (either they own it or have admin rights)
      const canAdminister =
        repo.owner.login === login || repo.viewerCanAdminister === true;

      // If user can't administer this repo, filter it out
      if (!canAdminister) return false;

      const matchesSearchQuery =
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        // For each type, if it is not selected, we check if the repo has it and return false
        REPO_TYPES.every((type) => {
          // If the type is not selected, check if the repo has it and return false
          if (!repoTypesFilter.has(type.key)) {
            if (repo[type.key as keyof Repository]) {
              return false;
            }
            return true;
          }
          return true;
        });

      return matchesSearchQuery && matchesType;
    });
  }, [reposWithKeys, searchQuery, repoTypesFilter, login]);

  // Then we sort the filtered repos
  const sortedRepos = useMemo(() => {
    return [...filteredRepos].sort((a, b) => {
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
  }, [filteredRepos, sortDescriptor]);

  const pages = Math.ceil(sortedRepos.length / perPage);

  const paginatedRepos = useMemo(() => {
    const start = Number((currentPage - 1) * perPage);
    const end = start + Number(perPage);

    return sortedRepos.slice(start, end);
  }, [sortedRepos, currentPage, perPage]);

  const handleRepoTypesFilterChange = useCallback(
    (keys: Selection) => {
      setRepoTypesFilter(keys as SelectionSet);
      setCurrentPage(1);
    },
    [setRepoTypesFilter],
  );

  const handlePerPageChange = useCallback((keys: Selection) => {
    const newPerPage = Number(Array.from(keys)[0]);

    setPerPage(newPerPage);
    setCurrentPage(1);
  }, []);

  const handleRepoActionClick = () => {
    if (selectedRepoAction.has("delete")) {
      console.log("Deleting selected repos:", Array.from(selectedRepoKeys));
    } else if (selectedRepoAction.has("archive")) {
      console.log("Archiving selected repos:", Array.from(selectedRepoKeys));
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

  const handleConfirm = useCallback(() => {
    // TODO: Record # of repos deleted/archived?
  }, []);

  return (
    <div className="space-y-5" data-testid="repo-table">
      <RepoFilters
        onPerPageChange={handlePerPageChange}
        onRepoActionChange={handleRepoActionChange}
        onRepoActionClick={handleRepoActionClick}
        onRepoTypesFilterChange={handleRepoTypesFilterChange}
        onSearchChange={setSearchQuery}
        perPage={perPage}
        repoTypesFilter={repoTypesFilter}
        searchQuery={searchQuery}
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
              onChange={setCurrentPage}
              page={currentPage}
              showControls
              showShadow
              total={pages}
            />
          </div>
        }
        className="mb-5"
        isStriped
        onSelectionChange={setSelectedRepoKeys}
        onSortChange={setSortDescriptor}
        removeWrapper
        selectedKeys={selectedRepoKeys}
        selectionMode="multiple"
        sortDescriptor={sortDescriptor}
      >
        <TableHeader columns={COLUMN_ORDER}>
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
          isLoading={isLoading}
          items={paginatedRepos}
          loadingContent={<Spinner label="Loading..." />}
        >
          {(repo) => (
            <TableRow key={repo.id}>
              <TableCell>
                <div>
                  <div className="mb-2">
                    <Link
                      className="font-semibold text-xl"
                      href={repo.url as string}
                      isExternal
                    >
                      {repo.name}
                    </Link>
                  </div>
                  <div className="flex gap-2 mb-5">
                    {repo.isPrivate && <Chip size="sm">Private</Chip>}
                    {repo.isInOrganization && (
                      <Chip size="sm">Organization</Chip>
                    )}
                    {repo.isFork && <Chip size="sm">Fork</Chip>}
                    {repo.isArchived && <Chip size="sm">Archived</Chip>}
                  </div>

                  {(repo.isInOrganization || repo.owner.login !== login) && (
                    <div className="mb-2 text-default-500 text-sm">
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

                  <div>{repo.description ?? <i>No description</i>}</div>
                </div>
              </TableCell>
              <TableCell>
                <span
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
