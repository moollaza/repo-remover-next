import {
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/react";
import { Repository } from "@octokit/graphql-schema";

import { getRelativeDate } from "./utils";

interface RepoTableProps {
  repos: Repository[] | null;
  isLoading: boolean;
}

export default function RepoTable({
  repos,
  isLoading,
}: RepoTableProps): JSX.Element {
  return (
    <Table removeWrapper aria-label="Repos table">
      <TableHeader>
        <TableColumn>Name</TableColumn>
        <TableColumn>Last Updated</TableColumn>
      </TableHeader>
      <TableBody
        items={repos ?? []}
        emptyContent={"No repos to display."}
        isLoading={isLoading}
        loadingContent={<Spinner label="Loading..." />}
      >
        {(repo: Repository) => (
          <TableRow key={repo.id}>
            <TableCell>{repo.name}</TableCell>
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
  );
}
