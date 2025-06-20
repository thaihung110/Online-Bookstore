import React, { useState } from "react";
import {
  Box,
  Button,
  Collapse,
  Grid,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

interface FilterContainerProps {
  title?: string;
  children: React.ReactNode;
  advancedFilters?: React.ReactNode;
  onReset: () => void;
  showAdvancedFilters?: boolean;
  fullWidth?: boolean;
}

/**
 * A reusable container for filter components
 *
 * @param props - Component props
 */
const FilterContainer: React.FC<FilterContainerProps> = ({
  title = "Filters",
  children,
  advancedFilters,
  onReset,
  showAdvancedFilters: initialShowAdvancedFilters = false,
  fullWidth = true,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(
    initialShowAdvancedFilters
  );

  // Toggle advanced filters visibility
  const toggleAdvancedFilters = () => {
    setShowAdvancedFilters(!showAdvancedFilters);
  };

  return (
    <Paper
      elevation={3}
      sx={{ p: 3, mb: 3, width: fullWidth ? "100%" : "auto" }}
    >
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
              {title}
            </Typography>
            <Box>
              {advancedFilters && (
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
              )}
              <Tooltip title="Reset Filters">
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<RefreshIcon />}
                  onClick={onReset}
                  size="small"
                >
                  Reset
                </Button>
              </Tooltip>
            </Box>
          </Box>
        </Grid>

        {children}

        {advancedFilters && (
          <Collapse in={showAdvancedFilters} sx={{ width: "100%" }}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {advancedFilters}
            </Grid>
          </Collapse>
        )}
      </Grid>
    </Paper>
  );
};

export default FilterContainer;
