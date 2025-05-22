import React, { useEffect } from "react";
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
} from "@mui/material";
import { useOrderStore } from "../store/orderStore";

const OrdersManagementPage: React.FC = () => {
  // Order store state and actions
  const {
    orders,
    totalOrders,
    currentPage,
    totalPages,
    isLoading,
    error,
    filters,
    setFilters,
    fetchOrders,
  } = useOrderStore();

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

  // Get status chip color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "default";
      case "processing":
        return "info";
      case "shipped":
        return "primary";
      case "delivered":
        return "success";
      case "cancelled":
        return "error";
      case "returned":
        return "warning";
      case "refunded":
        return "secondary";
      case "completed":
        return "success";
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
      <Typography variant="h4" component="h1" gutterBottom>
        Order Management
      </Typography>

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
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="processing">Processing</MenuItem>
            <MenuItem value="shipped">Shipped</MenuItem>
            <MenuItem value="delivered">Delivered</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
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
            <MenuItem value="totalAmount-desc">Total (Highest First)</MenuItem>
            <MenuItem value="totalAmount-asc">Total (Lowest First)</MenuItem>
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
        ) : orders.length === 0 ? (
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
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>{order.user.name}</TableCell>
                    <TableCell>{order.items.length} items</TableCell>
                    <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip
                        label={
                          order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)
                        }
                        color={getStatusColor(order.status) as any}
                        size="small"
                      />
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
    </Box>
  );
};

export default OrdersManagementPage;
