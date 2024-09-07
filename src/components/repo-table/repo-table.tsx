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
} from "@nextui-org/react";
import { Repository } from "@octokit/graphql-schema";
import { useCallback, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface RepoTableProps {
  repos: Repository[] | null;
  isLoading: boolean;
}

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
  const [sortColumn, setSortColumn] = useState<"name" | "updatedAt">(
    "updatedAt",
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

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

  const sortedRepos = useMemo(() => {
    return [...filteredRepos].sort((a, b) => {
      if (sortColumn === "name") {
        return sortDirection === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        return sortDirection === "asc"
          ? new Date(a.updatedAt as string).getTime() -
              new Date(b.updatedAt as string).getTime()
          : new Date(b.updatedAt as string).getTime() -
              new Date(a.updatedAt as string).getTime();
      }
    });
  }, [filteredRepos, sortColumn, sortDirection]);

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

  const handleSort = (column: "name" | "updatedAt") => {
    if (sortColumn === column) {
      setSortDirection((prevDirection) =>
        prevDirection === "asc" ? "desc" : "asc",
      );
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

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
      <Table removeWrapper aria-label="Repos table">
        <TableHeader>
          <TableColumn className="w-3/4" onClick={() => handleSort("name")}>
            Name{" "}
            {sortColumn === "name" && (sortDirection === "asc" ? "↑" : "↓")}
          </TableColumn>
          <TableColumn
            className="w-1/4"
            onClick={() => handleSort("updatedAt")}
          >
            Last Updated{" "}
            {sortColumn === "updatedAt" &&
              (sortDirection === "asc" ? "↑" : "↓")}
          </TableColumn>
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
                  <div className="text-blue-500 hover:text-blue-900 text-medium font-semibold">
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
