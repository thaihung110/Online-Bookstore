import { useState, useCallback } from "react";
import {
  UserFilters,
  DEFAULT_USER_FILTERS,
  UserSortField,
} from "../types/user.types";

/**
 * Custom hook for managing user filters state and actions
 *
 * @param initialFilters - Optional initial filter state that overrides defaults
 * @returns Filter state and handler methods
 */
export const useUserFilters = (initialFilters?: Partial<UserFilters>) => {
  const [filters, setFilters] = useState<UserFilters>({
    ...DEFAULT_USER_FILTERS,
    ...initialFilters,
  });

  // Update filters with partial update
  const updateFilters = useCallback((newFilters: Partial<UserFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      // Reset to page 1 if filters other than pagination change
      ...(Object.keys(newFilters).some(
        (key) => key !== "page" && key !== "limit"
      )
        ? { page: 1 }
        : {}),
    }));
  }, []);

  // Reset filters to defaults
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_USER_FILTERS);
  }, []);

  // Update search text
  const updateSearch = useCallback(
    (search: string) => {
      updateFilters({ search, page: 1 });
    },
    [updateFilters]
  );

  // Update sort field and direction
  const updateSort = useCallback(
    (sortBy: UserSortField) => {
      updateFilters({
        sortBy,
        sortOrder:
          filters.sortBy === sortBy && filters.sortOrder === "asc"
            ? "desc"
            : "asc",
        page: 1,
      });
    },
    [filters.sortBy, filters.sortOrder, updateFilters]
  );

  // Change page
  const changePage = useCallback(
    (page: number) => {
      updateFilters({ page: page + 1 }); // MUI pagination is 0-indexed
    },
    [updateFilters]
  );

  // Change rows per page
  const changeRowsPerPage = useCallback(
    (limit: number) => {
      updateFilters({ limit, page: 1 });
    },
    [updateFilters]
  );

  return {
    filters,
    updateFilters,
    resetFilters,
    updateSearch,
    updateSort,
    changePage,
    changeRowsPerPage,
  };
};
