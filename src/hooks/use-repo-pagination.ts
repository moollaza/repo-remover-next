import { useCallback, useMemo, useState } from "react";

import { PER_PAGE_OPTIONS } from "@/config/repo-config";

import { type Selection } from "./use-repo-filters";

export interface UseRepoPaginationProps<T> {
  /**
   * Array of items to paginate
   */
  items: T[];
}

export interface UseRepoPaginationReturn<T> {
  /**
   * Current page number (1-indexed)
   */
  currentPage: number;
  /**
   * Current page of items
   */
  paginatedItems: T[];
  /**
   * Number of items per page
   */
  perPage: number;
  /**
   * Reset pagination to page 1 (useful after filter changes)
   */
  resetPage: () => void;
  /**
   * Set the current page
   */
  setCurrentPage: (page: number) => void;
  /**
   * Update the items per page and reset to page 1
   */
  setPerPage: (keys: Selection) => void;
  /**
   * Total number of pages
   */
  totalPages: number;
}

/**
 * Custom hook for paginating items.
 *
 * Handles:
 * - Pagination calculations
 * - Items per page selection
 * - Page boundaries
 * - Automatic page reset when filters change
 *
 * @example
 * ```tsx
 * const {
 *   paginatedItems,
 *   currentPage,
 *   setCurrentPage,
 *   perPage,
 *   setPerPage,
 *   totalPages,
 *   resetPage
 * } = useRepoPagination({ items: filteredRepos });
 * ```
 */
export function useRepoPagination<T>({
  items,
}: UseRepoPaginationProps<T>): UseRepoPaginationReturn<T> {
  const [perPage, setPerPageState] = useState<number>(PER_PAGE_OPTIONS[0]);
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate total pages
  const totalPages = Math.ceil(items.length / perPage);

  // Auto-clamp page if it exceeds total pages (e.g. after filtering).
  // Note: internal currentPage state may diverge from effectivePage, but this
  // is acceptable since pagination buttons prevent navigating beyond bounds.
  const effectivePage =
    currentPage > totalPages && totalPages > 0 ? 1 : currentPage;

  // Get the current page of items
  const paginatedItems = useMemo(() => {
    const start = (effectivePage - 1) * perPage;
    const end = start + perPage;

    return items.slice(start, end);
  }, [items, effectivePage, perPage]);

  // Handle per page change with Selection type
  const setPerPage = useCallback((keys: Selection) => {
    const newPerPage = Number(Array.from(keys as Set<string>)[0]);
    setPerPageState(newPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  }, []);

  // Reset to first page (useful when filters change)
  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage: effectivePage,
    paginatedItems,
    perPage,
    resetPage,
    setCurrentPage,
    setPerPage,
    totalPages,
  };
}
