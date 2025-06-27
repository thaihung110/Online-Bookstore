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
import { getDVDs, deleteDVD } from "../api/dvdApi";
import { DVD, DVDFilters } from "../types/dvd.types";
import DVDFilter from "../components/dvds/DVDFilter";
import DVDList from "../components/dvds/DVDList";
import DVDDeleteDialog from "../components/dvds/DVDDeleteDialog";

// Default filters
const DEFAULT_FILTERS: DVDFilters = {
  page: 1,
  limit: 10,
  search: "",
  sortBy: "title",
  sortOrder: "asc",
};

const DVDManagementPage: React.FC = () => {
  const navigate = useNavigate();

  // State for DVDs and pagination
  const [dvds, setDVDs] = useState<DVD[]>([]);
  const [totalDVDs, setTotalDVDs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for filters
  const [filters, setFilters] = useState<DVDFilters>(DEFAULT_FILTERS);

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dvdToDelete, setDVDToDelete] = useState<DVD | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load DVDs on component mount and when filters change
  const loadDVDs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getDVDs(filters);
      setDVDs(response.dvds);
      setTotalDVDs(response.total);
    } catch (err: any) {
      setError(err.message || "Failed to load DVDs");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadDVDs();
  }, [loadDVDs]);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<DVDFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: newFilters.page || 1, // Reset to page 1 unless page is explicitly set
    }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Handle edit DVD
  const handleEditDVD = (dvd: DVD) => {
    navigate(`/admin/dvds/edit/${dvd._id}`);
  };

  // Handle delete DVD
  const handleDeleteDVD = (dvd: DVD) => {
    setDVDToDelete(dvd);
    setDeleteDialogOpen(true);
  };

  // Confirm delete DVD
  const confirmDeleteDVD = async () => {
    if (!dvdToDelete) return;

    setDeleteLoading(true);
    try {
      await deleteDVD(dvdToDelete._id);
      setDeleteDialogOpen(false);
      setDVDToDelete(null);
      loadDVDs(); // Refresh the list
    } catch (err: any) {
      setError(err.message || "Failed to delete DVD");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setDVDToDelete(null);
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalDVDs / (filters.limit || 10));

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          DVD Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/admin/dvds/add")}
          size="large"
        >
          Add New DVD
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filter Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <DVDFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          loading={loading}
        />
      </Paper>

      {/* DVD List */}
      <Paper sx={{ p: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <DVDList
            dvds={dvds}
            total={totalDVDs}
            page={filters.page || 1}
            limit={filters.limit || 10}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onEdit={handleEditDVD}
            onDelete={handleDeleteDVD}
            loading={loading}
          />
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <DVDDeleteDialog
        open={deleteDialogOpen}
        dvd={dvdToDelete}
        onConfirm={confirmDeleteDVD}
        onCancel={cancelDelete}
        loading={deleteLoading}
      />
    </Box>
  );
};

export default DVDManagementPage;