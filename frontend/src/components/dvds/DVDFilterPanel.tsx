import React, { useState, useEffect, useCallback, memo } from "react";
import {
  Box,
  Typography,
  Slider,
  TextField,
  Autocomplete,
  Chip,
  Button,
  Stack,
  Checkbox,
  FormControlLabel,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import PersonIcon from "@mui/icons-material/Person";
import CategoryIcon from "@mui/icons-material/Category";
import SearchIcon from "@mui/icons-material/Search";
import MovieIcon from "@mui/icons-material/Movie";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BusinessIcon from "@mui/icons-material/Business";
import { DVDQuery } from "../../types/product.types";
import { useDVDStore } from "../../store/dvdStore";
import { debounce } from "lodash";

// Format price as USD
const formatPrice = (value: number) => {
  return `$${value.toFixed(2)}`;
};

// Format runtime
const formatRuntime = (value: number) => {
  const hours = Math.floor(value / 60);
  const mins = value % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

// Price marks for DVDs (typically higher than CDs)
const getPriceMarks = () => [
  { value: 0, label: "$0" },
  { value: 30, label: "$30" },
  { value: 60, label: "$60" },
  { value: 90, label: "$90" },
  { value: 120, label: "$120" },
];

// Runtime marks (in minutes)
const getRuntimeMarks = () => [
  { value: 60, label: "1h" },
  { value: 120, label: "2h" },
  { value: 180, label: "3h" },
  { value: 240, label: "4h" },
];

interface DVDFilterPanelProps {
  filters: DVDQuery;
  onFilterChange: (filters: Partial<DVDQuery>) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  isMobile: boolean;
}

const DVDFilterPanel: React.FC<DVDFilterPanelProps> = memo(
  ({ filters, onFilterChange, onApplyFilters, onResetFilters, isMobile }) => {
    const theme = useTheme();
    const { filmTypes, discTypes, fetchFilmTypes, fetchDiscTypes } = useDVDStore();

    // Load types when component mounts
    useEffect(() => {
      fetchFilmTypes();
      fetchDiscTypes();
    }, [fetchFilmTypes, fetchDiscTypes]);

    // Local state for filters
    const [priceRange, setPriceRange] = useState<[number, number]>([
      filters.minPrice || 0,
      filters.maxPrice || 120,
    ]);

    const [runtimeRange, setRuntimeRange] = useState<[number, number]>([
      filters.minRuntime || 60,
      filters.maxRuntime || 240,
    ]);

    const [selectedFilmTypes, setSelectedFilmTypes] = useState<string[]>(
      filters.filmTypes || []
    );

    const [selectedDiscTypes, setSelectedDiscTypes] = useState<string[]>(
      filters.discTypes || []
    );

    const [directorFilter, setDirectorFilter] = useState<string>(
      filters.director || ""
    );

    const [studioFilter, setStudioFilter] = useState<string>(
      filters.studio || ""
    );

    const [inStockOnly, setInStockOnly] = useState<boolean>(
      filters.inStock || false
    );

    const [onSaleOnly, setOnSaleOnly] = useState<boolean>(
      filters.onSale || false
    );

    // Marks
    const priceMarks = getPriceMarks();
    const runtimeMarks = getRuntimeMarks();

    // Update local state when filters change externally
    useEffect(() => {
      setPriceRange([filters.minPrice || 0, filters.maxPrice || 120]);
      setRuntimeRange([filters.minRuntime || 60, filters.maxRuntime || 240]);
      setSelectedFilmTypes(filters.filmTypes || []);
      setSelectedDiscTypes(filters.discTypes || []);
      setDirectorFilter(filters.director || "");
      setStudioFilter(filters.studio || "");
      setInStockOnly(filters.inStock || false);
      setOnSaleOnly(filters.onSale || false);
    }, [filters]);

    // Debounced filter handlers
    const debouncedPriceChange = useCallback(
      debounce((newRange: [number, number]) => {
        onFilterChange({
          minPrice: newRange[0],
          maxPrice: newRange[1],
        });
      }, 500),
      [onFilterChange]
    );

    const debouncedRuntimeChange = useCallback(
      debounce((newRange: [number, number]) => {
        onFilterChange({
          minRuntime: newRange[0],
          maxRuntime: newRange[1],
        });
      }, 500),
      [onFilterChange]
    );

    // Handle price range change
    const handlePriceChange = (
      _event: Event,
      newValue: number | number[]
    ) => {
      if (!Array.isArray(newValue)) {
        return;
      }

      const newRange = newValue as [number, number];
      setPriceRange(newRange);
      debouncedPriceChange(newRange);
    };

    // Handle runtime range change
    const handleRuntimeChange = (
      _event: Event,
      newValue: number | number[]
    ) => {
      if (!Array.isArray(newValue)) {
        return;
      }

      const newRange = newValue as [number, number];
      setRuntimeRange(newRange);
      debouncedRuntimeChange(newRange);
    };

    // Handle director change
    const handleDirectorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setDirectorFilter(value);
      onFilterChange({ director: value || undefined });
    };

    // Handle studio change
    const handleStudioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setStudioFilter(value);
      onFilterChange({ studio: value || undefined });
    };

    // Handle film type selection
    const handleFilmTypeChange = (
      _event: React.SyntheticEvent,
      value: string[]
    ) => {
      const cleanedTypes = value
        .map((type) => type.trim())
        .filter((type) => type.length > 0);

      setSelectedFilmTypes(cleanedTypes);

      const filterUpdate = {
        filmTypes: cleanedTypes.length > 0 ? cleanedTypes : undefined,
        page: 1,
      };

      onFilterChange(filterUpdate);
    };

    // Handle disc type selection
    const handleDiscTypeChange = (
      _event: React.SyntheticEvent,
      value: string[]
    ) => {
      const cleanedTypes = value
        .map((type) => type.trim())
        .filter((type) => type.length > 0);

      setSelectedDiscTypes(cleanedTypes);

      const filterUpdate = {
        discTypes: cleanedTypes.length > 0 ? cleanedTypes : undefined,
        page: 1,
      };

      onFilterChange(filterUpdate);
    };

    // Handle in stock toggle
    const handleInStockChange = (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const checked = event.target.checked;
      setInStockOnly(checked);
      onFilterChange({ inStock: checked || undefined });
    };

    // Handle on sale toggle
    const handleOnSaleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const checked = event.target.checked;
      setOnSaleOnly(checked);
      onFilterChange({ onSale: checked || undefined });
    };

    // Handle search button click
    const handleSearchClick = () => {
      onApplyFilters();
    };

    const containerStyles = {
      width: "100%",
      height: "calc(100vh - 200px)",
      overflowY: "auto",
      ...(isMobile
        ? { padding: theme.spacing(2) }
        : {
            padding: theme.spacing(3),
            maxHeight: "800px",
          }),
    };

    return (
      <Box sx={containerStyles}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          <MovieIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          Filter DVDs
        </Typography>

        {/* Director filter */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            gutterBottom
            sx={{ display: "flex", alignItems: "center" }}
          >
            <PersonIcon fontSize="small" sx={{ mr: 1 }} />
            Director
          </Typography>
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            placeholder="Search by director"
            value={directorFilter}
            onChange={handleDirectorChange}
          />
        </Box>

        {/* Studio filter */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            gutterBottom
            sx={{ display: "flex", alignItems: "center" }}
          >
            <BusinessIcon fontSize="small" sx={{ mr: 1 }} />
            Studio
          </Typography>
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            placeholder="Search by studio"
            value={studioFilter}
            onChange={handleStudioChange}
          />
        </Box>

        {/* Film type filter */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            gutterBottom
            sx={{ display: "flex", alignItems: "center" }}
          >
            <CategoryIcon fontSize="small" sx={{ mr: 1 }} />
            Film Types
          </Typography>
          <Autocomplete
            multiple
            options={filmTypes.length > 0 ? filmTypes : ["Loading film types..."]}
            loading={filmTypes.length === 0}
            value={selectedFilmTypes}
            onChange={handleFilmTypeChange}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                size="small"
                placeholder={
                  filmTypes.length > 0 ? "Select film types" : "Loading film types..."
                }
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option}
                  label={option}
                  size="small"
                />
              ))
            }
          />
        </Box>

        {/* Disc type filter */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            gutterBottom
            sx={{ display: "flex", alignItems: "center" }}
          >
            <MovieIcon fontSize="small" sx={{ mr: 1 }} />
            Disc Types
          </Typography>
          <Autocomplete
            multiple
            options={discTypes.length > 0 ? discTypes : ["Loading disc types..."]}
            loading={discTypes.length === 0}
            value={selectedDiscTypes}
            onChange={handleDiscTypeChange}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                size="small"
                placeholder={
                  discTypes.length > 0 ? "Select disc types" : "Loading disc types..."
                }
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option}
                  label={option}
                  size="small"
                  color="secondary"
                />
              ))
            }
          />
        </Box>

        {/* Runtime filter */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            gutterBottom
            sx={{ display: "flex", alignItems: "center" }}
          >
            <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
            Runtime
          </Typography>

          <Box sx={{ px: 1 }}>
            <Slider
              value={runtimeRange}
              onChange={handleRuntimeChange}
              valueLabelDisplay="auto"
              valueLabelFormat={formatRuntime}
              min={60}
              max={240}
              step={5}
              marks={runtimeMarks}
              sx={{ mt: 3, mb: 1 }}
            />

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mt: 2,
                px: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {formatRuntime(runtimeRange[0])}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatRuntime(runtimeRange[1])}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Price range filter */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            gutterBottom
            sx={{ display: "flex", alignItems: "center" }}
          >
            <AttachMoneyIcon fontSize="small" sx={{ mr: 1 }} />
            Price Range
          </Typography>

          <Box sx={{ px: 1 }}>
            <Slider
              value={priceRange}
              onChange={handlePriceChange}
              valueLabelDisplay="auto"
              valueLabelFormat={formatPrice}
              min={0}
              max={120}
              step={1}
              marks={priceMarks}
              sx={{ mt: 3, mb: 1 }}
            />

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mt: 2,
                px: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                ${priceRange[0]}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ${priceRange[1]}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Stock and Sale filters */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            gutterBottom
            sx={{ display: "flex", alignItems: "center" }}
          >
            <LocalOfferIcon fontSize="small" sx={{ mr: 1 }} />
            Availability & Offers
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.inStock}
                onChange={handleInStockChange}
                size="small"
              />
            }
            label="In Stock Only"
            sx={{ width: "100%", mb: 1 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.onSale}
                onChange={handleOnSaleChange}
                size="small"
              />
            }
            label="On Sale Only"
            sx={{ width: "100%" }}
          />
        </Box>

        {/* Action buttons */}
        <Stack spacing={2} direction="row" sx={{ mt: 4 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={onResetFilters}
            fullWidth
          >
            Reset
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSearchClick}
            fullWidth
            startIcon={<SearchIcon />}
          >
            Search
          </Button>
        </Stack>
      </Box>
    );
  }
);

DVDFilterPanel.displayName = "DVDFilterPanel";

export default DVDFilterPanel;