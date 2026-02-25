import type { Meta, StoryObj } from "@storybook/react";

import { fn } from "@storybook/test";

import RepoFilters from "./repo-filters";

const meta: Meta<typeof RepoFilters> = {
  component: RepoFilters,
  title: "Components/RepoTable/RepoFilters",
};

export default meta;
type Story = StoryObj<typeof RepoFilters>;

/** Default state with all filters visible */
export const Default: Story = {
  args: {
    onPerPageChange: fn(),
    onRepoActionChange: fn(),
    onRepoActionClick: fn(),
    onRepoTypesFilterChange: fn(),
    onSearchChange: fn(),
    perPage: 10,
    repoTypesFilter: new Set(["isArchived", "isFork", "isPrivate"]),
    searchQuery: "",
    selectedRepoAction: new Set(["archive"]),
    selectedRepoKeys: new Set(["repo-1", "repo-2"]),
  },
};

/** With active search query */
export const WithSearchQuery: Story = {
  args: {
    onPerPageChange: fn(),
    onRepoActionChange: fn(),
    onRepoActionClick: fn(),
    onRepoTypesFilterChange: fn(),
    onSearchChange: fn(),
    perPage: 10,
    repoTypesFilter: new Set(["isArchived", "isFork", "isPrivate"]),
    searchQuery: "my-repo",
    selectedRepoAction: new Set(["archive"]),
    selectedRepoKeys: new Set(["repo-1", "repo-2"]),
  },
};

/** With selected type filters */
export const FilteredByType: Story = {
  args: {
    onPerPageChange: fn(),
    onRepoActionChange: fn(),
    onRepoActionClick: fn(),
    onRepoTypesFilterChange: fn(),
    onSearchChange: fn(),
    perPage: 10,
    repoTypesFilter: new Set(["isPrivate"]),
    searchQuery: "",
    selectedRepoAction: new Set(["archive"]),
    selectedRepoKeys: new Set(["repo-1", "repo-2"]),
  },
};

/** Delete action selected */
export const DeleteAction: Story = {
  args: {
    onPerPageChange: fn(),
    onRepoActionChange: fn(),
    onRepoActionClick: fn(),
    onRepoTypesFilterChange: fn(),
    onSearchChange: fn(),
    perPage: 10,
    repoTypesFilter: new Set(["isArchived", "isFork", "isPrivate"]),
    searchQuery: "",
    selectedRepoAction: new Set(["delete"]),
    selectedRepoKeys: new Set(["repo-1", "repo-2"]),
  },
};

/** Large dataset pagination */
export const LargeDataset: Story = {
  args: {
    onPerPageChange: fn(),
    onRepoActionChange: fn(),
    onRepoActionClick: fn(),
    onRepoTypesFilterChange: fn(),
    onSearchChange: fn(),
    perPage: 50,
    repoTypesFilter: new Set(["isArchived", "isFork", "isPrivate"]),
    searchQuery: "",
    selectedRepoAction: new Set(["archive"]),
    selectedRepoKeys: new Set(Array.from({ length: 50 }, (_, i) => `repo-${i}`)),
  },
};

/** Empty results - no repos selected */
export const NoReposSelected: Story = {
  args: {
    onPerPageChange: fn(),
    onRepoActionChange: fn(),
    onRepoActionClick: fn(),
    onRepoTypesFilterChange: fn(),
    onSearchChange: fn(),
    perPage: 10,
    repoTypesFilter: new Set(["isArchived", "isFork", "isPrivate"]),
    searchQuery: "nonexistent-repo",
    selectedRepoAction: new Set(["archive"]),
    selectedRepoKeys: new Set(),
  },
};
