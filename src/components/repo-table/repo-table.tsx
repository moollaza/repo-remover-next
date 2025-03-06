import { ArrowTopRightOnSquareIcon } from "@heroicons/react/16/solid";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Link,
  Pagination,
  Select,
  type Selection,
  SelectItem,
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
import { useCallback, useMemo, useState } from "react";

import { useGitHubData } from "@/hooks/use-github-data";

import ConfirmationModal from "./confirmation-modal";

interface RepoTableProps {
  isLoading: boolean;
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
  repos,
}: RepoTableProps): JSX.Element {
  const { login } = useGitHubData();
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
  const [selectedRepoAction] = useState<SelectionSet>(
    new Set([REPO_ACTIONS[0].key]),
  );

  // For the confirmation modal
  const { isOpen, onClose, onOpen } = useDisclosure();

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

  // First we filter the repos based on the search query and selected types
  const filteredRepos = useMemo(() => {
    if (!reposWithKeys) return [];

    return reposWithKeys.filter((repo) => {
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
  }, [reposWithKeys, searchQuery, repoTypesFilter]);

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

  // Then we paginate the sorted repos
  const paginatedRepos = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;

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
    // We know that the keys will always have a single value
    // because we disallow empty selection
    // so we can safely cast the first value to a number
    setPerPage(Array.from(keys)[0] as number);
    setCurrentPage(1);
  }, []);

  const handleRepoActionClick = useCallback(() => {
    onOpen();
  }, [onOpen]);

  const handleConfirm = useCallback(() => {
    // Placeholder for actual confirmation logic
    onClose();
  }, [onClose]);

  if (isLoading) {
    return <Spinner aria-label="Loading..." />;
  }

  if (!repos?.length) {
    return <div>No repositories found</div>;
  }

  return (
    <div className="space-y-5" data-testid="repo-table">
      <h1
        className="text-2xl font-semibold mb-5"
        data-testid="repo-table-header"
      >
        Select Repos to Modify
      </h1>

      <div className="space-x-10 flex">
        <Input
          data-testid="repo-search-input"
          onValueChange={setSearchQuery}
          placeholder="Search by name or description"
          value={searchQuery}
        />

        <Dropdown>
          <DropdownTrigger data-testid="repo-types-select">
            <Button variant="bordered">Repo Types</Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Repo Types"
            onSelectionChange={handleRepoTypesFilterChange}
            selectedKeys={repoTypesFilter}
            selectionMode="multiple"
          >
            {REPO_TYPES.map((type) => (
              <DropdownItem
                data-testid={`repo-type-${type.key}`}
                key={type.key}
                textValue={type.label}
              >
                {type.label}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>

        <Select
          data-testid="per-page-select"
          label="Repos per page"
          onSelectionChange={handlePerPageChange}
          selectedKeys={new Set([perPage.toString()])}
        >
          {PER_PAGE_OPTIONS.map((option) => (
            <SelectItem
              data-testid={`per-page-option-${option}`}
              key={option}
              textValue={option.toString()}
            >
              {option}
            </SelectItem>
          ))}
        </Select>
      </div>

      <Table
        aria-label="Repositories table"
        onSelectionChange={setSelectedRepoKeys}
        onSortChange={setSortDescriptor}
        selectedKeys={selectedRepoKeys}
        selectionMode="multiple"
        sortDescriptor={sortDescriptor}
      >
        <TableHeader columns={COLUMN_ORDER}>
          {(column) => (
            <TableColumn allowsSorting key={column.key}>
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={paginatedRepos}>
          {(repo) => (
            <TableRow key={repo.id}>
              <TableCell>
                <Link
                  data-testid="repo-link"
                  href={repo.url as string}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {repo.name}
                  <ArrowTopRightOnSquareIcon className="h-5 w-5 mx-1" />
                </Link>
              </TableCell>
              <TableCell>
                {repo.updatedAt
                  ? formatDistanceToNow(new Date(repo.updatedAt as string), {
                      addSuffix: true,
                    })
                  : "No update date"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex justify-between items-center">
        <Pagination
          onChange={setCurrentPage}
          page={currentPage}
          showControls
          total={Math.ceil(sortedRepos.length / perPage)}
        />

        <Button
          color="warning"
          data-testid="repo-action-button"
          isDisabled={
            selectedRepoKeys === "all" ? false : selectedRepoKeys.size === 0
          }
          onPress={handleRepoActionClick}
        >
          {
            REPO_ACTIONS.find(
              (action) => action.key === Array.from(selectedRepoAction)[0],
            )?.label
          }
        </Button>
      </div>

      {login && (
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
