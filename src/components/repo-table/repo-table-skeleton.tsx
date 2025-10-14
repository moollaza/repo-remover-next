import {
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";

import { COLUMN_ORDER } from "@/config/repo-config";

import RepoFiltersSkeleton from "./repo-filters-skeleton";

interface RepoTableSkeletonProps {
  rows?: number;
}

export default function RepoTableSkeleton({
  rows = 10,
}: RepoTableSkeletonProps) {
  return (
    <div className="space-y-5" data-testid="repo-table-skeleton-container">
      {/* Filters skeleton */}
      <RepoFiltersSkeleton />

      {/* Table skeleton - matches real table exactly */}
      <Table
        aria-label="Loading repositories"
        bottomContent={
          <div className="flex w-full justify-center">
            <Skeleton className="h-10 w-64 rounded-lg" />
          </div>
        }
        className="mb-5"
        isStriped
        removeWrapper
        selectedKeys={new Set()}
        selectionMode="multiple"
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
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i}>
              {/* NAME column */}
              <TableCell>
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

              {/* LAST UPDATED column */}
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
