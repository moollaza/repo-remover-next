import {
  ChevronDown as ChevronDownIcon,
  Search as MagnifyingGlassIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { type Selection, type SelectionSet } from "@/hooks/use-repo-filters";

const PER_PAGE_OPTIONS = [5, 10, 20, 50, 100];
const REPO_TYPES = [
  { key: "isSource", label: "Sources" },
  { key: "isPrivate", label: "Private" },
  { key: "isInOrganization", label: "Organization" },
  { key: "isFork", label: "Forked" },
  { key: "isArchived", label: "Archived" },
  { key: "isTemplate", label: "Template" },
  { key: "isMirror", label: "Mirror" },
  { key: "isDisabled", label: "Disabled" },
];
const REPO_ACTIONS = [
  {
    description: "This can be undone later",
    key: "archive",
    label: "Archive Selected Repos",
  },
  {
    description: "This action is irreversible",
    key: "delete",
    label: "Delete Selected Repos",
  },
];

export interface RepoFiltersProps {
  onPerPageChange: (keys: Selection) => void;
  onRepoActionChange: (keys: Selection) => void;
  onRepoActionClick: () => void;
  onRepoTypesFilterChange: (keys: Selection) => void;
  onSearchChange: (value: string) => void;
  perPage: number;
  repoTypesFilter: SelectionSet;
  searchQuery: string;
  selectedRepoAction: SelectionSet;
  selectedRepoKeys: Selection;
}

export { type SelectionSet } from "@/hooks/use-repo-filters";

export default function RepoFilters({
  onPerPageChange,
  onRepoActionChange,
  onRepoActionClick,
  onRepoTypesFilterChange,
  onSearchChange,
  perPage,
  repoTypesFilter,
  searchQuery,
  selectedRepoAction,
  selectedRepoKeys,
}: RepoFiltersProps): JSX.Element {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [perPageOpen, setPerPageOpen] = useState(false);
  const [repoTypeOpen, setRepoTypeOpen] = useState(false);
  const [actionDropdownOpen, setActionDropdownOpen] = useState(false);
  const perPageDropdownRef = useRef<HTMLDivElement>(null);
  const repoTypeDropdownRef = useRef<HTMLDivElement>(null);
  const actionDropdownRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        perPageDropdownRef.current &&
        !perPageDropdownRef.current.contains(event.target as Node)
      ) {
        setPerPageOpen(false);
      }
      if (
        repoTypeDropdownRef.current &&
        !repoTypeDropdownRef.current.contains(event.target as Node)
      ) {
        setRepoTypeOpen(false);
      }
      if (
        actionDropdownRef.current &&
        !actionDropdownRef.current.contains(event.target as Node)
      ) {
        setActionDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handlePerPageSelect = useCallback(
    (value: string) => {
      onPerPageChange(new Set([value]));
      setPerPageOpen(false);
    },
    [onPerPageChange],
  );

  const handleRepoTypeToggle = useCallback(
    (key: string) => {
      const newSet = new Set(repoTypesFilter);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      onRepoTypesFilterChange(newSet);
    },
    [repoTypesFilter, onRepoTypesFilterChange],
  );

  const handleActionSelect = useCallback(
    (key: string) => {
      onRepoActionChange(new Set([key]));
      setActionDropdownOpen(false);
    },
    [onRepoActionChange],
  );

  const isDisabled = selectedRepoKeys !== "all" && selectedRepoKeys.size === 0;

  const isDeleteAction = selectedRepoAction.has("delete");

  // Summarize selected repo types for the trigger button
  const selectedTypeLabels = REPO_TYPES.filter((t) =>
    repoTypesFilter.has(t.key),
  ).map((t) => t.label);
  const typesSummary =
    selectedTypeLabels.length === REPO_TYPES.length
      ? "All"
      : selectedTypeLabels.length === 0
        ? "None"
        : selectedTypeLabels.join(", ");

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-2">
      {/* PER PAGE SELECTOR */}
      <div className="w-full md:w-20" ref={perPageDropdownRef}>
        <div
          className="relative cursor-pointer"
          data-testid="per-page-select"
          onClick={() => setPerPageOpen((prev) => !prev)}
        >
          <label className="sr-only" id="per-page-label">
            Repos per page
          </label>
          <div
            aria-labelledby="per-page-label"
            className="w-full h-10 px-3 rounded-lg border border-divider bg-content1 text-foreground text-sm text-left flex items-center justify-between hover:bg-content2 transition-colors"
          >
            <span>{perPage}</span>
            <ChevronDownIcon className="h-4 w-4 text-default-400" />
          </div>
          {perPageOpen && (
            <ul
              className="absolute z-50 mt-1 w-full rounded-lg border border-divider bg-content1 shadow-lg py-1 max-h-60 overflow-auto"
              onClick={(e) => e.stopPropagation()}
              role="listbox"
            >
              {PER_PAGE_OPTIONS.map((option) => (
                <li
                  aria-selected={perPage === option}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-content2 transition-colors ${
                    perPage === option
                      ? "bg-primary-50 text-primary font-medium"
                      : "text-foreground"
                  }`}
                  data-testid={`per-page-option-${option}`}
                  key={option}
                  onClick={() => handlePerPageSelect(option.toString())}
                  role="option"
                >
                  {option}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* REPO TYPE SELECTOR */}
      <div
        className="w-full md:w-44 md:flex-shrink-0"
        ref={repoTypeDropdownRef}
      >
        <div
          className="relative cursor-pointer"
          data-testid="repo-type-select"
          onClick={() => setRepoTypeOpen((prev) => !prev)}
        >
          <div className="w-full h-10 px-3 rounded-lg border border-divider bg-content1 text-foreground text-sm text-left flex items-center justify-between hover:bg-content2 transition-colors">
            <span className="truncate">{typesSummary}</span>
            <ChevronDownIcon className="h-4 w-4 text-default-400 shrink-0" />
          </div>
          {repoTypeOpen && (
            <ul
              className="absolute z-50 mt-1 w-full rounded-lg border border-divider bg-content1 shadow-lg py-1 max-h-60 overflow-auto"
              onClick={(e) => e.stopPropagation()}
              role="listbox"
            >
              {REPO_TYPES.map((repoType) => (
                <li
                  aria-selected={repoTypesFilter.has(repoType.key)}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-content2 transition-colors flex items-center gap-2 ${
                    repoTypesFilter.has(repoType.key)
                      ? "text-foreground"
                      : "text-default-400"
                  }`}
                  data-testid={`repo-type-select-item-${repoType.key}`}
                  key={repoType.key}
                  onClick={() => handleRepoTypeToggle(repoType.key)}
                  role="option"
                >
                  <input
                    checked={repoTypesFilter.has(repoType.key)}
                    className="rounded border-divider"
                    onChange={() => handleRepoTypeToggle(repoType.key)}
                    type="checkbox"
                  />
                  {repoType.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* SEARCH INPUT */}
      <div className="w-full md:flex-1">
        <div>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-default-400" />
            </div>
            <input
              aria-label="Search"
              className="w-full h-10 pl-10 pr-16 rounded-lg border border-divider bg-content1 text-foreground text-sm placeholder:text-default-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              data-testid="repo-search-input"
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name or description"
              ref={searchInputRef}
              type="text"
              value={searchQuery}
            />
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-divider bg-content2 text-default-500 text-xs font-mono">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="w-full md:w-auto md:flex-shrink-0">
        <div className="flex">
          <div className="flex">
            <button
              className={`h-10 px-4 py-2 text-sm font-medium rounded-l-lg transition-colors text-white ${
                isDeleteAction
                  ? "bg-danger hover:bg-danger/90"
                  : "bg-warning hover:bg-warning/90"
              } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
              data-testid={`repo-action-button-${isDeleteAction ? "delete" : "archive"}`}
              disabled={isDisabled}
              onClick={onRepoActionClick}
              type="button"
            >
              {REPO_ACTIONS.find((action) => selectedRepoAction.has(action.key))
                ?.label ?? "Select Action"}
            </button>
            <div className="relative" ref={actionDropdownRef}>
              <button
                className={`h-10 px-2 py-2 rounded-r-lg border-l border-white/20 transition-colors text-white ${
                  isDeleteAction
                    ? "bg-danger hover:bg-danger/90"
                    : "bg-warning hover:bg-warning/90"
                }`}
                data-testid="repo-action-dropdown-trigger"
                onClick={() => setActionDropdownOpen((prev) => !prev)}
                type="button"
              >
                <ChevronDownIcon className="h-4 w-4" />
              </button>
              {actionDropdownOpen && (
                <div
                  className="absolute right-0 z-50 mt-1 w-72 rounded-lg border border-divider bg-content1 shadow-lg py-1"
                  data-testid="repo-action-dropdown-menu"
                >
                  {REPO_ACTIONS.map((action) => (
                    <button
                      className={`w-full px-3 py-2 text-left hover:bg-content2 transition-colors ${
                        selectedRepoAction.has(action.key) ? "bg-content2" : ""
                      }`}
                      data-testid={`repo-action-dropdown-item-${action.key}`}
                      key={action.key}
                      onClick={() => handleActionSelect(action.key)}
                      type="button"
                    >
                      <div className="text-sm font-medium text-foreground">
                        {action.label}
                      </div>
                      <div className="text-xs text-default-500">
                        {action.description}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export constants for use in other components
export { PER_PAGE_OPTIONS, REPO_ACTIONS, REPO_TYPES };
