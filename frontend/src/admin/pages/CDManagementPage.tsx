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

      setCDs(response.cds); // Fixed: Use 'cds' instead of 'cds'
      setTotalCDs(response.total);
    } catch (err) {
      console.error("Failed to load CDs:", err);
      setError("Failed to load CDs. Please try again.");

    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCDs();
  }, [loadCDs]);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<CDFilters>) => {

    setFilters((prevFilters) => ({
      ...prevFilters,
      ...newFilters,
    }));
  };

  // Reset filters to defaults
  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // Handle add CD
  const handleAddCD = () => {
    navigate("/admin/cds/add");
  };

  // Handle delete CD
  const handleDeleteClick = (cd: CD) => {

    setCDToDelete(cd);
    setDeleteDialogOpen(true);
  };


  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCDToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!cdToDelete) return;

    setDeleteLoading(true);


    try {
      await deleteCD(cdToDelete._id);
      setDeleteDialogOpen(false);
      setCDToDelete(null);


      // Refresh the CD list
      loadCDs();
    } catch (err) {
      console.error("Failed to delete CD:", err);
      setError("Failed to delete CD. Please try again.");

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

          CD Management
        </Typography>
        <Button
          variant="contained"

          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddCD}
        >
          Add CD
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>

          {error}
        </Alert>
      )}


      {/* Filters */}
      <CDFilter
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* CD List */}
      <CDList
        cds={cds}
        totalCDs={totalCDs}
        loading={loading}
        filters={filters}
        onFilterChange={handleFilterChange}
        onDeleteCD={handleDeleteClick}
      />


      {/* Delete Confirmation Dialog */}
      <CDDeleteDialog
        open={deleteDialogOpen}
        cd={cdToDelete}

        loading={deleteLoading}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}

      />
    </Box>
  );
};


export default CDManagementPage;

