import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  useTheme,
  Alert,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  LinearProgress,
  Link,
} from "@mui/material";
import {
  LocalShipping as OrderIcon,
  AttachMoney as RevenueIcon,
  MenuBook as BookIcon,
  People as UserIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useNavigate } from "react-router-dom";
import StatCard from "../components/dashboard/StatCard";
import { getUsers } from "../api/userApi";
import { getOrders } from "../api/orderApi";
import { getBooks } from "../../api/books";

const AdminDashboardPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dashboard stats
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalBooks, setTotalBooks] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topBooks, setTopBooks] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get users
        const users = await getUsers();
        setTotalUsers(users.length);

        // Get all orders (for total, revenue, recent, top books)
        const orderRes = await getOrders({
          page: 1,
          limit: 1000,
          sortBy: "createdAt",
          sortOrder: "desc",
        });
        setTotalOrders(orderRes.total);
        setRecentOrders(orderRes.orders.slice(0, 5));
        // Tính tổng revenue
        const revenue = orderRes.orders.reduce(
          (sum, o) => sum + (o.totalAmount || o.subtotal || 0),
          0
        );
        setTotalRevenue(revenue);

        // Get all books (for total)
        const bookRes = await getBooks({ page: 1, limit: 1 });
        setTotalBooks(bookRes.total);

        // Tính top selling books từ orders
        const bookSalesMap: Record<
          string,
          { bookId: string; title: string; author: string; sold: number }
        > = {};
        orderRes.orders.forEach((order) => {
          order.items.forEach((item) => {
            const bookId =
              typeof item.book === "string"
                ? item.book
                : item.book.id || item.book.id;
            const title = typeof item.book === "object" ? item.book.title : "";
            const author =
              typeof item.book === "object" ? item.book.author : "";
            if (!bookSalesMap[bookId]) {
              bookSalesMap[bookId] = {
                bookId,
                title,
                author,
                sold: 0,
              };
            }
            bookSalesMap[bookId].sold += item.quantity;
          });
        });
        const topBooksArr = Object.values(bookSalesMap)
          .sort((a, b) => b.sold - a.sold)
          .slice(0, 5);
        setTopBooks(topBooksArr);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Helper function to format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status color for orders
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "Delivered":
        return "success";
      case "Shipped":
        return "info";
      case "Processing":
        return "warning";
      case "Pending":
        return "default";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Orders"
            value={totalOrders}
            icon={<OrderIcon />}
            color="#4A6CF7"
            change={{
              value: 0,
              label: "this month",
              positive: true,
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            icon={<RevenueIcon />}
            color="#6A4CF7"
            change={{
              value: 0,
              label: "this month",
              positive: true,
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Books"
            value={totalBooks}
            icon={<BookIcon />}
            color="#4CAF50"
            change={{
              value: 0,
              label: "this month",
              positive: true,
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Users"
            value={totalUsers}
            icon={<UserIcon />}
            color="#F7A74A"
            change={{
              value: 0,
              label: "this month",
              positive: true,
            }}
          />
        </Grid>
      </Grid>

      {/* Recent Orders */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" component="h2">
                Recent Orders
              </Typography>
              <Button
                variant="text"
                color="primary"
                onClick={() => navigate("/admin/orders")}
              >
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Items</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order._id || order.id} hover>
                      <TableCell>
                        <Link
                          component="button"
                          variant="body2"
                          color="primary"
                          onClick={() => {
                            // Implement when order details is available
                            console.log(
                              `Navigate to order ${order._id || order.id}`
                            );
                          }}
                        >
                          {order._id || order.id}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Avatar sx={{ mr: 1, width: 32, height: 32 }}>
                            {order.shippingAddress?.fullName?.[0] ||
                              (typeof order.user === "object"
                                ? order.user?.name?.[0]
                                : "U")}
                          </Avatar>
                          <Box>
                            <Typography variant="body2">
                              {order.shippingAddress?.fullName ||
                                (typeof order.user === "object"
                                  ? order.user?.name
                                  : order.user) ||
                                "Unknown"}
                            </Typography>
                            {/* Nếu muốn hiển thị thêm email, cần fetch user info theo ID hoặc lấy order.user.email nếu có */}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString()
                          : ""}
                      </TableCell>
                      <TableCell>{order.items?.length || 0}</TableCell>
                      <TableCell>
                        {formatCurrency(order.total || order.totalAmount || 0)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.status}
                          size="small"
                          color={getStatusColor(order.status) as any}
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Top Selling Books */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" component="h2">
                Top Selling Books
              </Typography>
              <Button
                variant="text"
                color="primary"
                onClick={() => navigate("/admin/books")}
              >
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Author</TableCell>
                    <TableCell>Sales</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topBooks.map((book) => (
                    <TableRow key={book.bookId} hover>
                      <TableCell>{book.title}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell>{book.sold}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboardPage;
