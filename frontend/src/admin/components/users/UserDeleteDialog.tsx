import React from "react";
import { Box, Avatar, Typography, Chip } from "@mui/material";
import {
  User,
  UserRole,
  ROLE_DISPLAY,
  getUserRoleColor,
} from "../../types/user.types";
import ConfirmationDialog from "../common/ConfirmationDialog";

interface UserDeleteDialogProps {
  open: boolean;
  user: User | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const UserDeleteDialog: React.FC<UserDeleteDialogProps> = ({
  open,
  user,
  loading,
  onClose,
  onConfirm,
}) => {
  if (!user) return null;

  // Prevent deletion of admin users
  const isAdmin = user.role === UserRole.ADMIN;

  // User details component to display in the dialog
  const userDetails = (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Avatar
        src={user.avatar || ""}
        alt={user.name}
        sx={{ width: 50, height: 50, mr: 2 }}
      >
        {user.name.charAt(0).toUpperCase()}
      </Avatar>
      <Box>
        <Typography variant="h6" component="h3">
          {user.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user.email}
        </Typography>
        <Box sx={{ mt: 0.5 }}>
          <Chip
            label={ROLE_DISPLAY[user.role]}
            size="small"
            color={getUserRoleColor(user.role)}
          />
          <Chip
            label={user.isActive ? "Active" : "Inactive"}
            size="small"
            color={user.isActive ? "success" : "default"}
            variant="outlined"
            sx={{ ml: 0.5 }}
          />
        </Box>
      </Box>
    </Box>
  );

  return (
    <ConfirmationDialog
      open={open}
      title="Delete User Confirmation"
      message={
        isAdmin
          ? "Admin users cannot be deleted for security reasons. Please change the user's role first if you need to delete this account."
          : "Are you sure you want to delete the following user? This action cannot be undone. All user data will be permanently removed from the system."
      }
      contentDetails={userDetails}
      loading={loading}
      type="delete"
      onClose={onClose}
      onConfirm={onConfirm}
      confirmColor="error"
    />
  );
};

export default UserDeleteDialog;
