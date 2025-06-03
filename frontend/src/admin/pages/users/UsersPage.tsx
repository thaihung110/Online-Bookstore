import React, { useState, useEffect } from "react";
import { Button, Typography, Box } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import UserList from "../../components/users/UserList";
import UserFilter from "../../components/users/UserFilter";
import UserDeleteDialog from "../../components/users/UserDeleteDialog";
import {
  User,
  UserFilters,
  DEFAULT_USER_FILTERS,
  UserRole,
} from "../../types/user.types";
import { useUserFilters } from "../../hooks/useUserFilters";
import { getUsers, deleteUser as apiDeleteUser } from "../../api/userApi";

/**
 * Admin users management page
 */
const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { filters, updateFilters, resetFilters } = useUserFilters();

  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load users based on filters
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Gọi API thật để lấy danh sách user
        const allUsers = await getUsers();
        let filteredUsers = [...allUsers];

        // Apply search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredUsers = filteredUsers.filter(
            (user) =>
              (user.name || "").toLowerCase().includes(searchLower) ||
              (user.email || "").toLowerCase().includes(searchLower)
          );
        }

        // Apply role filter
        if (filters.role) {
          filteredUsers = filteredUsers.filter(
            (user) => user.role === filters.role
          );
        }

        // Apply active filter
        if (filters.isActive !== undefined) {
          filteredUsers = filteredUsers.filter(
            (user) => user.isActive === filters.isActive
          );
        }

        // Apply sorting
        if (filters.sortBy) {
          filteredUsers.sort((a, b) => {
            // Safely get values, handling potential undefined values
            const getPropertyValue = (obj: User, key: keyof User) => {
              const value = obj[key];
              return value !== undefined ? value : "";
            };

            let aValue = getPropertyValue(a, filters.sortBy as keyof User);
            let bValue = getPropertyValue(b, filters.sortBy as keyof User);

            // Convert strings to lowercase for case-insensitive sorting
            if (typeof aValue === "string" && typeof bValue === "string") {
              aValue = aValue.toLowerCase();
              bValue = bValue.toLowerCase();
            }

            // Compare values based on sort order
            if (filters.sortOrder === "desc") {
              // @ts-ignore - We've already checked for undefined values
              return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
            // @ts-ignore - We've already checked for undefined values
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          });
        }

        setTotalUsers(filteredUsers.length);

        // Apply pagination
        const startIndex = (filters.page - 1) * filters.limit;
        const paginatedUsers = filteredUsers.slice(
          startIndex,
          startIndex + filters.limit
        );

        setUsers(paginatedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        // Handle error in a real application
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [filters]);

  // Handle opening delete dialog
  const handleOpenDeleteDialog = (user: User) => {
    setDeleteUser(user);
  };

  // Handle closing delete dialog
  const handleCloseDeleteDialog = () => {
    setDeleteUser(null);
  };

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!deleteUser) return;

    setDeleteLoading(true);
    try {
      // Gọi API thật để xoá user
      await apiDeleteUser(deleteUser.id);
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.id !== deleteUser.id)
      );
      setTotalUsers((prevTotal) => prevTotal - 1);
      setDeleteUser(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      // Handle error in a real application
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" component="h1">
          User Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate("/admin/users/add")}
        >
          Add User
        </Button>
      </Box>

      <UserFilter
        filters={filters}
        onFilterChange={updateFilters}
        onResetFilters={resetFilters}
      />

      <UserList
        users={users}
        totalUsers={totalUsers}
        loading={loading}
        filters={filters}
        onFilterChange={updateFilters}
        onDeleteUser={handleOpenDeleteDialog}
      />

      <UserDeleteDialog
        open={Boolean(deleteUser)}
        user={deleteUser}
        loading={deleteLoading}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteUser}
      />
    </>
  );
};

export default UsersPage;
