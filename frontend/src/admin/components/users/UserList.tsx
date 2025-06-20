import React from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  User,
  UserFilters,
  UserRole,
  ROLE_DISPLAY,
  getUserRoleColor,
} from "../../types/user.types";
import DataTable, { DataTableColumn } from "../common/DataTable";

interface UserListProps {
  users: User[];
  totalUsers: number;
  loading: boolean;
  filters: UserFilters;
  onFilterChange: (newFilters: Partial<UserFilters>) => void;
  onDeleteUser: (user: User) => void;
}

const UserList: React.FC<UserListProps> = ({
  users,
  totalUsers,
  loading,
  filters,
  onFilterChange,
  onDeleteUser,
}) => {
  const navigate = useNavigate();

  // Handle pagination
  const handleChangePage = (newPage: number) => {
    onFilterChange({ page: newPage + 1 });
  };

  const handleChangeRowsPerPage = (newRowsPerPage: number) => {
    onFilterChange({
      limit: newRowsPerPage,
      page: 1,
    });
  };

  // Handle sorting
  const handleSortRequest = (property: string) => {
    const isAsc = filters.sortBy === property && filters.sortOrder === "asc";
    onFilterChange({
      sortBy: property as any,
      sortOrder: isAsc ? "desc" : "asc",
      page: 1,
    });
  };

  // Handle actions
  const handleEditUser = (id: string) => {
    navigate(`/admin/users/edit/${id}`);
  };

  // Define table columns
  const columns: DataTableColumn<User>[] = [
    {
      id: "name",
      label: "User",
      sortable: true,
      renderCell: (user) => (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Avatar src={user.avatar || ""} alt={user.name} sx={{ mr: 2 }}>
            {user.name.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="body1">{user.name}</Typography>
        </Box>
      ),
    },
    {
      id: "email",
      label: "Email",
      sortable: true,
    },
    {
      id: "role",
      label: "Role",
      sortable: true,
      renderCell: (user) => (
        <Chip
          label={ROLE_DISPLAY[user.role]}
          size="small"
          color={getUserRoleColor(user.role)}
        />
      ),
    },
    {
      id: "createdAt",
      label: "Joined",
      sortable: true,
      renderCell: (user) => new Date(user.createdAt).toLocaleDateString(),
    },
    {
      id: "isActive",
      label: "Status",
      renderCell: (user) => (
        <Chip
          label={user.isActive ? "Active" : "Inactive"}
          size="small"
          color={user.isActive ? "success" : "default"}
          variant="outlined"
        />
      ),
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      renderCell: (user) => (
        <>
          <Tooltip title="Email">
            <IconButton
              aria-label="email"
              size="small"
              onClick={() => (window.location.href = `mailto:${user.email}`)}
            >
              <EmailIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              aria-label="edit"
              size="small"
              onClick={() => handleEditUser(user.id)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              aria-label="delete"
              size="small"
              onClick={() => onDeleteUser(user)}
              color="error"
              disabled={user.role === UserRole.ADMIN} // Prevent deleting admins
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      ),
    },
  ];

  // Empty state action
  const emptyAction = (
    <Button
      variant="contained"
      color="primary"
      startIcon={<AddIcon />}
      onClick={() => navigate("/admin/users/add")}
    >
      Add New User
    </Button>
  );

  return (
    <DataTable
      columns={columns}
      data={users}
      keyExtractor={(user) => user.id}
      totalItems={totalUsers}
      page={filters.page - 1}
      rowsPerPage={filters.limit}
      sortBy={filters.sortBy}
      sortOrder={filters.sortOrder}
      loading={loading}
      emptyMessage="No users found. Try adjusting your filters."
      emptyAction={emptyAction}
      onPageChange={handleChangePage}
      onRowsPerPageChange={handleChangeRowsPerPage}
      onSortChange={handleSortRequest}
    />
  );
};

export default UserList;
