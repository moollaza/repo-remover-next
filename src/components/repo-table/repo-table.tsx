import {
  Chip,
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
import { useCallback, useMemo, useState } from "react";

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

export default function RepoTable({
  repos,
  isLoading,
}: RepoTableProps): JSX.Element {
  // Remove unused `all` type from the Selection type
  type SelectionSet = Exclude<Selection, "all">;
  const [selectedTypes, setSelectedTypes] = useState<SelectionSet>(
    new Set(REPO_TYPES.map((type) => type.key)),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [perPage, setPerPage] = useState(PER_PAGE_OPTIONS[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: COLUMNS.updatedAt.key,
    direction: "descending",
  });

  // First we filter the repos based on the search query and selected types
  const filteredRepos = useMemo(() => {
    if (!repos) return [];

    return repos.filter((repo) => {
      const matchesSearchQuery =
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        selectedTypes.size === 0 ||
        (selectedTypes.has("private") && repo.isPrivate === true) ||
        (selectedTypes.has("organization") && repo.isInOrganization === true) ||
        (selectedTypes.has("forked") && repo.isFork === true) ||
        (selectedTypes.has("archived") && repo.isArchived === true);
      return matchesSearchQuery && matchesType;
    });
  }, [repos, searchQuery, selectedTypes]);

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

  const onSelectedRepoTypesChange = useCallback(
    (value: Selection) => {
      setSelectedTypes(value as SelectionSet);
      setCurrentPage(1);
    },
    [setSelectedTypes],
  );

  const handlePerPageChange = (value: string) => {
    setPerPage(Number(value));
    setCurrentPage(1);
  };

  return (
    <div>
      <div className="mb-4 space-x-10 flex">
        {/* SEARCH INPUT */}
        <Input
          isClearable
          placeholder="Search by name or description"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* REPO TYPE SELECTOR */}
        <Select
          selectionMode="multiple"
          placeholder="Filter by type"
          selectedKeys={selectedTypes}
          onSelectionChange={onSelectedRepoTypesChange}
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
          defaultSelectedKeys={[perPage.toString()]}
          selectedKeys={new Set([perPage.toString()])}
          onSelectionChange={(keys) =>
            handlePerPageChange(Array.from(keys)[0] as string)
          }
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
        onSortChange={setSortDescriptor}
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
          {(repo: Repository) => (
            <TableRow key={repo.id}>
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
      <Pagination
        total={Math.max(1, Math.ceil(filteredRepos.length / perPage))}
        page={currentPage}
        onChange={(page) => setCurrentPage(page)}
      />
    </div>
  );
}
