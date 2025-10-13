import {
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";

import RepoFiltersSkeleton from "./repo-filters-skeleton";

interface RepoTableSkeletonProps {
  rows?: number;
}

export default function RepoTableSkeleton({
  rows = 10,
}: RepoTableSkeletonProps) {
  return (
    <div className="space-y-5" data-testid="repo-table-skeleton-container">
      {/* Add filters skeleton to match real table structure */}
      <RepoFiltersSkeleton />

      {/* Table skeleton */}
      <Table aria-label="Loading repositories">
        <TableHeader>
          <TableColumn className="w-4/5">NAME</TableColumn>
          <TableColumn className="w-1/5">LAST UPDATED</TableColumn>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                {/* Match real structure: name + chips + owner + description */}
                <div>
                  {/* Repo name */}
                  <div className="mb-2">
                    <Skeleton className="h-7 w-48 rounded-lg" />
                  </div>
                  {/* Chips row */}
                  <div className="flex gap-2 mb-5">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  {/* Owner */}
                  <div className="mb-2">
                    <Skeleton className="h-4 w-32 rounded-lg" />
                  </div>
                  {/* Description */}
                  <Skeleton className="h-4 w-full rounded-lg" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20 rounded-lg" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
