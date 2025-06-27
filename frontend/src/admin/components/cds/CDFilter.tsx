import React from "react";
import {
  Box,
  TextField,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { Search as SearchIcon } from "@mui/icons-material";
import { CDFilters } from "../../types/cd.types";

interface CDFilterProps {
  filters: CDFilters;
  onFilterChange: (filters: Partial<CDFilters>) => void;
  loading: boolean;
}

const CDFilter: React.FC<CDFilterProps> = ({
  filters,
  onFilterChange,
  loading,
}) => {
  const handleFilterChange = (field: keyof CDFilters) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onFilterChange({ [field]: event.target.value });
  };

  return (
    <Grid container spacing={3} alignItems="center">
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          fullWidth
          placeholder="Search CDs..."
          value={filters.search || ""}
          onChange={handleFilterChange("search")}
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 2 }}>
        <TextField
          fullWidth
          select
          label="Sort By"
          value={filters.sortBy || "title"}
          onChange={handleFilterChange("sortBy")}
          disabled={loading}
        >
          <MenuItem value="title">Title</MenuItem>
          <MenuItem value="artist">Artist</MenuItem>
          <MenuItem value="albumTitle">Album</MenuItem>
          <MenuItem value="price">Price</MenuItem>
          <MenuItem value="stock">Stock</MenuItem>
          <MenuItem value="createdAt">Created Date</MenuItem>
        </TextField>
      </Grid>

      <Grid size={{ xs: 12, md: 2 }}>
        <TextField
          fullWidth
          select
          label="Order"
          value={filters.sortOrder || "asc"}
          onChange={handleFilterChange("sortOrder")}
          disabled={loading}
        >
          <MenuItem value="asc">Ascending</MenuItem>
          <MenuItem value="desc">Descending</MenuItem>
        </TextField>
      </Grid>

      <Grid size={{ xs: 12, md: 2 }}>
        <TextField
          fullWidth
          select
          label="Per Page"
          value={filters.limit || 10}
          onChange={handleFilterChange("limit")}
          disabled={loading}
        >
          <MenuItem value={5}>5</MenuItem>
          <MenuItem value={10}>10</MenuItem>
          <MenuItem value={20}>20</MenuItem>
          <MenuItem value={50}>50</MenuItem>
        </TextField>
      </Grid>
    </Grid>
  );
};

export default CDFilter;