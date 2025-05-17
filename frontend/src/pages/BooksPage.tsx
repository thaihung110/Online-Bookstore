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
  Slider,
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
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";

import BookCard from "../components/books/BookCard";
import MainLayout from "../components/layouts/MainLayout";
import { useBookStore } from "../store/bookStore";
import { BookQuery } from "../api/books";

const sortOptions = [
  { value: "title:asc", label: "Title (A-Z)" },
  { value: "title:desc", label: "Title (Z-A)" },
  { value: "price:asc", label: "Price: Low to High" },
  { value: "price:desc", label: "Price: High to Low" },
  { value: "rating:desc", label: "Highest Rated" },
];

const categories = [
  "All Categories",
  "Fiction",
  "Non-Fiction",
  "Science Fiction",
  "Fantasy",
  "Mystery",
  "Romance",
  "Thriller",
  "Biography",
  "History",
  "Business",
  "Self-Help",
  "Children",
];

const BooksPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const {
    books,
    totalBooks,
    currentPage,
    limit,
    isLoading,
    error,
    filters,
    fetchBooks,
    setFilters,
    resetFilters,
    setPage,
  } = useBookStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [sort, setSort] = useState("title:asc");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Calculate total pages
  const totalPages = Math.ceil(totalBooks / limit);

  // Effect to fetch books on component mount
  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Handle search submit
  const handleSearch = () => {
    setFilters({ searchTerm, page: 1 });
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
    setFilters({
      sortBy,
      sortOrder: sortOrder as "asc" | "desc",
      page: 1,
    });
  };

  // Handle category filter change
  const handleCategoryChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    const category = event.target.value as string;
    setCategoryFilter(category);

    setFilters({
      category: category === "All Categories" ? undefined : category,
      page: 1,
    });
  };

  // Handle price range change
  const handlePriceChange = (_event: Event, newValue: number | number[]) => {
    setPriceRange(newValue as [number, number]);
  };

  // Apply price filter when slider interaction ends
  const handlePriceChangeCommitted = () => {
    setFilters({
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      page: 1,
    });
  };

  // Handle pagination change
  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    setPage(page);

    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setPriceRange([0, 100]);
    setCategoryFilter("All Categories");
    setSort("title:asc");
    resetFilters();
    setDrawerOpen(false);
  };

  // Handle apply filters (for mobile)
  const handleApplyFilters = () => {
    const [sortBy, sortOrder] = sort.split(":");

    const newFilters: BookQuery = {
      searchTerm,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      category:
        categoryFilter === "All Categories" ? undefined : categoryFilter,
      sortBy,
      sortOrder: sortOrder as "asc" | "desc",
      page: 1,
    };

    setFilters(newFilters);
    setDrawerOpen(false);
  };

  // Filter panel component
  const filterPanel = (
    <Box sx={{ p: 3, width: isMobile ? "auto" : 250 }}>
      {isMobile && (
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6">Filters</Typography>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
      )}

      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Categories
      </Typography>
      <FormControl fullWidth margin="normal" size="small">
        <InputLabel id="category-select-label">Category</InputLabel>
        <Select
          labelId="category-select-label"
          id="category-select"
          value={categoryFilter}
          label="Category"
          onChange={handleCategoryChange as any}
        >
          {categories.map((category) => (
            <MenuItem key={category} value={category}>
              {category}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>
        Price Range
      </Typography>
      <Box sx={{ px: 1 }}>
        <Slider
          value={priceRange}
          onChange={handlePriceChange}
          onChangeCommitted={handlePriceChangeCommitted}
          valueLabelDisplay="auto"
          min={0}
          max={100}
          disableSwap
        />
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
          <Typography variant="body2">${priceRange[0]}</Typography>
          <Typography variant="body2">${priceRange[1]}</Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Sort By
      </Typography>
      <FormControl fullWidth margin="normal" size="small">
        <InputLabel id="sort-select-label">Sort By</InputLabel>
        <Select
          labelId="sort-select-label"
          id="sort-select"
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

      {isMobile && (
        <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
          <Button variant="outlined" onClick={handleResetFilters} fullWidth>
            Reset
          </Button>
          <Button variant="contained" onClick={handleApplyFilters} fullWidth>
            Apply
          </Button>
        </Box>
      )}

      {!isMobile && (
        <Button
          variant="outlined"
          onClick={handleResetFilters}
          sx={{ mt: 3 }}
          fullWidth
        >
          Reset Filters
        </Button>
      )}
    </Box>
  );

  return (
    <MainLayout>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
        {/* Header and search */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Book Catalog
          </Typography>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <TextField
              label="Search books"
              variant="outlined"
              size="small"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton edge="end" onClick={handleSearch}>
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {isMobile && (
              <Button
                startIcon={<FilterListIcon />}
                variant="outlined"
                onClick={() => setDrawerOpen(true)}
              >
                Filters
              </Button>
            )}
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Filters - Desktop */}
          {!isMobile && (
            <Grid size={{ xs: 12, md: 3, lg: 2 }}>
              <Paper variant="outlined" sx={{ position: "sticky", top: 24 }}>
                {filterPanel}
              </Paper>
            </Grid>
          )}

          {/* Books grid */}
          <Grid
            size={{ xs: 12, md: !isMobile ? 9 : 12, lg: !isMobile ? 10 : 12 }}
          >
            {isLoading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: "40vh",
                }}
              >
                <CircularProgress size={60} />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mt: 2 }}>
                <AlertTitle>Error</AlertTitle>
                {error} - Please try refreshing the page or adjusting your
                filters.
              </Alert>
            ) : books.length === 0 ? (
              <Box sx={{ textAlign: "center", mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  No Books Found
                </Typography>
                <Typography color="text.secondary" paragraph>
                  We couldn't find any books matching your current filters. Try
                  adjusting your search or filters.
                </Typography>
                <Button variant="outlined" onClick={handleResetFilters}>
                  Reset All Filters
                </Button>
              </Box>
            ) : (
              <>
                <Box
                  sx={{
                    mb: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" color="textSecondary">
                    Showing {books.length} of {totalBooks} books
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  {books.map((book) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={book.id}>
                      <BookCard book={book} />
                    </Grid>
                  ))}
                </Grid>

                {totalPages > 1 && (
                  <Box
                    sx={{ mt: 4, display: "flex", justifyContent: "center" }}
                  >
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={handlePageChange}
                      color="primary"
                      size={isMobile ? "small" : "medium"}
                      showFirstButton
                      showLastButton
                    />
                  </Box>
                )}
              </>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* Mobile filter drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {filterPanel}
      </Drawer>
    </MainLayout>
  );
};

export default BooksPage;
