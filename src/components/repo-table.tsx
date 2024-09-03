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

function getRelativeDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);

  if (months > 0) {
    return `${months} month${months > 1 ? "s" : ""} ago`;
  } else if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else {
    return `${seconds} second${seconds !== 1 ? "s" : ""} ago`;
  }
}

export default function RepoTable({
  repos,
  isLoading,
}: {
  repos: Repository[] | null;
  isLoading: boolean;
}) {
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
