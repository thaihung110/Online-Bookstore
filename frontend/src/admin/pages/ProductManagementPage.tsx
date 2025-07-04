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
import { getProducts, deleteProduct } from "../api/productApi";
import { Product, ProductFilters } from "../types/product.types";
import ProductFilter from "../components/products/ProductFilter";
// import ProductList from "../components/products/ProductList";
import ProductDeleteDialog from "../components/products/ProductDeleteDialog";
import ProductList from "../components/products/ProductList";

// Default filters
const DEFAULT_FILTERS: ProductFilters = {
  page: 1,
  limit: 10,
  search: "",
  sortBy: "title",
  sortOrder: "asc",
};

const ProductManagementPage: React.FC = () => {
  const navigate = useNavigate();

  // State for products and pagination
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for filters
  const [filters, setFilters] = useState<ProductFilters>(DEFAULT_FILTERS);

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load products on component mount and when filters change
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getProducts(filters);
      setProducts(response.products);
      setTotalProducts(response.total);
    } catch (err) {
      console.error("Failed to load products:", err);
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<ProductFilters>) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      ...newFilters,
    }));
  };

  // Reset filters to defaults
  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // Handle add product
  const handleAddBook = () => {
    navigate("/admin/books/add");
  };

  // handle create cd
  const handleAddCD = () => {
    navigate("/admin/cds/add");
  };

  const handleAddDVD = () => {
    navigate("/admin/dvds/add");
  };

  //   Handle delete product
  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    setDeleteLoading(true);

    try {
      await deleteProduct(productToDelete._id);
      setDeleteDialogOpen(false);
      setProductToDelete(null);

      // Refresh the product list
      loadProducts();
    } catch (err) {
      console.error("Failed to delete product:", err);
      setError("Failed to delete product. Please try again.");
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
          Product Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddBook}
        >
          Add Product
        </Button>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddCD}
          sx={{ ml: 2 }}
        >
          Add CD
        </Button>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddDVD}
          sx={{ ml: 2 }}
        >
          Add DVD
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <ProductFilter
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* Product List */}
      <ProductList
        products={products}
        totalProducts={totalProducts}
        loading={loading}
        filters={filters}
        onFilterChange={handleFilterChange}
        onDeleteProduct={handleDeleteClick}
      />

      {/* View History Button - Add this section */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mt: 3,
          mb: 2,
        }}
      >
        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate("/admin/books/history")}
          sx={{
            px: 4,
            py: 1.5,
            fontSize: "1rem",
            fontWeight: 500,
          }}
        >
          View History
        </Button>
      </Box>

      {/* Delete Confirmation Dialog */}
      <ProductDeleteDialog
        open={deleteDialogOpen}
        product={productToDelete}
        loading={deleteLoading}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
};

export default ProductManagementPage;
