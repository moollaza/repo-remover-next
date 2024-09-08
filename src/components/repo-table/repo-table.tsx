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
  SelectItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
  type Selection,
  type SortDescriptor,
} from "@nextui-org/react";
import { Repository } from "@octokit/graphql-schema";
import { formatDistanceToNow } from "date-fns";
import { useCallback, useMemo, useState, useEffect } from "react";

import {
  ChevronDownIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/16/solid";
import ConfirmationModal from "./confirmation-modal";

import { useGitHub } from "@/providers/github-provider";

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
    key: "archive",
    label: "Archive Selected Repos",
    description: "This can be undone later",
  },
  {
    key: "delete",
    label: "Delete Selected Repos",
    description: "This action is irreversible",
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
  const { isOpen, onOpen, onClose } = useDisclosure();

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
          label="Repo types to show"
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

        {/* PER PAGE SELECTOR */}
        <Select
          placeholder="Per page"
          selectionMode="single"
          label="Repos Per page"
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

      <div className="flex">
        {/* ACTION BUTTONS */}
        <ButtonGroup>
          <Button
            size="lg"
            color={selectedRepoAction.has("delete") ? "danger" : "warning"}
            isDisabled={
              selectedRepoKeys !== "all" && selectedRepoKeys.size === 0
            }
            onPress={handleRepoActionClick}
          >
            {REPO_ACTIONS.find((action) => selectedRepoAction.has(action.key))
              ?.label ?? "Select Action"}
          </Button>
          <Dropdown size="lg" placement="bottom-end">
            <DropdownTrigger>
              <Button
                size="lg"
                color={selectedRepoAction.has("delete") ? "danger" : "warning"}
                isIconOnly
              >
                <ChevronDownIcon className="h-4 w-4" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Repo actions"
              disallowEmptySelection
              selectionMode="single"
              selectedKeys={selectedRepoAction}
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
      </div>

      {/* TABLE HEADERS */}
      <Table
        selectionMode="multiple"
        removeWrapper
        aria-label="Repos table"
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescritor}
        selectedKeys={selectedRepoKeys}
        onSelectionChange={setSelectedRepoKeys}
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
                  <div className="mb-2">
                    <Link
                      href={repo.url as string}
                      isExternal
                      showAnchorIcon
                      anchorIcon={
                        <ArrowTopRightOnSquareIcon className="h-5 w-5 mx-1" />
                      }
                      className="font-semibold text-xl"
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

      {/* CONFIRMATION MODAL */}
      {repos && selectedRepos && login && (
        <ConfirmationModal
          action={
            selectedRepoAction.values().next().value as "archive" | "delete"
          }
          repos={selectedRepos}
          login={login}
          isOpen={isOpen}
          onConfirm={handleConfirm}
          onClose={onClose}
        />
      )}
    </div>
  );
}
