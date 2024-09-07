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

import { getRelativeDate } from "./utils";

interface RepoTableProps {
  repos: Repository[] | null;
  isLoading: boolean;
}

const PER_PAGE_OPTIONS = [5, 10, 20, 50, 100];

export default function RepoTable({
  repos,
  isLoading,
}: RepoTableProps): JSX.Element {
  // Remove unused `all` type from the Selection type
  type SelectionSet = Exclude<Selection, "all">;
  const [selectedTypes, setSelectedTypes] = useState<SelectionSet>(new Set([]));
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
        (selectedTypes.has("forked") && repo.isFork === true);
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
          ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
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

  return (
    <div>
      <div className="mb-4 space-x-10 flex">
        <Input
          isClearable
          placeholder="Search by name or description"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <Select
          selectionMode="multiple"
          placeholder="Filter by type"
          selectedKeys={selectedTypes}
          onSelectionChange={onSelectedRepoTypesChange}
        >
          <SelectItem key="private" textValue="private">
            Private
          </SelectItem>
          <SelectItem key="organization" textValue="organization">
            Organization
          </SelectItem>
          <SelectItem key="forked" textValue="forked">
            Forked
          </SelectItem>
        </Select>
        <Select
          placeholder="Per page"
          value={perPage.toString()}
          onChange={(value) => setPerPage(Number(value))}
        >
          {PER_PAGE_OPTIONS.map((option) => (
            <SelectItem key={option} value={option.toString()}>
              {option}
            </SelectItem>
          ))}
        </Select>
      </div>
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
                  <div className="flex gap-2">
                    {repo.isPrivate && (
                      <Chip color="primary" size="sm">
                        private
                      </Chip>
                    )}
                    {repo.isInOrganization && (
                      <Chip color="secondary" size="sm">
                        organization
                      </Chip>
                    )}
                    {repo.isFork && (
                      <Chip color="warning" size="sm">
                        fork
                      </Chip>
                    )}
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
                  {getRelativeDate(new Date(repo.updatedAt as string))}
                </span>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination
        total={Math.ceil(filteredRepos.length / perPage)}
        initialPage={1}
        page={currentPage}
        onChange={(page) => setCurrentPage(page)}
      />
    </div>
  );
}
