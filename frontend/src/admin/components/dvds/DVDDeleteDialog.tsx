import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar,
  CircularProgress,
} from "@mui/material";
import { Warning as WarningIcon } from "@mui/icons-material";
import { DVD } from "../../types/dvd.types";

interface DVDDeleteDialogProps {
  open: boolean;
  dvd: DVD | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

const DVDDeleteDialog: React.FC<DVDDeleteDialogProps> = ({
  open,
  dvd,
  onConfirm,
  onCancel,
  loading,
}) => {
  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (!dvd) return null;

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <WarningIcon color="error" />
          Delete DVD
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar
            src={dvd.coverImage}
            alt={dvd.title}
            sx={{ width: 60, height: 60 }}
            variant="rounded"
          >
            {dvd.title.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h6">{dvd.title}</Typography>
            <Typography variant="body2" color="textSecondary">
              Directed by {dvd.director}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Studio: {dvd.studio} • Runtime: {formatRuntime(dvd.runtime)}
            </Typography>
          </Box>
        </Box>

        <Typography variant="body1" color="textSecondary">
          Are you sure you want to delete this DVD? This action cannot be undone.
        </Typography>

        {dvd.stock > 0 && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: "warning.light",
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" color="warning.dark">
              <strong>Warning:</strong> This DVD has {dvd.stock} units in stock.
              Deleting it will remove all inventory.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DVDDeleteDialog;