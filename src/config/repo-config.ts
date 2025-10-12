/**
 * Repository Table Configuration
 *
 * This file contains all constants used by the RepoTable component
 * for table columns, pagination, filters, and actions.
 */

/**
 * Table column definitions with display properties
 */
export const COLUMNS = {
  name: { className: "w-4/5", key: "name", label: "Name" },
  updatedAt: { className: "w-1/5", key: "updatedAt", label: "Last Updated" },
} as const;

/**
 * Column rendering order for the table
 */
export const COLUMN_ORDER = [COLUMNS.name, COLUMNS.updatedAt] as const;

/**
 * Available options for number of items per page
 */
export const PER_PAGE_OPTIONS = [5, 10, 20, 50, 100] as const;

/**
 * Repository type filters with their labels
 * Each key corresponds to a boolean property on the Repository type
 */
export const REPO_TYPES = [
  { key: "isPrivate", label: "Private" },
  { key: "isInOrganization", label: "Organization" },
  { key: "isFork", label: "Forked" },
  { key: "isArchived", label: "Archived" },
  { key: "isTemplate", label: "Template" },
  { key: "isMirror", label: "Mirror" },
  { key: "isDisabled", label: "Disabled" },
] as const;

/**
 * Available bulk actions for selected repositories
 */
export const REPO_ACTIONS = [
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
] as const;

// Type exports for type safety
export type ColumnKey = keyof typeof COLUMNS;
export type RepoActionKey = (typeof REPO_ACTIONS)[number]["key"];
export type RepoTypeKey = (typeof REPO_TYPES)[number]["key"];
