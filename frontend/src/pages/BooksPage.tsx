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
  Divider,
  Drawer,
  useMediaQuery,
  Button,
  CircularProgress,
  Alert,
  AlertTitle,
  Chip,
  Stack,
  useTheme,
  Fade,
} from "@mui/material";
import { useSearchParams } from "react-router-dom";

import BookCard from "../components/books/BookCard";
import MainLayout from "../components/layouts/MainLayout";
import FilterPanel from "../components/books/FilterPanel";
import { useBookStore } from "../store/bookStore";
import { BookQuery } from "../api/books";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import ClearIcon from "@mui/icons-material/Clear";

const sortOptions = [
  { value: "title:asc", label: "Title (A-Z)" },
  { value: "title:desc", label: "Title (Z-A)" },
  { value: "price:asc", label: "Price: Low to High" },
  { value: "price:desc", label: "Price: High to Low" },
  { value: "rating:desc", label: "Highest Rated" },
];

const BooksPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.down("lg"));
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    books,
    totalBooks,
    currentPage,
    limit,
    isLoading,
    error,
    filters,
    genres,
    fetchBooks,
    setFilters,
    resetFilters,
    setPage,
    loadGenres,
  } = useBookStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [sort, setSort] = useState("title:asc");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Tải danh sách thể loại khi component được render
  useEffect(() => {
    loadGenres();
  }, [loadGenres]);

  // Calculate total pages
  const totalPages = Math.ceil(totalBooks / limit);

  // Effect to fetch books on component mount and sync with URL params
  useEffect(() => {
    // Parse URL search params
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const urlFilters: Partial<BookQuery> = {};

    // Map URL params to filters
    if (params.search) {
      urlFilters.search = params.search;
      setSearchTerm(params.search);
    }
    if (params.author) urlFilters.author = params.author;
    if (params.page) urlFilters.page = Number(params.page);
    if (params.genres) urlFilters.genres = params.genres.split(",");
    if (params.minPrice) urlFilters.minPrice = Number(params.minPrice);
    if (params.maxPrice) urlFilters.maxPrice = Number(params.maxPrice);
    if (params.inStock) urlFilters.inStock = params.inStock === "true";
    if (params.onSale) urlFilters.onSale = params.onSale === "true";
    if (params.sortBy) urlFilters.sortBy = params.sortBy;
    if (params.sortOrder)
      urlFilters.sortOrder = params.sortOrder as "asc" | "desc";

    // If we have URL filters, apply them
    if (Object.keys(urlFilters).length > 0) {
      console.log("Applying URL filters:", urlFilters);
      setFilters(urlFilters);
    } else {
      // Otherwise fetch with default filters
      fetchBooks();
    }
  }, [fetchBooks, searchParams, setFilters]);

  // Update URL when filters change
  const updateUrlParams = (newFilters: Partial<BookQuery>) => {
    const updatedFilters = { ...filters, ...newFilters };
    console.log("BooksPage: Updating URL with filters:", updatedFilters);
    const newParams = new URLSearchParams();

    // Only add parameters with values to URL
    if (updatedFilters.search) newParams.set("search", updatedFilters.search);
    if (updatedFilters.author) newParams.set("author", updatedFilters.author);
    if (updatedFilters.page && updatedFilters.page > 1)
      newParams.set("page", updatedFilters.page.toString());
    if (updatedFilters.genres && updatedFilters.genres.length > 0) {
      console.log(
        "BooksPage: Setting genres URL param:",
        updatedFilters.genres.join(",")
      );
      newParams.set("genres", updatedFilters.genres.join(","));
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

    console.log(
      "BooksPage: Final URL parameters:",
      Object.fromEntries(newParams.entries())
    );
    setSearchParams(newParams);
  };

  // Handle search submit
  const handleSearch = () => {
    const newFilters = { search: searchTerm, page: 1 };
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
      sortBy,
      sortOrder: sortOrder as "asc" | "desc",
      page: 1,
    };

    // Update filters and URL
    setFilters(sortFilters);
    updateUrlParams({ ...filters, ...sortFilters });
  };

  // Handle category filter change
  const handleCategoryChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    const category = event.target.value as string;
    setCategoryFilter(category);

    setFilters({
      genres: category === "All Categories" ? undefined : [category],
      page: 1,
    });
  };

  // Handle filter change from FilterPanel
  const handleFilterChange = (newFilters: Partial<BookQuery>) => {
    console.log("BooksPage: Filter changed:", newFilters);
    console.log("BooksPage: Current filters before update:", filters);

    // Add specific logging for genres filter
    if (newFilters.genres) {
      console.log("BooksPage: Genres filter received:", newFilters.genres);
      console.log(
        "BooksPage: Genres filter type:",
        typeof newFilters.genres,
        Array.isArray(newFilters.genres)
      );
      if (Array.isArray(newFilters.genres)) {
        newFilters.genres.forEach((genre, index) => {
          console.log(`BooksPage: Received genre[${index}] = "${genre}"`);
        });
      }
    }

    setFilters(newFilters);
    console.log("BooksPage: Updated filters in store:", {
      ...filters,
      ...newFilters,
    });

    // Make sure all filters are properly updated in the URL
    // This ensures genres are correctly passed to the backend
    updateUrlParams({ ...filters, ...newFilters });
  };

  // Handle pagination change
  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    // First update store
    setPage(page);
    // Then update URL
    updateUrlParams({ page });
  };

  // Reset all filters
  const handleResetFilters = () => {
    // Reset local state
    setSearchTerm("");
    setCategoryFilter("All Categories");
    setSort("title:asc");

    // Reset store filters
    resetFilters();

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

    if (filters.author) {
      activeFilters.push({
        label: `Author: ${filters.author}`,
        value: "author",
      });
    }

    if (filters.genres && filters.genres.length > 0) {
      filters.genres.forEach((genre) => {
        activeFilters.push({
          label: `Genre: ${genre}`,
          value: `genre:${genre}`,
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
    let newFilters: Partial<BookQuery> = { ...filters };

    if (filterValue === "search") {
      setSearchTerm("");
      newFilters.search = undefined;
    } else if (filterValue === "author") {
      newFilters.author = undefined;
    } else if (filterValue === "minPrice") {
      newFilters.minPrice = undefined;
    } else if (filterValue === "maxPrice") {
      newFilters.maxPrice = undefined;
    } else if (filterValue === "inStock") {
      newFilters.inStock = undefined;
    } else if (filterValue === "onSale") {
      newFilters.onSale = undefined;
    } else if (filterValue.startsWith("genre:")) {
      const genreToRemove = filterValue.split(":")[1];
      if (filters.genres) {
        newFilters.genres = filters.genres.filter(
          (genre) => genre !== genreToRemove
        );
        if (newFilters.genres.length === 0) {
          newFilters.genres = undefined;
        }
      }
    }

    // Apply the updated filters
    setFilters(newFilters);
    // Ensure URL is updated with genre changes
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
            Book Catalog
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Browse our collection of books. Use filters to find exactly what
            you're looking for.
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
            Filter Books
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
          <FilterPanel
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
                <FilterPanel
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
                placeholder="Search books..."
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
                  There was an error loading the books. Please try again.
                </Alert>
              ) : books.length === 0 ? (
                <Alert severity="info">
                  <AlertTitle>No books found</AlertTitle>
                  Try adjusting your filters to see more results.
                </Alert>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Showing {books.length} of {totalBooks} books
                </Typography>
              )}
            </Box>

            {/* Book Grid */}
            <Grid container spacing={3}>
              {books.map((book) => (
                <Grid
                  key={book.id}
                  size={{ xs: 12, sm: 6, md: isTablet ? 6 : 4, lg: 4 }}
                  sx={{ display: "flex" }}
                >
                  <BookCard book={book} />
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

export default BooksPage;
