import React, { useState, useEffect, useCallback, memo } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Divider,
  IconButton,
  TextField,
  Autocomplete,
  Chip,
  Switch,
  FormControlLabel,
  Button,
  Stack,
  Paper,
  Tooltip,
  useTheme,
  Fade,
  useMediaQuery,
  Checkbox,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import SortIcon from "@mui/icons-material/Sort";
import PersonIcon from "@mui/icons-material/Person";
import CategoryIcon from "@mui/icons-material/Category";
import SearchIcon from "@mui/icons-material/Search";
import { BookQuery } from "../../api/books";
import { useBookStore } from "../../store/bookStore";
import { debounce } from "lodash";

// Sort options
const sortOptions = [
  { value: "title:asc", label: "Title (A-Z)" },
  { value: "title:desc", label: "Title (Z-A)" },
  { value: "price:asc", label: "Price (Low to High)" },
  { value: "price:desc", label: "Price (High to Low)" },
  { value: "publicationYear:desc", label: "Newest" },
  { value: "publicationYear:asc", label: "Oldest" },
  { value: "averageRating:desc", label: "Highest Rated" },
  { value: "createdAt:desc", label: "Recently Added" },
];

// Format price as USD
const formatPrice = (value: number) => {
  return `$${value.toFixed(2)}`;
};

// Function to determine mark count based on range and step
const getMarks = (min: number, max: number, count: number = 5) => {
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, index) => {
    const value = min + step * index;
    return { value, label: "" };
  });
};

// Price marks with more detail
const getPriceMarks = () => [
  { value: 0, label: "$0" },
  { value: 50, label: "$50" },
  { value: 100, label: "$100" },
  { value: 150, label: "$150" },
  { value: 200, label: "$200" },
];

interface FilterPanelProps {
  filters: BookQuery;
  onFilterChange: (filters: Partial<BookQuery>) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  isMobile: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = memo(
  ({ filters, onFilterChange, onApplyFilters, onResetFilters, isMobile }) => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
    const { genres, loadGenres } = useBookStore();

    // Load genres khi component được render
    useEffect(() => {
      loadGenres();
    }, [loadGenres]);

    // Local state for filters
    const [priceRange, setPriceRange] = useState<[number, number]>([
      filters.minPrice || 0,
      filters.maxPrice || 200,
    ]);
    const [isDraggingPrice, setIsDraggingPrice] = useState<boolean>(false);

    const [selectedGenres, setSelectedGenres] = useState<string[]>(
      filters.genres || []
    );

    const [authorFilter, setAuthorFilter] = useState<string>(
      filters.author || ""
    );

    const [sortOption, setSortOption] = useState<string>(
      `${filters.sortBy || "createdAt"}:${filters.sortOrder || "desc"}`
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
      setPriceRange([filters.minPrice || 0, filters.maxPrice || 200]);
      setSelectedGenres(filters.genres || []);
      setAuthorFilter(filters.author || "");
      setSortOption(
        `${filters.sortBy || "createdAt"}:${filters.sortOrder || "desc"}`
      );
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

    const debouncedSearchChange = useCallback(
      debounce((value: string) => {
        onFilterChange({ search: value });
      }, 300),
      [onFilterChange]
    );

    // Handle price range change
    const handlePriceChange = (
      _event: Event,
      newValue: number | number[],
      activeThumb: number
    ) => {
      if (!Array.isArray(newValue)) {
        return;
      }

      setIsDraggingPrice(true);

      // If the user is dragging both thumbs simultaneously, update both values
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

    // Handle author change
    const handleAuthorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setAuthorFilter(value);
      onFilterChange({ author: value || undefined });
    };

    // Handle genre selection
    const handleGenreChange = (
      _event: React.SyntheticEvent,
      value: string[]
    ) => {
      console.log("FilterPanel: Selected genres:", value);

      // Validate và clean up genres trước khi update
      const cleanedGenres = value
        .map((genre) => genre.trim())
        .filter((genre) => genre.length > 0);

      console.log("FilterPanel: Cleaned genres:", cleanedGenres);

      setSelectedGenres(cleanedGenres);

      // Log the exact query being sent
      const filterUpdate = {
        genres: cleanedGenres.length > 0 ? cleanedGenres : undefined,
        page: 1,
      };
      console.log("FilterPanel: Updating filters with:", filterUpdate);

      onFilterChange(filterUpdate);
    };

    // Thêm useEffect để theo dõi khi genres thay đổi
    useEffect(() => {
      console.log("FilterPanel: Genres updated:", genres);
    }, [genres]);

    // Handle sort option change
    const handleSortChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSortOption(value);
      const [sortBy, sortOrder] = value.split(":");
      onFilterChange({ sortBy, sortOrder: sortOrder as "asc" | "desc" });
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
            maxHeight: "800px", // Fixed maximum height
          }),
    };

    return (
      <Box sx={containerStyles}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Filter Books
        </Typography>

        {/* Author filter */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            gutterBottom
            sx={{ display: "flex", alignItems: "center" }}
          >
            <PersonIcon fontSize="small" sx={{ mr: 1 }} />
            Author
          </Typography>
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            placeholder="Search by author"
            value={authorFilter}
            onChange={handleAuthorChange}
          />
        </Box>

        {/* Genre filter */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            gutterBottom
            sx={{ display: "flex", alignItems: "center" }}
          >
            <CategoryIcon fontSize="small" sx={{ mr: 1 }} />
            Genres
          </Typography>
          <Autocomplete
            multiple
            options={genres.length > 0 ? genres : ["Loading genres..."]}
            loading={genres.length === 0}
            value={selectedGenres}
            onChange={handleGenreChange}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                size="small"
                placeholder={
                  genres.length > 0 ? "Select genres" : "Loading genres..."
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
              max={200}
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

FilterPanel.displayName = "FilterPanel";

export default FilterPanel;
