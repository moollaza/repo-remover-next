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
    <div className="space-y-4" data-testid="repo-table-skeleton-container">
      {/* Filters skeleton */}
      <RepoFiltersSkeleton />

      {/* Table skeleton - matches real table exactly */}
      <div className="border border-divider rounded-lg overflow-hidden">
        <Table
          aria-label="Loading repositories"
          classNames={{
            table: "table-fixed",
            td: [
              "py-3",
              "border-b",
              "border-divider",
              // First column (checkbox) should be narrow
              "first:w-12",
              // Remove rounded corners from hover/selection backgrounds
              "group-data-[first=true]/tr:first:before:rounded-none",
              "group-data-[first=true]/tr:last:before:rounded-none",
              "group-data-[middle=true]/tr:before:rounded-none",
              "group-data-[last=true]/tr:first:before:rounded-none",
              "group-data-[last=true]/tr:last:before:rounded-none",
            ],
            th: [
              "bg-default-100",
              "border-b",
              "border-divider",
              // First column (checkbox) should be narrow
              "first:w-12",
            ],
          }}
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
                  <div className="mb-1.5">
                    <Skeleton className="h-6 w-48 rounded-lg" />
                  </div>
                  {/* Chips row */}
                  <div className="flex gap-2 mb-2">
                    <Skeleton className="h-6 w-16 rounded-lg" />
                    <Skeleton className="h-6 w-24 rounded-lg" />
                  </div>
                  {/* Owner */}
                  <div className="mb-1">
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

      {/* Pagination skeleton - outside table border */}
      <div className="flex w-full justify-center">
        <Skeleton className="h-10 w-64 rounded-lg" />
      </div>
    </div>
  );
}
