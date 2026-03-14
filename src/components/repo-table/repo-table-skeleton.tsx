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
        <table aria-label="Loading repositories" className="w-full table-fixed">
          <thead>
            <tr>
              {/* Checkbox column */}
              <th className="w-12 bg-default-100 border-b border-divider px-3 py-3">
                <div className="h-4 w-4 rounded bg-default-200 animate-pulse" />
              </th>
              {COLUMN_ORDER.map((column) => (
                <th
                  className={`${column.className} bg-default-100 border-b border-divider px-3 py-3 text-left text-xs font-medium text-default-500 uppercase`}
                  key={column.key}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr className="border-b border-divider last:border-b-0" key={i}>
                {/* Checkbox cell */}
                <td className="w-12 px-3 py-3">
                  <div className="h-4 w-4 rounded bg-default-200 animate-pulse" />
                </td>
                {/* NAME column */}
                <td className="px-3 py-3">
                  <div>
                    {/* Repo name */}
                    <div className="mb-1.5">
                      <div className="h-6 w-48 rounded-lg bg-default-200 animate-pulse" />
                    </div>
                    {/* Chips row */}
                    <div className="flex gap-2 mb-2">
                      <div className="h-6 w-16 rounded-lg bg-default-200 animate-pulse" />
                      <div className="h-6 w-24 rounded-lg bg-default-200 animate-pulse" />
                    </div>
                    {/* Owner */}
                    <div className="mb-1">
                      <div className="h-4 w-32 rounded-lg bg-default-200 animate-pulse" />
                    </div>
                    {/* Description */}
                    <div className="h-4 w-full rounded-lg bg-default-200 animate-pulse" />
                  </div>
                </td>

                {/* LAST UPDATED column */}
                <td className="px-3 py-3">
                  <div className="h-4 w-20 rounded-lg bg-default-200 animate-pulse" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination skeleton - outside table border */}
      <div className="flex w-full justify-center">
        <div className="h-10 w-64 rounded-lg bg-default-200 animate-pulse" />
      </div>
    </div>
  );
}
