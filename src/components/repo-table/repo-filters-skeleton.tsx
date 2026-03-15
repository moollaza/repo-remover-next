export default function RepoFiltersSkeleton(): JSX.Element {
  return (
    <div
      className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-2"
      data-testid="repo-filters-skeleton"
    >
      {/* Per page selector skeleton */}
      <div className="w-full lg:w-20">
        <div className="h-10 w-full rounded-lg bg-default-200 animate-pulse" />
      </div>

      {/* Repo type selector skeleton */}
      <div className="w-full lg:w-44">
        <div className="h-10 w-full rounded-lg bg-default-200 animate-pulse" />
      </div>

      {/* Search input skeleton */}
      <div className="w-full lg:flex-1">
        <div className="h-10 w-full rounded-lg bg-default-200 animate-pulse" />
      </div>

      {/* Action buttons skeleton */}
      <div className="w-full lg:w-auto lg:flex-shrink-0">
        <div className="h-10 w-48 rounded-lg bg-default-200 animate-pulse" />
      </div>
    </div>
  );
}
