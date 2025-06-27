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

import CDCard from "../components/cds/CDCard";
import MainLayout from "../components/layouts/MainLayout";
import CDFilterPanel from "../components/cds/CDFilterPanel";
import { useCDStore } from "../store/cdStore";
import { CDQuery } from "../types/product.types";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";

const sortOptions = [
  { value: "title:asc", label: "Title (A-Z)" },
  { value: "title:desc", label: "Title (Z-A)" },
  { value: "price:asc", label: "Price: Low to High" },
  { value: "price:desc", label: "Price: High to Low" },
  { value: "createdAt:desc", label: "Recently Added" },
];

const CDsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    cds,
    totalItems,
    currentPage,
    totalPages,
    isLoading,
    error,
    fetchCDs,
    fetchCategories,
  } = useCDStore();

  const [filters, setFilters] = useState<CDQuery>({
    page: 1,
    limit: 12,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState("createdAt:desc");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Load categories when component mounts
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Parse filters from URL
  const parseFiltersFromUrl = () => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    const urlFilters: Partial<CDQuery> = {};
    if (params.search) urlFilters.search = params.search;
    if (params.artist) urlFilters.artist = params.artist;
    if (params.albumTitle) urlFilters.albumTitle = params.albumTitle;
    if (params.page) urlFilters.page = Number(params.page);
    if (params.categories) urlFilters.categories = params.categories.split(",");
    if (params.minPrice) urlFilters.minPrice = Number(params.minPrice);
    if (params.maxPrice) urlFilters.maxPrice = Number(params.maxPrice);
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

  // Fetch CDs when filters change
  useEffect(() => {
    fetchCDs(filters);
  }, [filters, fetchCDs]);

  // Update URL when filters change
  const updateUrlParams = (newFilters: Partial<CDQuery>) => {
    const updatedFilters = { ...filters, ...newFilters };
    console.log("CDsPage: Updating URL with filters:", updatedFilters);
    const newParams = new URLSearchParams();

    // Only add parameters with values to URL
    if (updatedFilters.search) newParams.set("search", updatedFilters.search);
    if (updatedFilters.artist) newParams.set("artist", updatedFilters.artist);
    if (updatedFilters.albumTitle) newParams.set("albumTitle", updatedFilters.albumTitle);
    if (updatedFilters.page && updatedFilters.page > 1)
      newParams.set("page", updatedFilters.page.toString());
    if (updatedFilters.categories && updatedFilters.categories.length > 0) {
      newParams.set("categories", updatedFilters.categories.join(","));
    }
    if (updatedFilters.minPrice)
      newParams.set("minPrice", updatedFilters.minPrice.toString());
    if (updatedFilters.maxPrice)
      newParams.set("maxPrice", updatedFilters.maxPrice.toString());
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
  const handleFilterChange = (newFilters: Partial<CDQuery>) => {
    console.log("CDsPage: Filter changed:", newFilters);
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
    const resetFilters: CDQuery = {
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

    if (filters.artist) {
      activeFilters.push({
        label: `Artist: ${filters.artist}`,
        value: "artist",
      });
    }

    if (filters.albumTitle) {
      activeFilters.push({
        label: `Album: ${filters.albumTitle}`,
        value: "albumTitle",
      });
    }

    if (filters.categories && filters.categories.length > 0) {
      filters.categories.forEach((category) => {
        activeFilters.push({
          label: `Category: ${category}`,
          value: `category:${category}`,
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
    let newFilters: CDQuery = { ...filters };

    if (filterValue === "search") {
      setSearchTerm("");
      newFilters.search = undefined;
    } else if (filterValue === "artist") {
      newFilters.artist = undefined;
    } else if (filterValue === "albumTitle") {
      newFilters.albumTitle = undefined;
    } else if (filterValue === "minPrice") {
      newFilters.minPrice = undefined;
    } else if (filterValue === "maxPrice") {
      newFilters.maxPrice = undefined;
    } else if (filterValue === "inStock") {
      newFilters.inStock = undefined;
    } else if (filterValue === "onSale") {
      newFilters.onSale = undefined;
    } else if (filterValue.startsWith("category:")) {
      const categoryToRemove = filterValue.split(":")[1];
      if (filters.categories) {
        newFilters.categories = filters.categories.filter(
          (category) => category !== categoryToRemove
        );
        if (newFilters.categories.length === 0) {
          newFilters.categories = undefined;
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
            CD Catalog
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Browse our collection of music CDs. Discover albums from your favorite artists.
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
            Filter CDs
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
          <CDFilterPanel
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
                <CDFilterPanel
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
                placeholder="Search CDs..."
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
                  There was an error loading the CDs. Please try again.
                </Alert>
              ) : cds.length === 0 ? (
                <Alert severity="info">
                  <AlertTitle>No CDs found</AlertTitle>
                  Try adjusting your filters to see more results.
                </Alert>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Showing {cds.length} of {totalItems} CDs
                </Typography>
              )}
            </Box>

            {/* CD Grid */}
            <Grid container spacing={3}>
              {cds.map((cd) => (
                <Grid
                  key={cd.id}
                  size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2.4 }}
                  sx={{ display: "flex" }}
                >
                  <CDCard cd={cd} />
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

export default CDsPage;