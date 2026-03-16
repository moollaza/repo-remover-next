import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/16/solid";
import {
  Button,
  ButtonGroup,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Kbd,
  Select,
  type Selection,
  SelectItem,
} from "@heroui/react";
import { useEffect, useRef } from "react";

const PER_PAGE_OPTIONS = [5, 10, 20, 50, 100];
const REPO_TYPES = [
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

// Remove unused `all` type from the Selection type
export type SelectionSet = Exclude<Selection, "all">;

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="grid grid-cols-12 gap-3">
      {/* PER PAGE SELECTOR */}
      <div className="col-span-2">
        <Select
          data-testid="per-page-select"
          label="Repos per page"
          onSelectionChange={onPerPageChange}
          placeholder="Per page"
          selectedKeys={new Set([perPage.toString()])}
          selectionMode="single"
          size="sm"
        >
          {PER_PAGE_OPTIONS.map((option) => (
            <SelectItem
              data-testid={`per-page-option-${option}`}
              key={option}
              textValue={option.toString()}
            >
              {option}
            </SelectItem>
          ))}
        </Select>
      </div>

      {/* REPO TYPE SELECTOR */}
      <div className="col-span-6">
        <Select
          data-testid="repo-type-select"
          defaultSelectedKeys={new Set(REPO_TYPES.map((type) => type.key))}
          items={REPO_TYPES}
          label="Repo types to show"
          onSelectionChange={onRepoTypesFilterChange}
          placeholder="Filter by type"
          selectedKeys={repoTypesFilter}
          selectionMode="multiple"
          size="sm"
        >
          {(repoType) => (
            <SelectItem
              data-testid={`repo-type-select-item-${repoType.key}`}
              key={repoType.key}
            >
              {repoType.label}
            </SelectItem>
          )}
        </Select>
      </div>

      {/* SEARCH INPUT */}
      <div className="col-span-4">
        <Input
          data-testid="repo-search-input"
          endContent={<Kbd keys={["command"]}>K</Kbd>}
          label="Search"
          onValueChange={onSearchChange}
          placeholder="Search by name or description"
          ref={searchInputRef}
          size="sm"
          startContent={<MagnifyingGlassIcon className="h-5 w-5" />}
          value={searchQuery}
        />
      </div>

      {/* ACTION BUTTONS */}
      <div className="col-span-3">
        <ButtonGroup>
          <Button
            color={selectedRepoAction.has("delete") ? "danger" : "warning"}
            data-testid={`repo-action-button-${selectedRepoAction.has("delete") ? "delete" : "archive"}`}
            isDisabled={
              selectedRepoKeys !== "all" && selectedRepoKeys.size === 0
            }
            onPress={onRepoActionClick}
            size="md"
          >
            {REPO_ACTIONS.find((action) => selectedRepoAction.has(action.key))
              ?.label ?? "Select Action"}
          </Button>
          <Dropdown placement="bottom-end" size="md">
            <DropdownTrigger>
              <Button
                color={selectedRepoAction.has("delete") ? "danger" : "warning"}
                data-testid="repo-action-dropdown-trigger"
                isIconOnly
                size="md"
              >
                <ChevronDownIcon className="h-4 w-4" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Repo actions"
              className="max-w-[300px]"
              data-testid="repo-action-dropdown-menu"
              disallowEmptySelection
              onSelectionChange={onRepoActionChange}
              selectedKeys={selectedRepoAction}
              selectionMode="single"
            >
              {REPO_ACTIONS.map((action) => (
                <DropdownItem
                  data-testid={`repo-action-dropdown-item-${action.key}`}
                  description={action.description}
                  key={action.key}
                >
                  {action.label}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </ButtonGroup>
      </div>
    </div>
  );
}

// Export constants for use in other components
export { PER_PAGE_OPTIONS, REPO_ACTIONS, REPO_TYPES };
