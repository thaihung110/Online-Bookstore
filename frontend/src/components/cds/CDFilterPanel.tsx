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
import AlbumIcon from "@mui/icons-material/Album";
import { CDQuery } from "../../types/product.types";
import { useCDStore } from "../../store/cdStore";
import { debounce } from "lodash";

// Format price as USD
const formatPrice = (value: number) => {
  return `$${value.toFixed(2)}`;
};

// Price marks
const getPriceMarks = () => [
  { value: 0, label: "$0" },
  { value: 25, label: "$25" },
  { value: 50, label: "$50" },
  { value: 75, label: "$75" },
  { value: 100, label: "$100" },
];

interface CDFilterPanelProps {
  filters: CDQuery;
  onFilterChange: (filters: Partial<CDQuery>) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  isMobile: boolean;
}

const CDFilterPanel: React.FC<CDFilterPanelProps> = memo(
  ({ filters, onFilterChange, onApplyFilters, onResetFilters, isMobile }) => {
    const theme = useTheme();
    const { categories, fetchCategories } = useCDStore();

    // Load categories when component mounts
    useEffect(() => {
      fetchCategories();
    }, [fetchCategories]);

    // Local state for filters
    const [priceRange, setPriceRange] = useState<[number, number]>([
      filters.minPrice || 0,
      filters.maxPrice || 100,
    ]);

    const [selectedCategories, setSelectedCategories] = useState<string[]>(
      filters.categories || []
    );

    const [artistFilter, setArtistFilter] = useState<string>(
      filters.artist || ""
    );

    const [albumFilter, setAlbumFilter] = useState<string>(
      filters.albumTitle || ""
    );

    const [inStockOnly, setInStockOnly] = useState<boolean>(
      filters.inStock || false
    );

    const [onSaleOnly, setOnSaleOnly] = useState<boolean>(
      filters.onSale || false
    );

    // Price slider marks
    const priceMarks = getPriceMarks();

    // Update local state when filters change externally
    useEffect(() => {
      setPriceRange([filters.minPrice || 0, filters.maxPrice || 100]);
      setSelectedCategories(filters.categories || []);
      setArtistFilter(filters.artist || "");
      setAlbumFilter(filters.albumTitle || "");
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

    // Handle price min input change
    const handlePriceMinChange = (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const value = parseFloat(event.target.value);
      if (!isNaN(value) && value >= 0 && value <= priceRange[1]) {
        const newRange: [number, number] = [value, priceRange[1]];
        setPriceRange(newRange);
        debouncedPriceChange(newRange);
      }
    };

    // Handle price max input change
    const handlePriceMaxChange = (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const value = parseFloat(event.target.value);
      if (!isNaN(value) && value >= priceRange[0]) {
        const newRange: [number, number] = [priceRange[0], value];
        setPriceRange(newRange);
        debouncedPriceChange(newRange);
      }
    };

    // Handle artist change
    const handleArtistChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setArtistFilter(value);
      onFilterChange({ artist: value || undefined });
    };

    // Handle album title change
    const handleAlbumChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setAlbumFilter(value);
      onFilterChange({ albumTitle: value || undefined });
    };

    // Handle category selection
    const handleCategoryChange = (
      _event: React.SyntheticEvent,
      value: string[]
    ) => {
      const cleanedCategories = value
        .map((category) => category.trim())
        .filter((category) => category.length > 0);

      setSelectedCategories(cleanedCategories);

      const filterUpdate = {
        categories: cleanedCategories.length > 0 ? cleanedCategories : undefined,
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
          <AlbumIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          Filter CDs
        </Typography>

        {/* Artist filter */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            gutterBottom
            sx={{ display: "flex", alignItems: "center" }}
          >
            <PersonIcon fontSize="small" sx={{ mr: 1 }} />
            Artist
          </Typography>
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            placeholder="Search by artist"
            value={artistFilter}
            onChange={handleArtistChange}
          />
        </Box>

        {/* Album title filter */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            gutterBottom
            sx={{ display: "flex", alignItems: "center" }}
          >
            <AlbumIcon fontSize="small" sx={{ mr: 1 }} />
            Album Title
          </Typography>
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            placeholder="Search by album title"
            value={albumFilter}
            onChange={handleAlbumChange}
          />
        </Box>

        {/* Category filter */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            gutterBottom
            sx={{ display: "flex", alignItems: "center" }}
          >
            <CategoryIcon fontSize="small" sx={{ mr: 1 }} />
            Music Categories
          </Typography>
          <Autocomplete
            multiple
            options={categories.length > 0 ? categories : ["Loading categories..."]}
            loading={categories.length === 0}
            value={selectedCategories}
            onChange={handleCategoryChange}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                size="small"
                placeholder={
                  categories.length > 0 ? "Select categories" : "Loading categories..."
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
              max={100}
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
              <TextField
                label="Min"
                value={priceRange[0]}
                onChange={handlePriceMinChange}
                type="number"
                size="small"
                InputProps={{
                  startAdornment: (
                    <Typography variant="body2" sx={{ mr: 0.5 }}>
                      $
                    </Typography>
                  ),
                }}
                sx={{ width: "45%" }}
              />
              <TextField
                label="Max"
                value={priceRange[1]}
                onChange={handlePriceMaxChange}
                type="number"
                size="small"
                InputProps={{
                  startAdornment: (
                    <Typography variant="body2" sx={{ mr: 0.5 }}>
                      $
                    </Typography>
                  ),
                }}
                sx={{ width: "45%" }}
              />
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

CDFilterPanel.displayName = "CDFilterPanel";

export default CDFilterPanel;