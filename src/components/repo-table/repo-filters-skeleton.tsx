import { Skeleton } from "@heroui/react";

export default function RepoFiltersSkeleton(): JSX.Element {
  return (
    <div className="grid grid-cols-12 gap-3" data-testid="repo-filters-skeleton">
      {/* Per page selector skeleton */}
      <div className="col-span-2">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>

      {/* Repo type selector skeleton */}
      <div className="col-span-6">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>

      {/* Search input skeleton */}
      <div className="col-span-4">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>

      {/* Action buttons skeleton */}
      <div className="col-span-3">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}
