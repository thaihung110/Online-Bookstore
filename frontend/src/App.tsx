import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import BooksPage from "./pages/BooksPage";
import BookDetailPage from "./pages/BookDetailPage";
import CartPage from "./pages/CartPage";
import WishlistPage from "./pages/WishlistPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import { useAuthStore } from "./store/authStore";
import { useCartStore } from "./store/cartStore";
import { useWishlistStore } from "./store/wishlistStore";
import EditProfilePage from "./pages/EditProfilePage";
import TestApiComponent from "./components/TestApiComponent";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import ChatbotWidget from "./components/ChatbotWidget";

// Admin imports
import {
  AdminLoginPage,
  AdminDashboardPage,
  BookManagementPage,
  BookFormPage,
  UserManagementPage,
  UserFormPage,
  OrdersManagementPage,
  PromotionsManagementPage,
} from "./admin/pages";
import AdminProtectedRoute from "./admin/components/layout/AdminProtectedRoute";
import AdminLayout from "./admin/components/layout/AdminLayout";
import { useAdminAuthStore } from "./admin/store/adminAuthStore";

// Create a custom theme inspired by elegant bookstores
const theme = createTheme({
  palette: {
    primary: {
      main: "#4b6584", // Deep navy blue - classic, elegant
      light: "#7a97b9",
      dark: "#2c3e50",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#c44536", // Warm crimson - reminiscent of classic book covers
      light: "#e57373",
      dark: "#8e2a22",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f8f9fa", // Light off-white for paper-like feel
      paper: "#ffffff",
    },
    text: {
      primary: "#2d3436", // Dark charcoal - easier on the eyes for reading
      secondary: "#636e72",
    },
    error: {
      main: "#d32f2f",
    },
    warning: {
      main: "#f39c12",
    },
    info: {
      main: "#3498db",
    },
    success: {
      main: "#2ecc71",
    },
  },
  typography: {
    fontFamily: "'Merriweather', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontFamily: "'Playfair Display', serif",
      fontWeight: 700,
    },
    h2: {
      fontFamily: "'Playfair Display', serif",
      fontWeight: 700,
    },
    h3: {
      fontFamily: "'Playfair Display', serif",
      fontWeight: 600,
    },
    h4: {
      fontFamily: "'Playfair Display', serif",
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
    button: {
      fontWeight: 500,
      textTransform: "none", // More elegant buttons without all-caps
    },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          padding: "8px 16px",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          },
        },
        contained: {
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          transition: "box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        elevation1: {
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
        },
        elevation2: {
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
        },
      },
    },
  },
});

const App: React.FC = () => {
  const { fetchCurrentUser } = useAuthStore();
  const { loadCart } = useCartStore();
  const { loadWishlist } = useWishlistStore();
  const { checkAuth } = useAdminAuthStore();

  useEffect(() => {
    fetchCurrentUser();
    loadCart();
    loadWishlist();
    checkAuth(); // Initialize admin auth check
  }, [fetchCurrentUser, loadCart, loadWishlist, checkAuth]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/books/:id" element={<BookDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/api-test" element={<TestApiComponent />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route
            path="/order-confirmation"
            element={<OrderConfirmationPage />}
          />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route
              path="/dashboard/edit-profile"
              element={<EditProfilePage />}
            />
            <Route path="/wishlist" element={<WishlistPage />} />
            {/* Add more protected routes here */}
          </Route>

          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin/*"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="books" element={<BookManagementPage />} />
            <Route path="books/add" element={<BookFormPage />} />
            <Route path="books/edit/:id" element={<BookFormPage />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="users/add" element={<UserFormPage />} />
            <Route path="users/edit/:id" element={<UserFormPage />} />
            <Route path="orders" element={<OrdersManagementPage />} />
            <Route
              path="promotions"
              element={<PromotionsManagementPage />}
            />
          </Route>

          {/* Redirect any unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <ChatbotWidget />
    </ThemeProvider>
  );
};

export default App;
