import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
} from "@mui/material";
import { Book } from "../../types/book.types";

interface BookDeleteDialogProps {
  open: boolean;
  book: Book | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const BookDeleteDialog: React.FC<BookDeleteDialogProps> = ({
  open,
  book,
  loading,
  onClose,
  onConfirm,
}) => {
  if (!book) return null;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      aria-labelledby="delete-book-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="delete-book-dialog-title">
        Delete Book Confirmation
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete the book "{book.title}"? This action cannot be undone.
        </DialogContentText>
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

export default BookDeleteDialog;
