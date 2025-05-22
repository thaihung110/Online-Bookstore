import React from "react";
import {
  TextField,
  InputAdornment,
  IconButton,
  SxProps,
  Theme,
} from "@mui/material";
import { Search as SearchIcon, Close as CloseIcon } from "@mui/icons-material";

interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  fullWidth?: boolean;
  size?: "small" | "medium";
  sx?: SxProps<Theme>;
  disabled?: boolean;
}

/**
 * A reusable search filter component with clear button
 *
 * @param props - Component props
 */
const SearchFilter: React.FC<SearchFilterProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  label = "Search",
  fullWidth = true,
  size = "small",
  sx,
  disabled = false,
}) => {
  // Handle search input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  // Handle clear button click
  const handleClear = () => {
    onChange("");
  };

  return (
    <TextField
      fullWidth={fullWidth}
      label={label}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      size={size}
      sx={sx}
      disabled={disabled}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            {value && (
              <IconButton
                aria-label="clear search"
                onClick={handleClear}
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
    />
  );
};

export default SearchFilter;
