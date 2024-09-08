import {
  Button,
  ButtonGroup,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Pagination,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  type Selection,
  type SortDescriptor,
} from "@nextui-org/react";
import { Repository } from "@octokit/graphql-schema";
import { formatDistanceToNow } from "date-fns";
import { useCallback, useMemo, useState, useEffect } from "react";

import { ChevronDownIcon } from "@heroicons/react/16/solid";

interface RepoTableProps {
  repos: Repository[] | null;
  isLoading: boolean;
}

const COLUMNS = {
  name: { key: "name", label: "Name", className: "w-4/5" },
  updatedAt: { key: "updatedAt", label: "Last Updated", className: "w-1/5" },
};
const COLUMN_ORDER = [COLUMNS.name, COLUMNS.updatedAt];
const PER_PAGE_OPTIONS = [5, 10, 20, 50, 100];
const REPO_TYPES = [
  { key: "private", label: "Private" },
  { key: "organization", label: "Organization" },
  { key: "forked", label: "Forked" },
  { key: "archived", label: "Archived" },
];
const REPO_ACTIONS = [
  {
    key: "archive",
    label: "Archive Selected Repos",
    description: "Archive the selected repositories",
  },
  {
    key: "delete",
    label: "Delete Selected Repos",
    description: "Delete the selected repositories",
  },
];

// Remove unused `all` type from the Selection type
type SelectionSet = Exclude<Selection, "all">;

interface RepositoryWithkey extends Repository {
  key: string;
}

interface Window {
  repos?: Repository[] | undefined | null;
}

export default function RepoTable({
  repos,
  isLoading,
}: RepoTableProps): JSX.Element {
  const [repoTypesFilter, setRepoTypesFilter] = useState<SelectionSet>(
    new Set(REPO_TYPES.map((type) => type.key)),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [perPage, setPerPage] = useState(PER_PAGE_OPTIONS[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortDescriptor, setSortDescritor] = useState<SortDescriptor>({
    column: COLUMNS.updatedAt.key,
    direction: "descending",
  });
  const [selectedRepos, setSelectedRepos] = useState<Selection>(new Set());
  const [repoAction, setRepoAction] = useState<SelectionSet>(
    new Set([REPO_ACTIONS[0].key]),
  );

  // For debugging purposes
  (window as Window).repos = repos;

  useEffect(() => {
    if (repos?.length) {
      console.group("Repos");
      console.table(repos);
      console.groupEnd();
    }
  }, [repos]);

  // Add keys to the repos for React to track them
  const reposWithKeys: RepositoryWithkey[] = useMemo(() => {
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
        repoTypesFilter.size === 0 ||
        (repoTypesFilter.has("private") && repo.isPrivate === true) ||
        (repoTypesFilter.has("organization") &&
          repo.isInOrganization === true) ||
        (repoTypesFilter.has("forked") && repo.isFork === true) ||
        (repoTypesFilter.has("archived") && repo.isArchived === true);
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

  const handlePerPageChange = useCallback(
    (keys: Selection) => {
      // We know that the keys will always have a single value
      // because we disallow empty selection
      // so we can safely cast the first value to a number
      setPerPage(Array.from(keys)[0] as number);
      setCurrentPage(1);
    },
    [setPerPage],
  );

  const handleRepoActionClick = () => {
    if (repoAction.has("delete")) {
      console.log("Deleting selected repos:", Array.from(selectedRepos));
    } else if (repoAction.has("archive")) {
      console.log("Archiving selected repos:", Array.from(selectedRepos));
    }
  };

  const handleRepoActionChange = useCallback(
    (keys: Selection) => {
      setRepoAction(keys as SelectionSet);
    },
    [setRepoAction],
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-5">Select Repos to Modify </h1>

      <div className="mb-4 space-x-10 flex">
        {/* SEARCH INPUT */}
        <Input
          type="text"
          label="Search"
          isClearable
          placeholder="Search by name or description"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery("")}
        />

        {/* REPO TYPE SELECTOR */}
        <Select
          label="Filter by Repo type"
          selectionMode="multiple"
          placeholder="Filter by type"
          selectedKeys={repoTypesFilter}
          onSelectionChange={handleRepoTypesFilterChange}
          defaultSelectedKeys={new Set(REPO_TYPES.map((type) => type.key))}
          items={REPO_TYPES}
        >
          {(repoType) => (
            <SelectItem key={repoType.key}>{repoType.label}</SelectItem>
          )}
        </Select>

        {/* ACTION BUTTONS */}
        <ButtonGroup>
          <Button
            color={repoAction.has("delete") ? "danger" : "warning"}
            isDisabled={selectedRepos !== "all" && selectedRepos.size === 0}
            onPress={handleRepoActionClick}
          >
            {REPO_ACTIONS.find((action) => repoAction.has(action.key))?.label ??
              "Select Action"}
          </Button>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                color={repoAction.has("delete") ? "danger" : "warning"}
                isIconOnly
              >
                <ChevronDownIcon className="h-4 w-4" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Repo actions"
              disallowEmptySelection
              selectionMode="single"
              selectedKeys={repoAction}
              onSelectionChange={handleRepoActionChange}
              className="max-w-[300px]"
            >
              {REPO_ACTIONS.map((action) => (
                <DropdownItem key={action.key} description={action.description}>
                  {action.label}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </ButtonGroup>

        {/* PER PAGE SELECTOR */}
        <Select
          placeholder="Per page"
          selectionMode="single"
          defaultSelectedKeys={[perPage.toString()]}
          selectedKeys={new Set([perPage.toString()])}
          onSelectionChange={handlePerPageChange}
          disallowEmptySelection
        >
          {PER_PAGE_OPTIONS.map((option) => (
            <SelectItem key={option} textValue={option.toString()}>
              {option}
            </SelectItem>
          ))}
        </Select>
      </div>

      {/* TABLE HEADERS */}
      <Table
        selectionMode="multiple"
        removeWrapper
        aria-label="Repos table"
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescritor}
        selectedKeys={selectedRepos}
        onSelectionChange={setSelectedRepos}
        className="mb-5"
      >
        <TableHeader>
          {COLUMN_ORDER.map((column) => (
            <TableColumn
              key={column.key}
              allowsSorting
              className={column.className}
            >
              {column.label}
            </TableColumn>
          ))}
        </TableHeader>

        {/* TABLE BODY */}
        <TableBody
          items={paginatedRepos}
          emptyContent={"No repos to display."}
          isLoading={isLoading}
          loadingContent={<Spinner label="Loading..." />}
        >
          {(repo: RepositoryWithkey) => (
            <TableRow key={repo.key}>
              <TableCell>
                <div>
                  <div className="text-blue-500 hover:text-blue-900 font-semibold text-lg mb-2">
                    <a
                      href={repo.url as string}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {repo.name}
                    </a>
                  </div>
                  <div className="flex gap-2 mb-5">
                    {repo.isPrivate && <Chip size="sm">Private</Chip>}
                    {repo.isInOrganization && (
                      <Chip size="sm">Organization</Chip>
                    )}
                    {repo.isFork && <Chip size="sm">Fork</Chip>}
                    {repo.isArchived && <Chip size="sm">Archived</Chip>}
                  </div>
                  <div>{repo.description ?? "No description"}</div>
                </div>
              </TableCell>
              <TableCell>
                <span
                  title={new Date(repo.updatedAt as string).toLocaleString(
                    navigator.language,
                    {
                      month: "short",
                      day: "numeric",
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

      {/* PAGINATION */}
      <Pagination
        showControls
        total={Math.max(1, Math.ceil(filteredRepos.length / perPage))}
        page={currentPage}
        onChange={setCurrentPage}
      />
    </div>
  );
}
