import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Tooltip,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  Avatar,
  SelectChangeEvent,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { getUsers, deleteUser } from "../api/userApi";
import { User, UserFilters, UserRole, ROLE_DISPLAY } from "../types/user.types";

const UserManagementPage: React.FC = () => {
  const navigate = useNavigate();

  // State for users and pagination
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for filters
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 10,
    search: "",
    sortBy: "name",
    sortOrder: "asc",
  });

  // State for advanced filters visibility
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load users on component mount and when filters change
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getUsers(filters);
      setUsers(response.users);
      setTotalUsers(response.total);
    } catch (err) {
      console.error("Failed to load users:", err);
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Handle search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      search: e.target.value,
      page: 1, // Reset to first page on new search
    });
  };

  // Handle filter changes
  const handleFilterChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;

    setFilters({
      ...filters,
      [name]: value,
      page: 1, // Reset to first page on filter change
    });
  };

  // Handle checkbox filter changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;

    setFilters({
      ...filters,
      [name]: checked,
      page: 1, // Reset to first page on filter change
    });
  };

  // Handle pagination
  const handleChangePage = (_event: unknown, newPage: number) => {
    setFilters({
      ...filters,
      page: newPage + 1, // MaterialUI pagination is 0-based
    });
  };

  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      limit: parseInt(e.target.value, 10),
      page: 1, // Reset to first page when changing rows per page
    });
  };

  // Handle add user
  const handleAddUser = () => {
    navigate("/admin/users/add");
  };

  // Handle edit user
  const handleEditUser = (id: string) => {
    navigate(`/admin/users/edit/${id}`);
  };

  // Handle delete user
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setDeleteLoading(true);

    try {
      await deleteUser(userToDelete.id);
      setDeleteDialogOpen(false);
      setUserToDelete(null);

      // Refresh the user list
      loadUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
      setError("Failed to delete user. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          User Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={handleAddUser}
        >
          Add User
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search and Filters */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap" }}>
          <Box
            sx={{
              width: "100%",
              maxWidth: { xs: "100%", md: "50%" },
              pr: { xs: 0, md: 1 },
              mb: 2,
            }}
          >
            <TextField
              fullWidth
              label="Search Users"
              name="search"
              value={filters.search}
              onChange={handleSearchChange}
              InputProps={{
                endAdornment: <SearchIcon color="action" />,
              }}
              placeholder="Search by name or email"
            />
          </Box>
          <Box
            sx={{
              width: "100%",
              maxWidth: { xs: "100%", md: "25%" },
              pr: { xs: 0, md: 1 },
              mb: 2,
            }}
          >
            <FormControl fullWidth>
              <InputLabel id="sort-by-label">Sort By</InputLabel>
              <Select
                labelId="sort-by-label"
                id="sort-by"
                name="sortBy"
                value={filters.sortBy || "name"}
                label="Sort By"
                onChange={handleFilterChange}
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="role">Role</MenuItem>
                <MenuItem value="createdAt">Created Date</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box
            sx={{ width: "100%", maxWidth: { xs: "100%", md: "25%" }, mb: 2 }}
          >
            <FormControl fullWidth>
              <InputLabel id="sort-order-label">Order</InputLabel>
              <Select
                labelId="sort-order-label"
                id="sort-order"
                name="sortOrder"
                value={filters.sortOrder || "asc"}
                label="Order"
                onChange={handleFilterChange}
              >
                <MenuItem value="asc">Ascending</MenuItem>
                <MenuItem value="desc">Descending</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
          <Button
            startIcon={<FilterIcon />}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            color="primary"
          >
            {showAdvancedFilters ? "Hide Advanced Filters" : "Advanced Filters"}
          </Button>
          <Tooltip title="Refresh">
            <IconButton onClick={() => loadUsers()} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {showAdvancedFilters && (
          <Box sx={{ display: "flex", flexWrap: "wrap", mt: 1 }}>
            <Box
              sx={{
                width: "100%",
                maxWidth: { xs: "100%", md: "33.33%" },
                pr: { xs: 0, md: 1 },
                mb: 2,
              }}
            >
              <FormControl fullWidth>
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                  labelId="role-label"
                  id="role"
                  name="role"
                  value={filters.role || ""}
                  label="Role"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">All Roles</MenuItem>
                  {Object.values(UserRole).map((role) => (
                    <MenuItem key={role} value={role}>
                      {ROLE_DISPLAY[role]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box
              sx={{
                width: "100%",
                maxWidth: { xs: "100%", md: "33.33%" },
                mb: 2,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.isActive || false}
                    onChange={handleCheckboxChange}
                    name="isActive"
                  />
                }
                label="Active Users Only"
              />
            </Box>
          </Box>
        )}
      </Paper>

      {/* Users Table */}
      <Paper elevation={3}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Avatar
                          src={user.avatar}
                          alt={user.name}
                          sx={{ marginRight: 2 }}
                        />
                        <Typography variant="body2">{user.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role === "admin" ? "Admin" : "User"}
                        color={user.role === "admin" ? "secondary" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Chip
                          label="Active"
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Chip
                          label="Inactive"
                          color="error"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton
                          onClick={() => handleEditUser(user.id)}
                          color="primary"
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          onClick={() => handleDeleteClick(user)}
                          color="error"
                          size="small"
                          disabled={user.role === "admin"} // Prevent deleting admin users
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalUsers}
          rowsPerPage={filters.limit}
          page={filters.page - 1} // MaterialUI pagination is 0-based
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete the user "{userToDelete?.name}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            disabled={deleteLoading}
            variant="contained"
          >
            {deleteLoading ? <CircularProgress size={24} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagementPage;
