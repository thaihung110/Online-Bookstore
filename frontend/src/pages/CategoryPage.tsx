import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Container,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Paper,
  Pagination,
  Breadcrumbs,
  Link,
  Drawer,
  useMediaQuery,
  Button,
  Alert,
  Chip,
  Stack,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import HomeIcon from "@mui/icons-material/Home";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";

import MainLayout from "../components/layouts/MainLayout";
import BookCard from "../components/books/BookCard";
import FilterPanel from "../components/books/FilterPanel";
import { useBookStore } from "../store/bookStore";
import { BookQuery } from "../api/books";

const CategoryPage: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const {
    books,
    totalBooks,
    limit,
    isLoading,
    error,
    filters,
    setFilters,
    resetFilters,
    setPage,
  } = useBookStore();

  const [drawerOpen, setDrawerOpen] = useState(false);

  // Calculate total pages
  const totalPages = Math.ceil(totalBooks / limit);

  // Format category name for display
  const categoryDisplay = category
    ? category
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "";

  useEffect(() => {
    if (category) {
      // Parse URL search params
      const params: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });

      // Convert category URL param to proper format
      const formattedCategory = categoryDisplay;

      // Create filters object with category and any URL params
      const urlFilters: Partial<BookQuery> = {
        genres: [formattedCategory],
        page: params.page ? parseInt(params.page) : 1,
      };

      // Add other filter params
      if (params.minPrice) urlFilters.minPrice = Number(params.minPrice);
      if (params.maxPrice) urlFilters.maxPrice = Number(params.maxPrice);
      if (params.minYear) urlFilters.minYear = Number(params.minYear);
      if (params.maxYear) urlFilters.maxYear = Number(params.maxYear);
      if (params.author) urlFilters.author = params.author;
      if (params.inStock) urlFilters.inStock = params.inStock === "true";
      if (params.onSale) urlFilters.onSale = params.onSale === "true";
      if (params.sortBy) urlFilters.sortBy = params.sortBy;
      if (params.sortOrder)
        urlFilters.sortOrder = params.sortOrder as "asc" | "desc";

      console.log("Setting category filters:", urlFilters);
      setFilters(urlFilters);
    }
  }, [category, searchParams, setFilters, categoryDisplay]);

  // Update URL when filters change
  const updateUrlParams = (newFilters: Partial<BookQuery>) => {
    const updatedFilters = { ...filters, ...newFilters };
    const newParams = new URLSearchParams();

    // Only add parameters with values to URL (except genres which is controlled by route)
    if (updatedFilters.page && updatedFilters.page > 1)
      newParams.set("page", updatedFilters.page.toString());
    if (updatedFilters.minPrice)
      newParams.set("minPrice", updatedFilters.minPrice.toString());
    if (updatedFilters.maxPrice)
      newParams.set("maxPrice", updatedFilters.maxPrice.toString());
    if (updatedFilters.minYear)
      newParams.set("minYear", updatedFilters.minYear.toString());
    if (updatedFilters.maxYear)
      newParams.set("maxYear", updatedFilters.maxYear.toString());
    if (updatedFilters.author) newParams.set("author", updatedFilters.author);
    if (updatedFilters.inStock)
      newParams.set("inStock", updatedFilters.inStock.toString());
    if (updatedFilters.onSale)
      newParams.set("onSale", updatedFilters.onSale.toString());
    if (updatedFilters.sortBy) newParams.set("sortBy", updatedFilters.sortBy);
    if (updatedFilters.sortOrder)
      newParams.set("sortOrder", updatedFilters.sortOrder);

    setSearchParams(newParams);
  };

  // Handle pagination change
  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    newPage: number
  ) => {
    setPage(newPage);
    updateUrlParams({ page: newPage });

    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle filters change
  const handleFilterChange = (newFilters: Partial<BookQuery>) => {
    // Ensure we keep the category filter (don't override genres completely)
    if (category && !newFilters.genres) {
      newFilters.genres = [categoryDisplay];
    } else if (
      category &&
      newFilters.genres &&
      !newFilters.genres.includes(categoryDisplay)
    ) {
      newFilters.genres = [...newFilters.genres, categoryDisplay];
    }

    setFilters(newFilters);
    updateUrlParams(newFilters);
  };

  // Handle reset filters (but keep the category)
  const handleResetFilters = () => {
    const basicFilters = {
      genres: [categoryDisplay],
      page: 1,
      sortBy: "title",
      sortOrder: "asc" as "asc" | "desc",
    };
    setFilters(basicFilters);
    setSearchParams(new URLSearchParams());
    setDrawerOpen(false);
  };

  // Handle apply filters (for mobile)
  const handleApplyFilters = () => {
    setDrawerOpen(false);
  };

  // Create a display of active filters
  const getActiveFilters = () => {
    const activeFilters = [];

    if (filters.author) {
      activeFilters.push({
        label: `Tác giả: ${filters.author}`,
        value: "author",
      });
    }

    if (filters.minPrice || filters.maxPrice) {
      const priceLabel = `Giá: $${filters.minPrice?.toFixed(2) || 0} - $${
        filters.maxPrice?.toFixed(2) || "không giới hạn"
      }`;
      activeFilters.push({
        label: priceLabel,
        value: "price",
      });
    }

    if (filters.minYear || filters.maxYear) {
      const yearLabel = `Năm xuất bản: ${filters.minYear || 1900} - ${
        filters.maxYear || new Date().getFullYear()
      }`;
      activeFilters.push({
        label: yearLabel,
        value: "year",
      });
    }

    if (filters.inStock) {
      activeFilters.push({
        label: "Còn hàng",
        value: "inStock",
      });
    }

    if (filters.onSale) {
      activeFilters.push({
        label: "Đang giảm giá",
        value: "onSale",
      });
    }

    return activeFilters;
  };

  // Handle removing a specific filter
  const handleRemoveFilter = (filterValue: string) => {
    const newFilters: Partial<BookQuery> = { ...filters };

    switch (filterValue) {
      case "author":
        delete newFilters.author;
        break;
      case "price":
        delete newFilters.minPrice;
        delete newFilters.maxPrice;
        break;
      case "year":
        delete newFilters.minYear;
        delete newFilters.maxYear;
        break;
      case "inStock":
        delete newFilters.inStock;
        break;
      case "onSale":
        delete newFilters.onSale;
        break;
    }

    setFilters(newFilters);
    updateUrlParams(newFilters);
  };

  return (
    <MainLayout>
      <Container maxWidth="xl">
        <Box sx={{ pt: 4, pb: 2 }}>
          {/* Breadcrumbs */}
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
            <Link
              underline="hover"
              color="inherit"
              href="/"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
              Trang chủ
            </Link>
            <Link underline="hover" color="inherit" href="/books">
              Sách
            </Link>
            <Typography color="text.primary">{categoryDisplay}</Typography>
          </Breadcrumbs>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h4" gutterBottom>
              Thể loại: {categoryDisplay}
            </Typography>

            {isMobile && (
              <Button
                startIcon={<FilterListIcon />}
                variant="outlined"
                onClick={() => setDrawerOpen(true)}
              >
                Lọc
              </Button>
            )}
          </Box>

          {/* Active filters */}
          {getActiveFilters().length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {getActiveFilters().map((filter) => (
                  <Chip
                    key={filter.value}
                    label={filter.label}
                    onDelete={() => handleRemoveFilter(filter.value)}
                    sx={{ my: 0.5 }}
                  />
                ))}
                <Chip
                  label="Đặt lại bộ lọc"
                  onDelete={handleResetFilters}
                  deleteIcon={<ClearIcon />}
                  color="primary"
                  variant="outlined"
                  sx={{ my: 0.5 }}
                />
              </Stack>
            </Box>
          )}

          {/* Results Count */}
          <Typography variant="subtitle1" sx={{ mb: 3 }}>
            {isLoading
              ? "Đang tải..."
              : `Hiển thị ${books.length} trong số ${totalBooks} kết quả`}
          </Typography>

          <Grid container spacing={3}>
            {/* Filters - Desktop */}
            {!isMobile && (
              <Grid size={{ xs: 12, md: 3, lg: 2.5 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    position: "sticky",
                    top: 24,
                    maxHeight: "85vh",
                    overflow: "hidden",
                    borderRadius: 2,
                  }}
                >
                  <FilterPanel
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onApplyFilters={handleApplyFilters}
                    onResetFilters={handleResetFilters}
                    isMobile={false}
                  />
                </Paper>
              </Grid>
            )}

            {/* Books grid */}
            <Grid
              size={{
                xs: 12,
                md: !isMobile ? 9 : 12,
                lg: !isMobile ? 9.5 : 12,
              }}
            >
              {isLoading ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: 400,
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error} - Vui lòng thử làm mới trang hoặc điều chỉnh bộ lọc.
                </Alert>
              ) : books.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    textAlign: "center",
                    backgroundColor: "rgba(0,0,0,0.02)",
                  }}
                >
                  <Typography variant="h6">
                    Không tìm thấy sách nào phù hợp
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Hãy thử điều chỉnh bộ lọc hoặc xem các thể loại khác
                  </Typography>
                </Paper>
              ) : (
                <>
                  <Grid container spacing={3}>
                    {books.map((book) => (
                      <Grid
                        size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
                        key={book.id}
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
                        page={filters.page || 1}
                        color="primary"
                        onChange={handlePageChange}
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
        </Box>
      </Container>

      {/* Mobile filter drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "85%", sm: "380px" },
            maxWidth: "100%",
          },
        }}
      >
        <Box
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
            isMobile={true}
          />
        </Box>
      </Drawer>
    </MainLayout>
  );
};

export default CategoryPage;
