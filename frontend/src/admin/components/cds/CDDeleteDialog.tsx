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
import { CD } from "../../types/cd.types";

interface CDDeleteDialogProps {
  open: boolean;
  cd: CD | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

const CDDeleteDialog: React.FC<CDDeleteDialogProps> = ({
  open,
  cd,
  onConfirm,
  onCancel,
  loading,
}) => {
  if (!cd) return null;

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <WarningIcon color="error" />
          Delete CD
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar
            src={cd.coverImage}
            alt={cd.title}
            sx={{ width: 60, height: 60 }}
            variant="rounded"
          >
            {cd.title.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h6">{cd.title}</Typography>
            <Typography variant="body2" color="textSecondary">
              by {cd.artist}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Album: {cd.albumTitle}
            </Typography>
          </Box>
        </Box>

        <Typography variant="body1" color="textSecondary">
          Are you sure you want to delete this CD? This action cannot be undone.
        </Typography>

        {cd.stock > 0 && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: "warning.light",
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" color="warning.dark">
              <strong>Warning:</strong> This CD has {cd.stock} units in stock.
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

export default CDDeleteDialog;