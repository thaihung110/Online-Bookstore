import React from "react";
import {
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Switch,
} from "@mui/material";
import { UserFilters, UserRole, ROLE_DISPLAY } from "../../types/user.types";
import FilterContainer from "../common/FilterContainer";
import SearchFilter from "../common/SearchFilter";

interface UserFilterProps {
  filters: UserFilters;
  onFilterChange: (newFilters: Partial<UserFilters>) => void;
  onResetFilters: () => void;
}

const UserFilter: React.FC<UserFilterProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
}) => {
  // Handle search input
  const handleSearchChange = (search: string) => {
    onFilterChange({
      search,
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

  // Handle role change
  const handleRoleChange = (e: SelectChangeEvent<string>) => {
    const { value } = e.target;
    onFilterChange({
      role: value as UserRole,
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

  // Main filters (always visible)
  const mainFilters = (
    <>
      <Grid size={{ xs: 12, md: 8 }}>
        <SearchFilter
          value={filters.search || ""}
          onChange={handleSearchChange}
          placeholder="Search by name, email, or role"
          label="Search Users"
        />
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="sort-by-label">Sort By</InputLabel>
          <Select
            labelId="sort-by-label"
            id="sortBy"
            name="sortBy"
            value={filters.sortBy || "name"}
            label="Sort By"
            onChange={handleSelectChange}
          >
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="email">Email</MenuItem>
            <MenuItem value="role">Role</MenuItem>
            <MenuItem value="createdAt">Join Date</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </>
  );

  // Advanced filters (collapsed by default)
  const advancedFilters = (
    <>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="role-label">Role</InputLabel>
          <Select
            labelId="role-label"
            id="role"
            name="role"
            value={filters.role || ""}
            onChange={handleRoleChange}
            label="Role"
          >
            <MenuItem value="">All Roles</MenuItem>
            {Object.values(UserRole).map((role) => (
              <MenuItem key={role} value={role}>
                {ROLE_DISPLAY[role]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <FormControlLabel
          control={
            <Switch
              checked={!!filters.isActive}
              onChange={handleSwitchChange}
              name="isActive"
            />
          }
          label="Active Users Only"
        />
      </Grid>
    </>
  );

  return (
    <FilterContainer
      title="User Filters"
      onReset={onResetFilters}
      advancedFilters={advancedFilters}
    >
      {mainFilters}
    </FilterContainer>
  );
};

export default UserFilter;
