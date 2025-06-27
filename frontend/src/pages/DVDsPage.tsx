import React, { useEffect, useState } from "react";
import {
  Container,
  Grid,
  Typography,
  Box,
  TextField,
  MenuItem,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  Paper,
  InputAdornment,
  IconButton,
  Drawer,
  useMediaQuery,
  Button,
  CircularProgress,
  Alert,
  AlertTitle,
  Chip,
  Stack,
  useTheme,
} from "@mui/material";
import { useSearchParams } from "react-router-dom";

import DVDCard from "../components/dvds/DVDCard";
import MainLayout from "../components/layouts/MainLayout";
import DVDFilterPanel from "../components/dvds/DVDFilterPanel";
import { useDVDStore } from "../store/dvdStore";
import { DVDQuery } from "../types/product.types";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";

const sortOptions = [
  { value: "title:asc", label: "Title (A-Z)" },
  { value: "title:desc", label: "Title (Z-A)" },
  { value: "price:asc", label: "Price: Low to High" },
  { value: "price:desc", label: "Price: High to Low" },
  { value: "runtime:asc", label: "Runtime: Short to Long" },
  { value: "runtime:desc", label: "Runtime: Long to Short" },
  { value: "createdAt:desc", label: "Recently Added" },
];

const DVDsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    dvds,
    totalItems,
    currentPage,
    totalPages,
    isLoading,
    error,
    fetchDVDs,
    fetchFilmTypes,
    fetchDiscTypes,
  } = useDVDStore();

  const [filters, setFilters] = useState<DVDQuery>({
    page: 1,
    limit: 12,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState("createdAt:desc");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Load types when component mounts
  useEffect(() => {
    fetchFilmTypes();
    fetchDiscTypes();
  }, [fetchFilmTypes, fetchDiscTypes]);

  // Parse filters from URL
  const parseFiltersFromUrl = () => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    const urlFilters: Partial<DVDQuery> = {};
    if (params.search) urlFilters.search = params.search;
    if (params.director) urlFilters.director = params.director;
    if (params.studio) urlFilters.studio = params.studio;
    if (params.page) urlFilters.page = Number(params.page);
    if (params.filmTypes) urlFilters.filmTypes = params.filmTypes.split(",");
    if (params.discTypes) urlFilters.discTypes = params.discTypes.split(",");
    if (params.minPrice) urlFilters.minPrice = Number(params.minPrice);
    if (params.maxPrice) urlFilters.maxPrice = Number(params.maxPrice);
    if (params.minRuntime) urlFilters.minRuntime = Number(params.minRuntime);
    if (params.maxRuntime) urlFilters.maxRuntime = Number(params.maxRuntime);
    if (params.inStock) urlFilters.inStock = params.inStock === "true";
    if (params.onSale) urlFilters.onSale = params.onSale === "true";
    if (params.sortBy) urlFilters.sortBy = params.sortBy;
    if (params.sortOrder)
      urlFilters.sortOrder = params.sortOrder as "asc" | "desc";
    return urlFilters;
  };

  // Initialize filters from URL on component mount
  useEffect(() => {
    const urlFilters = parseFiltersFromUrl();
    if (Object.keys(urlFilters).length > 0) {
      setFilters({ ...filters, ...urlFilters });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Fetch DVDs when filters change
  useEffect(() => {
    fetchDVDs(filters);
  }, [filters, fetchDVDs]);

  // Update URL when filters change
  const updateUrlParams = (newFilters: Partial<DVDQuery>) => {
    const updatedFilters = { ...filters, ...newFilters };
    console.log("DVDsPage: Updating URL with filters:", updatedFilters);
    const newParams = new URLSearchParams();

    // Only add parameters with values to URL
    if (updatedFilters.search) newParams.set("search", updatedFilters.search);
    if (updatedFilters.director) newParams.set("director", updatedFilters.director);
    if (updatedFilters.studio) newParams.set("studio", updatedFilters.studio);
    if (updatedFilters.page && updatedFilters.page > 1)
      newParams.set("page", updatedFilters.page.toString());
    if (updatedFilters.filmTypes && updatedFilters.filmTypes.length > 0) {
      newParams.set("filmTypes", updatedFilters.filmTypes.join(","));
    }
    if (updatedFilters.discTypes && updatedFilters.discTypes.length > 0) {
      newParams.set("discTypes", updatedFilters.discTypes.join(","));
    }
    if (updatedFilters.minPrice)
      newParams.set("minPrice", updatedFilters.minPrice.toString());
    if (updatedFilters.maxPrice)
      newParams.set("maxPrice", updatedFilters.maxPrice.toString());
    if (updatedFilters.minRuntime)
      newParams.set("minRuntime", updatedFilters.minRuntime.toString());
    if (updatedFilters.maxRuntime)
      newParams.set("maxRuntime", updatedFilters.maxRuntime.toString());
    if (updatedFilters.inStock)
      newParams.set("inStock", updatedFilters.inStock.toString());
    if (updatedFilters.onSale)
      newParams.set("onSale", updatedFilters.onSale.toString());
    if (updatedFilters.sortBy) newParams.set("sortBy", updatedFilters.sortBy);
    if (updatedFilters.sortOrder)
      newParams.set("sortOrder", updatedFilters.sortOrder);

    setSearchParams(newParams);
  };

  // Handle search submit
  const handleSearch = () => {
    const newFilters = { ...filters, search: searchTerm, page: 1 };
    setFilters(newFilters);
    updateUrlParams(newFilters);
  };

  // Handle search on Enter key
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Handle sort change
  const handleSortChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const value = event.target.value as string;
    setSort(value);

    // Parse sort option
    const [sortBy, sortOrder] = value.split(":");
    const sortFilters = {
      ...filters,
      sortBy,
      sortOrder: sortOrder as "asc" | "desc",
      page: 1,
    };

    // Update filters and URL
    setFilters(sortFilters);
    updateUrlParams(sortFilters);
  };

  // Handle filter change from FilterPanel
  const handleFilterChange = (newFilters: Partial<DVDQuery>) => {
    console.log("DVDsPage: Filter changed:", newFilters);
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    updateUrlParams(updatedFilters);
  };

  // Handle pagination change
  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    updateUrlParams(newFilters);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Reset all filters
  const handleResetFilters = () => {
    // Reset local state
    setSearchTerm("");
    setSort("createdAt:desc");

    // Reset filters
    const resetFilters: DVDQuery = {
      page: 1,
      limit: 12,
      sortBy: "createdAt",
      sortOrder: "desc",
    };
    setFilters(resetFilters);

    // Clear URL parameters
    setSearchParams({});
  };

  // Apply current filters (for mobile)
  const handleApplyFilters = () => {
    setDrawerOpen(false);
  };

  // Generate list of active filters for display
  const getActiveFilters = () => {
    const activeFilters = [];

    if (filters.search) {
      activeFilters.push({
        label: `Search: ${filters.search}`,
        value: "search",
      });
    }

    if (filters.director) {
      activeFilters.push({
        label: `Director: ${filters.director}`,
        value: "director",
      });
    }

    if (filters.studio) {
      activeFilters.push({
        label: `Studio: ${filters.studio}`,
        value: "studio",
      });
    }

    if (filters.filmTypes && filters.filmTypes.length > 0) {
      filters.filmTypes.forEach((filmType) => {
        activeFilters.push({
          label: `Film: ${filmType}`,
          value: `filmType:${filmType}`,
        });
      });
    }

    if (filters.discTypes && filters.discTypes.length > 0) {
      filters.discTypes.forEach((discType) => {
        activeFilters.push({
          label: `Disc: ${discType}`,
          value: `discType:${discType}`,
        });
      });
    }

    if (filters.minPrice !== undefined) {
      activeFilters.push({
        label: `Min Price: $${filters.minPrice}`,
        value: "minPrice",
      });
    }

    if (filters.maxPrice !== undefined) {
      activeFilters.push({
        label: `Max Price: $${filters.maxPrice}`,
        value: "maxPrice",
      });
    }

    if (filters.minRuntime !== undefined) {
      const hours = Math.floor(filters.minRuntime / 60);
      const mins = filters.minRuntime % 60;
      const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      activeFilters.push({
        label: `Min Runtime: ${timeStr}`,
        value: "minRuntime",
      });
    }

    if (filters.maxRuntime !== undefined) {
      const hours = Math.floor(filters.maxRuntime / 60);
      const mins = filters.maxRuntime % 60;
      const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      activeFilters.push({
        label: `Max Runtime: ${timeStr}`,
        value: "maxRuntime",
      });
    }

    if (filters.inStock) {
      activeFilters.push({
        label: "In Stock Only",
        value: "inStock",
      });
    }

    if (filters.onSale) {
      activeFilters.push({
        label: "On Sale",
        value: "onSale",
      });
    }

    return activeFilters;
  };

  // Handle removing a filter
  const handleRemoveFilter = (filterValue: string) => {
    let newFilters: DVDQuery = { ...filters };

    if (filterValue === "search") {
      setSearchTerm("");
      newFilters.search = undefined;
    } else if (filterValue === "director") {
      newFilters.director = undefined;
    } else if (filterValue === "studio") {
      newFilters.studio = undefined;
    } else if (filterValue === "minPrice") {
      newFilters.minPrice = undefined;
    } else if (filterValue === "maxPrice") {
      newFilters.maxPrice = undefined;
    } else if (filterValue === "minRuntime") {
      newFilters.minRuntime = undefined;
    } else if (filterValue === "maxRuntime") {
      newFilters.maxRuntime = undefined;
    } else if (filterValue === "inStock") {
      newFilters.inStock = undefined;
    } else if (filterValue === "onSale") {
      newFilters.onSale = undefined;
    } else if (filterValue.startsWith("filmType:")) {
      const typeToRemove = filterValue.split(":")[1];
      if (filters.filmTypes) {
        newFilters.filmTypes = filters.filmTypes.filter(
          (type) => type !== typeToRemove
        );
        if (newFilters.filmTypes.length === 0) {
          newFilters.filmTypes = undefined;
        }
      }
    } else if (filterValue.startsWith("discType:")) {
      const typeToRemove = filterValue.split(":")[1];
      if (filters.discTypes) {
        newFilters.discTypes = filters.discTypes.filter(
          (type) => type !== typeToRemove
        );
        if (newFilters.discTypes.length === 0) {
          newFilters.discTypes = undefined;
        }
      }
    }

    // Apply the updated filters
    setFilters(newFilters);
    updateUrlParams(newFilters);
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    handleResetFilters();
  };

  // Toggle mobile filter drawer
  const toggleDrawer = (open: boolean) => {
    setDrawerOpen(open);
  };

  // Active filters list
  const activeFilters = getActiveFilters();

  return (
    <MainLayout>
      <Container maxWidth={false} sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            component="h1"
            fontWeight="bold"
            gutterBottom
          >
            DVD Catalog
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Browse our collection of movie DVDs. Find films from your favorite directors and studios.
          </Typography>
        </Box>

        {/* Mobile Filter Toggle Button */}
        {isMobile && (
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => toggleDrawer(true)}
            sx={{ mb: 2, width: "100%" }}
          >
            Filter DVDs
          </Button>
        )}

        {/* Mobile Filter Drawer */}
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => toggleDrawer(false)}
          sx={{
            "& .MuiDrawer-paper": {
              width: "80%",
              maxWidth: "350px",
              boxSizing: "border-box",
            },
          }}
        >
          <DVDFilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
            isMobile={true}
          />
        </Drawer>

        <Grid container spacing={3}>
          {/* Filter Panel - Desktop */}
          {!isMobile && (
            <Grid
              size={{ xs: 12, md: 3 }}
              sx={{ display: { xs: "none", md: "block" } }}
            >
              <Paper
                elevation={2}
                sx={{
                  height: "100%",
                  position: "sticky",
                  top: "80px",
                  overflow: "hidden",
                }}
              >
                <DVDFilterPanel
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onApplyFilters={() => {}}
                  onResetFilters={handleResetFilters}
                  isMobile={false}
                />
              </Paper>
            </Grid>
          )}
          {/* Main Content Area */}
          <Grid size={{ xs: 12, md: 9 }}>
            {/* Top bar with search, sort and filter count */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "stretch", sm: "center" },
                mb: 3,
                gap: 2,
              }}
            >
              <TextField
                placeholder="Search DVDs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                sx={{ flexGrow: 1, maxWidth: { sm: "300px" } }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleSearch} edge="end">
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                size="small"
              />

              <Box sx={{ display: "flex", gap: 2 }}>
                <FormControl
                  size="small"
                  sx={{ minWidth: 120, maxWidth: "100%" }}
                >
                  <InputLabel id="sort-label">Sort By</InputLabel>
                  <Select
                    labelId="sort-label"
                    value={sort}
                    label="Sort By"
                    onChange={handleSortChange as any}
                  >
                    {sortOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Active Filter Chips */}
            {activeFilters.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {activeFilters.map((filter) => (
                    <Chip
                      key={filter.value}
                      label={filter.label}
                      onDelete={() => handleRemoveFilter(filter.value)}
                      size="medium"
                      sx={{ mb: 1 }}
                    />
                  ))}
                  <Chip
                    label="Clear All"
                    onClick={handleClearAllFilters}
                    deleteIcon={<ClearIcon />}
                    onDelete={handleClearAllFilters}
                    variant="outlined"
                    color="error"
                    size="medium"
                    sx={{ mb: 1 }}
                  />
                </Stack>
              </Box>
            )}

            {/* Results count and loading/error states */}
            <Box sx={{ mb: 3 }}>
              {isLoading ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "100px",
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <AlertTitle>Error</AlertTitle>
                  There was an error loading the DVDs. Please try again.
                </Alert>
              ) : dvds.length === 0 ? (
                <Alert severity="info">
                  <AlertTitle>No DVDs found</AlertTitle>
                  Try adjusting your filters to see more results.
                </Alert>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Showing {dvds.length} of {totalItems} DVDs
                </Typography>
              )}
            </Box>

            {/* DVD Grid */}
            <Grid container spacing={3}>
              {dvds.map((dvd) => (
                <Grid
                  key={dvd.id}
                  size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2.4 }}
                  sx={{ display: "flex" }}
                >
                  <DVDCard dvd={dvd} />
                </Grid>
              ))}
            </Grid>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mt: 4,
                  mb: 2,
                }}
              >
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>
    </MainLayout>
  );
};

export default DVDsPage;