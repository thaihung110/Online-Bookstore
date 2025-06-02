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

// Mock data for dashboard - replace with API calls in the future
const STATS_DATA = {
  newOrders: 24,
  totalRevenue: 16854.5,
  totalProducts: 412,
  newUsers: 35,
};

// Mock data for sales chart - replace with API calls in the future
const SALES_DATA = [
  { name: "Jan", sales: 4000 },
  { name: "Feb", sales: 3000 },
  { name: "Mar", sales: 5000 },
  { name: "Apr", sales: 4500 },
  { name: "May", sales: 6000 },
  { name: "Jun", sales: 5500 },
  { name: "Jul", sales: 7000 },
  { name: "Aug", sales: 8000 },
  { name: "Sep", sales: 7500 },
  { name: "Oct", sales: 9000 },
  { name: "Nov", sales: 10000 },
  { name: "Dec", sales: 12000 },
];

// Mock data for top selling books
const TOP_BOOKS_DATA = [
  { name: "To Kill a Mockingbird", sales: 150 },
  { name: "1984", sales: 120 },
  { name: "Pride and Prejudice", sales: 100 },
  { name: "The Great Gatsby", sales: 90 },
  { name: "The Catcher in the Rye", sales: 80 },
];

// Mock data for order status
const ORDER_STATUS_DATA = [
  { name: "Pending", value: 15, color: "#ff9800" },
  { name: "Processing", value: 25, color: "#2196f3" },
  { name: "Shipped", value: 35, color: "#673ab7" },
  { name: "Delivered", value: 45, color: "#4caf50" },
  { name: "Cancelled", value: 10, color: "#f44336" },
];

// Mock data for dashboard
const MOCK_STATS = {
  totalOrders: 256,
  totalRevenue: 15467.89,
  totalBooks: 532,
  totalUsers: 1024,
  orderGrowth: 12.5,
  revenueGrowth: 8.3,
  bookGrowth: 4.2,
  userGrowth: 15.8,
};

// Mock recent orders
const MOCK_RECENT_ORDERS = [
  {
    id: "ORD-001",
    customer: {
      name: "John Doe",
      email: "johndoe@example.com",
      avatar: "https://mui.com/static/images/avatar/1.jpg",
    },
    date: new Date(2023, 5, 1),
    items: 3,
    total: 89.97,
    status: "Delivered",
  },
  {
    id: "ORD-002",
    customer: {
      name: "Jane Smith",
      email: "janesmith@example.com",
      avatar: "https://mui.com/static/images/avatar/2.jpg",
    },
    date: new Date(2023, 5, 3),
    items: 1,
    total: 24.99,
    status: "Processing",
  },
  {
    id: "ORD-003",
    customer: {
      name: "Robert Johnson",
      email: "robertj@example.com",
      avatar: "https://mui.com/static/images/avatar/3.jpg",
    },
    date: new Date(2023, 5, 5),
    items: 5,
    total: 129.95,
    status: "Shipped",
  },
  {
    id: "ORD-004",
    customer: {
      name: "Emily Davis",
      email: "emilyd@example.com",
      avatar: "https://mui.com/static/images/avatar/4.jpg",
    },
    date: new Date(2023, 5, 7),
    items: 2,
    total: 54.98,
    status: "Pending",
  },
  {
    id: "ORD-005",
    customer: {
      name: "Michael Wilson",
      email: "michaelw@example.com",
      avatar: "https://mui.com/static/images/avatar/5.jpg",
    },
    date: new Date(2023, 5, 9),
    items: 4,
    total: 109.96,
    status: "Delivered",
  },
];

// Mock top selling books
const MOCK_TOP_BOOKS = [
  {
    _id: "1",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    sales: 45,
    stock: 23,
    price: 12.99,
  },
  {
    _id: "2",
    title: "1984",
    author: "George Orwell",
    sales: 38,
    stock: 15,
    price: 10.99,
  },
  {
    _id: "3",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    sales: 32,
    stock: 8,
    price: 9.99,
  },
  {
    _id: "4",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    sales: 29,
    stock: 19,
    price: 8.99,
  },
  {
    _id: "5",
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    sales: 26,
    stock: 12,
    price: 11.99,
  },
];

const AdminDashboardPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
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
            value={MOCK_STATS.totalOrders}
            icon={<OrderIcon />}
            color="#4A6CF7"
            change={{
              value: MOCK_STATS.orderGrowth,
              label: "this month",
              positive: true,
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Revenue"
            value={formatCurrency(MOCK_STATS.totalRevenue)}
            icon={<RevenueIcon />}
            color="#6A4CF7"
            change={{
              value: MOCK_STATS.revenueGrowth,
              label: "this month",
              positive: true,
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Books"
            value={MOCK_STATS.totalBooks}
            icon={<BookIcon />}
            color="#4CAF50"
            change={{
              value: MOCK_STATS.bookGrowth,
              label: "this month",
              positive: true,
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Users"
            value={MOCK_STATS.totalUsers}
            icon={<UserIcon />}
            color="#F7A74A"
            change={{
              value: MOCK_STATS.userGrowth,
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
                  {MOCK_RECENT_ORDERS.map((order) => (
                    <TableRow key={order.id} hover>
                      <TableCell>
                        <Link
                          component="button"
                          variant="body2"
                          color="primary"
                          onClick={() => {
                            // Implement when order details is available
                            console.log(`Navigate to order ${order.id}`);
                          }}
                        >
                          {order.id}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Avatar
                            src={order.customer.avatar}
                            alt={order.customer.name}
                            sx={{ mr: 1, width: 32, height: 32 }}
                          />
                          <Box>
                            <Typography variant="body2">
                              {order.customer.name}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ fontSize: "0.8rem" }}
                            >
                              {order.customer.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{formatDate(order.date)}</TableCell>
                      <TableCell>{order.items}</TableCell>
                      <TableCell>{formatCurrency(order.total)}</TableCell>
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
                    <TableCell>Sales</TableCell>
                    <TableCell>Price</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {MOCK_TOP_BOOKS.map((book) => (
                    <TableRow key={book._id} hover>
                      <TableCell>
                        <Link
                          component="button"
                          variant="body2"
                          color="primary"
                          onClick={() => {
                            navigate(`/admin/books/edit/${book._id}`);
                          }}
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textAlign: "left",
                            textOverflow: "ellipsis",
                            width: "100%",
                          }}
                        >
                          {book.title}
                        </Link>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: "0.8rem" }}
                        >
                          {book.author}
                        </Typography>
                      </TableCell>
                      <TableCell>{book.sales}</TableCell>
                      <TableCell>{formatCurrency(book.price)}</TableCell>
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
