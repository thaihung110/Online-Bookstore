
import React, { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Collapse,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { CDFilters } from "../../types/cd.types";

// Available cd genres - same as in CDFormPage
const AVAILABLE_GENRES = [
  "Fiction",
  "Non-fiction",
  "Mystery",
  "Thriller",
  "Science Fiction",
  "Fantasy",
  "Romance",
  "Biography",
  "History",
  "Self-help",
  "Business",
  "Cooking",
  "Travel",
  "Science",
  "Technology",
  "Philosophy",
  "Poetry",
  "Drama",
  "Children",
  "Young Adult",
  "Dystopian",
  "Classic",
  "Horror",
  "Adventure",
  "Comics",
  "Art",
  "Religion",
  "Sports",
  "Music",
  "Educational",
];

// Default filters
const DEFAULT_FILTERS: CDFilters = {
  page: 1,
  limit: 10,
  search: "",
  sortBy: "title",
  sortOrder: "asc",
};

interface CDFilterProps {
  filters: CDFilters;
  onFilterChange: (newFilters: Partial<CDFilters>) => void;
  onResetFilters: () => void;

}

const CDFilter: React.FC<CDFilterProps> = ({
  filters,
  onFilterChange,

  onResetFilters,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      search: e.target.value,
      page: 1, // Reset to first page on search
    });
  };

  // Handle select changes
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    onFilterChange({
      [name]: value,
      page: 1, // Reset to first page on filter change
    });
  };

  // Handle multi-select changes (artists)
//   const handleArtistChange = (e: SelectChangeEvent<string[]>) => {
//     const { value } = e.target;
//     onFilterChange({
//       artist: typeof value === "string" ? [value] : value,
//       page: 1, // Reset to first page on filter change
//     });
//   };

  // Handle number input changes
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numberValue = value === "" ? undefined : parseFloat(value);

    onFilterChange({
      [name]: numberValue,
      page: 1, // Reset to first page on filter change
    });
  };

  // Handle switch changes
  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    onFilterChange({
      [name]: checked,
      page: 1, // Reset to first page on filter change
    });
  };

  // Toggle advanced filters
  const toggleAdvancedFilters = () => {
    setShowAdvancedFilters(!showAdvancedFilters);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Grid container spacing={2}>
        <Grid size={12}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6" component="h2">
              Filters
            </Typography>
            <Box>
              <Tooltip title="Toggle Advanced Filters">
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={toggleAdvancedFilters}
                  sx={{ mr: 1 }}
                  size="small"
                >
                  {showAdvancedFilters ? "Hide Filters" : "Show Filters"}
                </Button>
              </Tooltip>
              <Tooltip title="Reset Filters">
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<RefreshIcon />}
                  onClick={onResetFilters}
                  size="small"
                >
                  Reset
                </Button>
              </Tooltip>
            </Box>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <TextField
            fullWidth
            label="Search CDs"
            name="search"
            value={filters.search || ""}
            onChange={handleSearchChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {filters.search && (
                    <IconButton
                      aria-label="clear search"
                      onClick={() => onFilterChange({ search: "", page: 1 })}
                      edge="end"
                      size="small"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            placeholder="Search by title, author, or description"
            size="small"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="sort-by-label">Sort By</InputLabel>
            <Select
              labelId="sort-by-label"
              id="sortBy"
              name="sortBy"
              value={filters.sortBy || "title"}
              label="Sort By"
              onChange={handleSelectChange}
            >
              <MenuItem value="title">Title</MenuItem>
              <MenuItem value="author">Author</MenuItem>
              <MenuItem value="price">Price</MenuItem>
              <MenuItem value="stockQuantity">Stock</MenuItem>
              <MenuItem value="publicationDate">Publication Date</MenuItem>
              <MenuItem value="rating">Rating</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Collapse in={showAdvancedFilters} sx={{ width: "100%" }}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6, lg: 3 }}>
              <TextField
                fullWidth
                label="Min Price"
                name="minPrice"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={filters.minPrice || ""}
                onChange={handleNumberChange}
                size="small"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6, lg: 3 }}>
              <TextField
                fullWidth
                label="Max Price"
                name="maxPrice"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={filters.maxPrice || ""}
                onChange={handleNumberChange}
                size="small"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6, lg: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!filters.inStock}
                    onChange={handleSwitchChange}
                    name="inStock"
                  />
                }
                label="In Stock Only"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6, lg: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!filters.onSale}
                    onChange={handleSwitchChange}
                    name="onSale"
                  />
                }
                label="On Sale Only"
              />
            </Grid>
{/* 
            <Grid size={12}>
              <FormControl fullWidth size="small">
                <InputLabel id="genres-label">Genres</InputLabel>
                <Select
                  labelId="genres-label"
                  id="genres"
                  name="genres"
                  multiple
                  value={filters.genres || []}
                  onChange={handleGenresChange}
                  label="Genres"
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {AVAILABLE_GENRES.map((genre) => (
                    <MenuItem key={genre} value={genre}>
                      {genre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid> */}
          </Grid>
        </Collapse>
      </Grid>
    </Paper>
  );
};

export default CDFilter;

