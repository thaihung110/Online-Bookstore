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
import { getCDs, deleteCD } from "../api/cdApi";
import { CD, CDFilters } from "../types/cd.types";
import CDFilter from "../components/cds/CDFilter";
import CDList from "../components/cds/CDList";
import CDDeleteDialog from "../components/cds/CDDeleteDialog";

// Default filters
const DEFAULT_FILTERS: CDFilters = {
  page: 1,
  limit: 10,
  search: "",
  sortBy: "title",
  sortOrder: "asc",
};

const CDManagementPage: React.FC = () => {
  const navigate = useNavigate();

  // State for CDs and pagination
  const [cds, setCDs] = useState<CD[]>([]);
  const [totalCDs, setTotalCDs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for filters
  const [filters, setFilters] = useState<CDFilters>(DEFAULT_FILTERS);

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cdToDelete, setCDToDelete] = useState<CD | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load CDs on component mount and when filters change
  const loadCDs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getCDs(filters);
      setCDs(response.cds);
      setTotalCDs(response.total);
    } catch (err: any) {
      setError(err.message || "Failed to load CDs");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCDs();
  }, [loadCDs]);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<CDFilters>) => {
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

  // Handle edit CD
  const handleEditCD = (cd: CD) => {
    navigate(`/admin/cds/edit/${cd._id}`);
  };

  // Handle delete CD
  const handleDeleteCD = (cd: CD) => {
    setCDToDelete(cd);
    setDeleteDialogOpen(true);
  };

  // Confirm delete CD
  const confirmDeleteCD = async () => {
    if (!cdToDelete) return;

    setDeleteLoading(true);
    try {
      await deleteCD(cdToDelete._id);
      setDeleteDialogOpen(false);
      setCDToDelete(null);
      loadCDs(); // Refresh the list
    } catch (err: any) {
      setError(err.message || "Failed to delete CD");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setCDToDelete(null);
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalCDs / (filters.limit || 10));

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          CD Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/admin/cds/add")}
          size="large"
        >
          Add New CD
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
        <CDFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          loading={loading}
        />
      </Paper>

      {/* CD List */}
      <Paper sx={{ p: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <CDList
            cds={cds}
            total={totalCDs}
            page={filters.page || 1}
            limit={filters.limit || 10}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onEdit={handleEditCD}
            onDelete={handleDeleteCD}
            loading={loading}
          />
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <CDDeleteDialog
        open={deleteDialogOpen}
        cd={cdToDelete}
        onConfirm={confirmDeleteCD}
        onCancel={cancelDelete}
        loading={deleteLoading}
      />
    </Box>
  );
};

export default CDManagementPage;