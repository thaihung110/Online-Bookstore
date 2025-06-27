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
import { Product } from "../../types/product.types";

interface ProductDeleteDialogProps {
  open: boolean;
  product: Product | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ProductDeleteDialog: React.FC<ProductDeleteDialogProps> = ({
  open,
  product,
  loading,
  onClose,
  onConfirm,
}) => {
  if (!product) return null;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      aria-labelledby="delete-product-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="delete-product-dialog-title">
        Delete Product Confirmation
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete the following product? This action cannot
          be undone.
        </DialogContentText>
        <Box sx={{ mt: 2, display: "flex", alignItems: "center" }}>
          {product.coverImage && (
            <Box
              component="img"
              src={product.coverImage}
              alt={product.title}
              sx={{
                width: 60,
                height: 90,
                objectFit: "cover",
                mr: 2,
                borderRadius: 1,
              }}
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.src = "/placeholder-product.png";
              }}
            />
          )}
          <Box>
            <Typography variant="h6" component="h3">
              {product.title}
            </Typography>
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

export default ProductDeleteDialog;
