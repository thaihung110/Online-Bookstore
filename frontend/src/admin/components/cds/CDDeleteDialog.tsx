import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import { CD } from "../../types/cd.types";

interface CDDeleteDialogProps {
  open: boolean;
  cd: CD | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const CDDeleteDialog: React.FC<CDDeleteDialogProps> = ({
  open,
  cd,
  loading,
  onClose,
  onConfirm,
}) => {
  if (!cd) return null;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      aria-labelledby="delete-cd-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="delete-cd-dialog-title">
        Delete CD Confirmation
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete the following cd? This action cannot
          be undone.
        </DialogContentText>
        <Box sx={{ mt: 2, display: "flex", alignItems: "center" }}>
          {cd.coverImage && (
            <Box
              component="img"
              src={cd.coverImage}
              alt={cd.title}
              sx={{
                width: 60,
                height: 90,
                objectFit: "cover",
                mr: 2,
                borderRadius: 1,
              }}
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.src = "/placeholder-cd.png";
              }}
            />
          )}
          <Box>
            <Typography variant="h6" component="h3">
              {cd.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              by {cd.artist}
            </Typography>
            {/* <Typography variant="body2">ISBN: {cd.isbn}</Typography> */}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={loading}
          startIcon={
            loading ? <CircularProgress size={20} color="inherit" /> : null
          }
        >
          {loading ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CDDeleteDialog;
