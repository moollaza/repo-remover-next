export default function RepoFiltersSkeleton(): JSX.Element {
  return (
    <div
      className="grid grid-cols-12 gap-3"
      data-testid="repo-filters-skeleton"
    >
      {/* Per page selector skeleton */}
      <div className="col-span-2">
        <div className="h-10 w-full rounded-lg bg-default-200 animate-pulse" />
      </div>

      {/* Repo type selector skeleton */}
      <div className="col-span-6">
        <div className="h-10 w-full rounded-lg bg-default-200 animate-pulse" />
      </div>

      {/* Search input skeleton */}
      <div className="col-span-4">
        <div className="h-10 w-full rounded-lg bg-default-200 animate-pulse" />
      </div>

      {/* Action buttons skeleton */}
      <div className="col-span-3">
        <div className="h-10 w-full rounded-lg bg-default-200 animate-pulse" />
      </div>
    </div>
  );
}
