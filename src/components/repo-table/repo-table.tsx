import {
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
} from "@heroicons/react/16/solid";
import {
  Button,
  ButtonGroup,
  Chip,
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
import { useCallback, useEffect, useMemo, useState } from "react";

import { useGitHub } from "@/providers/github-provider";

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

interface RepositoryWithkey extends Repository {
  key: string;
}

// Remove unused `all` type from the Selection type
type SelectionSet = Exclude<Selection, "all">;

interface Window {
  repos?: null | Repository[] | undefined;
}

export default function RepoTable({
  isLoading,
  repos,
}: RepoTableProps): JSX.Element {
  const { login } = useGitHub();
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
  const [selectedRepoKeys, setSelectedRepoKeys] = useState<Selection>(
    new Set(),
  );
  const [selectedRepoAction, setSelectedRepoAction] = useState<SelectionSet>(
    new Set([REPO_ACTIONS[0].key]),
  );

  // Build the list of selected repos based on the keys
  const selectedRepos = useMemo(() => {
    if (selectedRepoKeys === "all") {
      return repos;
    }

    return repos?.filter((repo) => selectedRepoKeys.has(repo.id));
  }, [repos, selectedRepoKeys]);

  // For the confirmation modal
  const { isOpen, onClose, onOpen } = useDisclosure();

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

  const handleConfirm = () => {
    console.log(
      `Confirmed ${selectedRepoAction.values().next().value} by ${login}`,
    );

    // TODO: handle the archival or deletion here
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold mb-5">Select Repos to Modify </h1>

      <div className="space-x-10 flex">
        {/* SEARCH INPUT */}
        <Input
          isClearable
          label="Search"
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery("")}
          placeholder="Search by name or description"
          type="text"
          value={searchQuery}
        />

        {/* REPO TYPE SELECTOR */}
        <Select
          defaultSelectedKeys={new Set(REPO_TYPES.map((type) => type.key))}
          items={REPO_TYPES}
          label="Repo types to show"
          onSelectionChange={handleRepoTypesFilterChange}
          placeholder="Filter by type"
          selectedKeys={repoTypesFilter}
          selectionMode="multiple"
        >
          {(repoType) => (
            <SelectItem key={repoType.key}>{repoType.label}</SelectItem>
          )}
        </Select>

        {/* PER PAGE SELECTOR */}
        <Select
          defaultSelectedKeys={[perPage.toString()]}
          disallowEmptySelection
          label="Repos Per page"
          onSelectionChange={handlePerPageChange}
          placeholder="Per page"
          selectedKeys={new Set([perPage.toString()])}
          selectionMode="single"
        >
          {PER_PAGE_OPTIONS.map((option) => (
            <SelectItem key={option} textValue={option.toString()}>
              {option}
            </SelectItem>
          ))}
        </Select>
      </div>

      <div className="flex">
        {/* ACTION BUTTONS */}
        <ButtonGroup>
          <Button
            color={selectedRepoAction.has("delete") ? "danger" : "warning"}
            isDisabled={
              selectedRepoKeys !== "all" && selectedRepoKeys.size === 0
            }
            onPress={handleRepoActionClick}
            size="lg"
          >
            {REPO_ACTIONS.find((action) => selectedRepoAction.has(action.key))
              ?.label ?? "Select Action"}
          </Button>
          <Dropdown placement="bottom-end" size="lg">
            <DropdownTrigger>
              <Button
                color={selectedRepoAction.has("delete") ? "danger" : "warning"}
                isIconOnly
                size="lg"
              >
                <ChevronDownIcon className="h-4 w-4" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Repo actions"
              className="max-w-[300px]"
              disallowEmptySelection
              onSelectionChange={handleRepoActionChange}
              selectedKeys={selectedRepoAction}
              selectionMode="single"
            >
              {REPO_ACTIONS.map((action) => (
                <DropdownItem description={action.description} key={action.key}>
                  {action.label}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </ButtonGroup>
      </div>

      {/* TABLE HEADERS */}
      <Table
        aria-label="Repos table"
        className="mb-5"
        onSelectionChange={setSelectedRepoKeys}
        onSortChange={setSortDescritor}
        removeWrapper
        selectedKeys={selectedRepoKeys}
        selectionMode="multiple"
        sortDescriptor={sortDescriptor}
      >
        <TableHeader>
          {COLUMN_ORDER.map((column) => (
            <TableColumn
              allowsSorting
              className={column.className}
              key={column.key}
            >
              {column.label}
            </TableColumn>
          ))}
        </TableHeader>

        {/* TABLE BODY */}
        <TableBody
          emptyContent={"No repos to display."}
          isLoading={isLoading}
          items={paginatedRepos}
          loadingContent={<Spinner label="Loading..." />}
        >
          {(repo: RepositoryWithkey) => (
            <TableRow key={repo.key}>
              <TableCell>
                <div>
                  <div className="mb-2">
                    <Link
                      anchorIcon={
                        <ArrowTopRightOnSquareIcon className="h-5 w-5 mx-1" />
                      }
                      className="font-semibold text-xl"
                      href={repo.url as string}
                      isExternal
                      showAnchorIcon
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
                  <div>{repo.description ?? "No description"}</div>
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

      {/* PAGINATION */}
      <Pagination
        onChange={setCurrentPage}
        page={currentPage}
        showControls
        total={Math.max(1, Math.ceil(filteredRepos.length / perPage))}
      />

      {/* CONFIRMATION MODAL */}
      {repos && selectedRepos && login && (
        <ConfirmationModal
          action={
            selectedRepoAction.values().next().value as "archive" | "delete"
          }
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
