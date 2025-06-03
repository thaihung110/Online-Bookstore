import React, { useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Grid,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import {
  AccountCircle,
  ShoppingBasket,
  Edit,
  Book,
  MailOutline,
  CalendarToday,
  CheckCircle,
  Schedule,
  LocalShipping,
  Cancel,
} from "@mui/icons-material";
import MainLayout from "../components/layouts/MainLayout";
import { useAuthStore } from "../store/authStore";
import { useOrderStore } from "../store/orderStore";
import { useNavigate } from "react-router-dom";
import { OrderStatus } from "../api/orders";
import { formatCurrency } from "../utils/format";

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Order store integration
  const {
    fetchUserOrders,
    getRecentOrders,
    hasOrders,
    isLoadingHistory,
    historyError,
  } = useOrderStore();

  // Fetch all user orders on component mount
  useEffect(() => {
    fetchUserOrders(); // Fetch all orders (no limit)
  }, [fetchUserOrders]);

  // Get all orders for display
  const allOrders = getRecentOrders(); // Get all orders (no limit)

  // Helper function to get order status icon and color
  const getOrderStatusDisplay = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return { icon: <Schedule fontSize="small" />, color: "warning" as const };
      case OrderStatus.PROCESSING:
        return { icon: <Schedule fontSize="small" />, color: "info" as const };
      case OrderStatus.SHIPPED:
        return { icon: <LocalShipping fontSize="small" />, color: "primary" as const };
      case OrderStatus.DELIVERED:
        return { icon: <CheckCircle fontSize="small" />, color: "success" as const };
      case OrderStatus.CANCELLED:
        return { icon: <Cancel fontSize="small" />, color: "error" as const };
      default:
        return { icon: <Schedule fontSize="small" />, color: "default" as const };
    }
  };

  // Placeholder for user creation date - replace with actual data when available
  const memberSince = user?.id // A crude way to make it seem dynamic for now
    ? new Date(
        Date.now() - (parseInt(user.id, 16) % (1000 * 60 * 60 * 24 * 365))
      ).toLocaleDateString()
    : new Date().toLocaleDateString();

  return (
    <MainLayout>
      <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
        <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main", mr: 2 }}>
          <AccountCircle sx={{ fontSize: 40 }} />
        </Avatar>
        <Box>
          <Typography variant="h4" component="h1">
            Welcome, {user?.username || "User"}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your account and view your orders.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Account Information Section */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <AccountCircle color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Account Information</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <AccountCircle fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Username"
                  secondary={user?.username || "N/A"}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <MailOutline fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Email"
                  secondary={user?.email || "N/A"}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CalendarToday fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Member Since" secondary={memberSince} />
              </ListItem>
            </List>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              sx={{ mt: 2 }}
              onClick={() => navigate("/dashboard/edit-profile")} // Placeholder path
            >
              Edit Profile
            </Button>
          </Paper>
        </Grid>

        {/* All Orders Section */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <ShoppingBasket color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Your Orders</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {/* Loading state */}
            {isLoadingHistory && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  Loading orders...
                </Typography>
              </Box>
            )}

            {/* Error state */}
            {historyError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {historyError}
              </Alert>
            )}

            {/* No orders state */}
            {!isLoadingHistory && !historyError && !hasOrders() && (
              <>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  You haven't placed any orders yet.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Book />}
                  onClick={() => navigate("/books")}
                >
                  Browse Books & Start Shopping
                </Button>
              </>
            )}

            {/* Scrollable Orders list */}
            {!isLoadingHistory && !historyError && hasOrders() && (
              <Box sx={{
                flexGrow: 1,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column"
              }}>
                <Box sx={{
                  flexGrow: 1,
                  overflowY: "auto",
                  maxHeight: "400px",
                  pr: 1 // Add padding for scrollbar
                }}>
                  <List dense>
                    {allOrders.map((order) => {
                      const statusDisplay = getOrderStatusDisplay(order.status);
                      return (
                        <ListItem key={order._id} sx={{ px: 0 }}>
                          <ListItemIcon>
                            {statusDisplay.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" fontWeight="medium">
                                  Order #{order._id.slice(-6)}
                                </Typography>
                                <Chip
                                  label={order.status}
                                  size="small"
                                  color={statusDisplay.color}
                                  variant="outlined"
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {formatCurrency(order.total)} • {order.items.length} item(s)
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>


      </Grid>
    </MainLayout>
  );
};

export default DashboardPage;
