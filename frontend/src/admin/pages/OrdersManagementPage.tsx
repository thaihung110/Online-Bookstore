import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Pagination,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
} from "@mui/material";
import {
  Visibility,
  Edit,
  Delete,
  Refresh,
  LocalShipping,
} from "@mui/icons-material";
import { useOrderStore } from "../store/orderStore";
import { Order, OrderFormData } from "../types/order.types";

const OrdersManagementPage: React.FC = () => {
  // Order store state and actions
  const {
    orders,
    totalOrders,
    currentPage,
    totalPages,
    isLoading,
    isUpdating,
    isDeleting,
    error,
    updateError,
    deleteError,
    filters,
    setFilters,
    fetchOrders,
    updateOrderStatus,
    deleteOrder,
    resetErrors,
  } = useOrderStore();

  // Local state for dialogs and forms
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

  // Form state for editing orders
  const [editForm, setEditForm] = useState<OrderFormData>({
    status: "",
    trackingNumber: "",
    notes: "",
  });

  // Load orders on mount and when filters change
  useEffect(() => {
    fetchOrders();
  }, [filters, fetchOrders]);

  // Handle filter changes
  const handleFilterChange = (name: keyof typeof filters, value: any) => {
    setFilters({ [name]: value });
  };

  // Handle page change
  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    handleFilterChange("page", page);
  };

  // Handle view order
  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setViewDialogOpen(true);
  };

  // Handle edit order
  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setEditForm({
      status: order.status,
      trackingNumber: order.trackingNumber || "",
      notes: order.notes || "",
    });
    setEditDialogOpen(true);
  };

  // Handle delete order
  const handleDeleteOrder = (order: Order) => {
    setSelectedOrder(order);
    setDeleteDialogOpen(true);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchOrders();
    showSnackbar("Orders refreshed", "success");
  };

  // Show snackbar notification
  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Handle form submission for editing
  const handleEditSubmit = async () => {
    if (!selectedOrder) return;

    console.log("[Admin Orders] Submitting edit form:", editForm);
    console.log("[Admin Orders] Selected order:", selectedOrder);

    try {
      await updateOrderStatus(selectedOrder.id, editForm);
      setEditDialogOpen(false);
      showSnackbar("Order updated successfully", "success");
    } catch (error) {
      console.error("[Admin Orders] Update failed:", error);
      showSnackbar("Failed to update order", "error");
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedOrder) return;

    try {
      await deleteOrder(selectedOrder.id);
      setDeleteDialogOpen(false);
      showSnackbar("Order deleted successfully", "success");
    } catch (error) {
      showSnackbar("Failed to delete order", "error");
    }
  };

  // Close dialogs
  const closeDialogs = () => {
    setViewDialogOpen(false);
    setEditDialogOpen(false);
    setDeleteDialogOpen(false);
    setSelectedOrder(null);
    resetErrors();
  };

  // Get status chip color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "default";
      case "RECEIVED":
        return "info";
      case "CONFIRMED":
        return "info";
      case "PREPARED":
        return "primary";
      case "SHIPPED":
        return "primary";
      case "DELIVERED":
        return "success";
      case "CANCELED":
        return "error";
      case "REFUNDED":
        return "secondary";
      default:
        return "default";
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Box>
      {/* Header with title and refresh button */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Order Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </Box>

      {/* Summary stats */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Summary
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          <Box sx={{ minWidth: 120 }}>
            <Typography variant="body2" color="text.secondary">
              Total Orders
            </Typography>
            <Typography variant="h6">{totalOrders}</Typography>
          </Box>
          <Box sx={{ minWidth: 120 }}>
            <Typography variant="body2" color="text.secondary">
              Current Page
            </Typography>
            <Typography variant="h6">
              {currentPage} of {totalPages}
            </Typography>
          </Box>
          <Box sx={{ minWidth: 120 }}>
            <Typography variant="body2" color="text.secondary">
              Orders per Page
            </Typography>
            <Typography variant="h6">{filters.limit}</Typography>
          </Box>
          <Box sx={{ minWidth: 120 }}>
            <Typography variant="body2" color="text.secondary">
              Showing
            </Typography>
            <Typography variant="h6">{orders.length} orders</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Basic filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <FormControl sx={{ minWidth: 200, mr: 2 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status || ""}
            label="Status"
            onChange={(e) => handleFilterChange("status", e.target.value)}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="RECEIVED">Received</MenuItem>
            <MenuItem value="CONFIRMED">Confirmed</MenuItem>
            <MenuItem value="PREPARED">Prepared</MenuItem>
            <MenuItem value="SHIPPED">Shipped</MenuItem>
            <MenuItem value="DELIVERED">Delivered</MenuItem>
            <MenuItem value="CANCELED">Canceled</MenuItem>
            <MenuItem value="REFUNDED">Refunded</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={`${filters.sortBy || "createdAt"}-${
              filters.sortOrder || "desc"
            }`}
            label="Sort By"
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split("-");
              setFilters({ sortBy, sortOrder: sortOrder as "asc" | "desc" });
            }}
          >
            <MenuItem value="createdAt-desc">Date (Newest First)</MenuItem>
            <MenuItem value="createdAt-asc">Date (Oldest First)</MenuItem>
            <MenuItem value="total-desc">Total (Highest First)</MenuItem>
            <MenuItem value="total-asc">Total (Lowest First)</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Orders Table */}
      <Paper sx={{ width: "100%", mb: 3 }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : !orders || orders.length === 0 ? (
          <Box sx={{ textAlign: "center", p: 3 }}>
            <Typography variant="h6" color="text.secondary">
              No orders found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your filters or adding new orders.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders &&
                  Array.isArray(orders) &&
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          #{order.id ? order.id.slice(-8) : "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {order.user.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {order.user.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{order.items.length} items</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          ${(order.totalAmount || 0).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            order.status
                              ? order.status.charAt(0).toUpperCase() +
                                order.status.slice(1)
                              : "Unknown"
                          }
                          color={getStatusColor(order.status || "") as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewOrder(order)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Order">
                            <IconButton
                              size="small"
                              onClick={() => handleEditOrder(order)}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {order.status === "SHIPPED" && (
                            <Tooltip title="Tracking">
                              <IconButton size="small">
                                <LocalShipping fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete Order">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteOrder(order)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              p: 2,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {/* View Order Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={closeDialogs}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Order Details</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 3,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Order Information
                  </Typography>
                  <Typography variant="body2">
                    <strong>Order ID:</strong> #
                    {selectedOrder.id ? selectedOrder.id.slice(-8) : "N/A"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> {selectedOrder.status}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Created:</strong>{" "}
                    {formatDate(selectedOrder.createdAt)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Updated:</strong>{" "}
                    {formatDate(selectedOrder.updatedAt)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Total:</strong> $
                    {selectedOrder.totalAmount.toFixed(2)}
                  </Typography>
                  {selectedOrder.trackingNumber && (
                    <Typography variant="body2">
                      <strong>Tracking:</strong> {selectedOrder.trackingNumber}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Customer Information
                  </Typography>
                  <Typography variant="body2">
                    <strong>Name:</strong> {selectedOrder.user.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Email:</strong> {selectedOrder.user.email}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Shipping Address:</strong>{" "}
                    {selectedOrder.shippingAddress}
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Order Items
                </Typography>
                {selectedOrder.items.map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      mb: 1,
                      p: 1,
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2">
                      <strong>{item.book.title}</strong> by {item.book.author}
                    </Typography>
                    <Typography variant="body2">
                      Quantity: {item.quantity} × ${item.price.toFixed(2)} = $
                      {(item.quantity * item.price).toFixed(2)}
                    </Typography>
                  </Box>
                ))}
              </Box>
              {selectedOrder.notes && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Notes
                  </Typography>
                  <Typography variant="body2">{selectedOrder.notes}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialogs}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={closeDialogs}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Order</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={editForm.status}
                label="Status"
                onChange={(e) =>
                  setEditForm({ ...editForm, status: e.target.value })
                }
              >
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="RECEIVED">Received</MenuItem>
                <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                <MenuItem value="PREPARED">Prepared</MenuItem>
                <MenuItem value="SHIPPED">Shipped</MenuItem>
                <MenuItem value="DELIVERED">Delivered</MenuItem>
                <MenuItem value="CANCELED">Canceled</MenuItem>
                <MenuItem value="REFUNDED">Refunded</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Tracking Number"
              value={editForm.trackingNumber}
              onChange={(e) =>
                setEditForm({ ...editForm, trackingNumber: e.target.value })
              }
              placeholder="Enter tracking number"
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes"
              value={editForm.notes}
              onChange={(e) =>
                setEditForm({ ...editForm, notes: e.target.value })
              }
              placeholder="Add notes about this order"
            />
          </Box>
          {updateError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {updateError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialogs}>Cancel</Button>
          <Button
            onClick={handleEditSubmit}
            variant="contained"
            disabled={isUpdating}
          >
            {isUpdating ? <CircularProgress size={20} /> : "Update Order"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Order Dialog */}
      <Dialog open={deleteDialogOpen} onClose={closeDialogs}>
        <DialogTitle>Delete Order</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete order #{selectedOrder?.id.slice(-8)}
            ?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialogs}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? <CircularProgress size={20} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OrdersManagementPage;
