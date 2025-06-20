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
          Are you sure you want to delete the following book? This action cannot
          be undone.
        </DialogContentText>
        <Box sx={{ mt: 2, display: "flex", alignItems: "center" }}>
          {book.coverImage && (
            <Box
              component="img"
              src={book.coverImage}
              alt={book.title}
              sx={{
                width: 60,
                height: 90,
                objectFit: "cover",
                mr: 2,
                borderRadius: 1,
              }}
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.src = "/placeholder-book.png";
              }}
            />
          )}
          <Box>
            <Typography variant="h6" component="h3">
              {book.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              by {book.author}
            </Typography>
            <Typography variant="body2">ISBN: {book.isbn}</Typography>
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

export default BookDeleteDialog;
