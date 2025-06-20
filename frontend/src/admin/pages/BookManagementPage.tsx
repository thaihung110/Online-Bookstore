import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { getBooks, deleteBook } from "../api/bookApi";
import { Book, BookFilters } from "../types/book.types";
import BookFilter from "../components/books/BookFilter";
import BookList from "../components/books/BookList";
import BookDeleteDialog from "../components/books/BookDeleteDialog";

// Default filters
const DEFAULT_FILTERS: BookFilters = {
  page: 1,
  limit: 10,
  search: "",
  sortBy: "title",
  sortOrder: "asc",
};

const BookManagementPage: React.FC = () => {
  const navigate = useNavigate();

  // State for books and pagination
  const [books, setBooks] = useState<Book[]>([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for filters
  const [filters, setFilters] = useState<BookFilters>(DEFAULT_FILTERS);

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load books on component mount and when filters change
  const loadBooks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getBooks(filters);
      setBooks(response.books);
      setTotalBooks(response.total);
    } catch (err) {
      console.error("Failed to load books:", err);
      setError("Failed to load books. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<BookFilters>) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      ...newFilters,
    }));
  };

  // Reset filters to defaults
  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // Handle add book
  const handleAddBook = () => {
    navigate("/admin/books/add");
  };

  // Handle delete book
  const handleDeleteClick = (book: Book) => {
    setBookToDelete(book);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setBookToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!bookToDelete) return;

    setDeleteLoading(true);

    try {
      await deleteBook(bookToDelete._id);
      setDeleteDialogOpen(false);
      setBookToDelete(null);

      // Refresh the book list
      loadBooks();
    } catch (err) {
      console.error("Failed to delete book:", err);
      setError("Failed to delete book. Please try again.");
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
          Book Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddBook}
        >
          Add Book
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <BookFilter
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* Book List */}
      <BookList
        books={books}
        totalBooks={totalBooks}
        loading={loading}
        filters={filters}
        onFilterChange={handleFilterChange}
        onDeleteBook={handleDeleteClick}
      />

      {/* Delete Confirmation Dialog */}
      <BookDeleteDialog
        open={deleteDialogOpen}
        book={bookToDelete}
        loading={deleteLoading}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
};

export default BookManagementPage;
