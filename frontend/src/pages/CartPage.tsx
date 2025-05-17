import React from "react";
import {
  Container,
  Typography,
  Grid,
  Box,
  Paper,
  Button,
  Divider,
  IconButton,
  TextField,
  CardMedia,
  Card,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteIcon from "@mui/icons-material/Delete";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import MainLayout from "../components/layouts/MainLayout";
import { useCartStore } from "../store/cartStore";
import { CartItem } from "../api/cart";

const CartItemRow: React.FC<{ item: CartItem }> = ({ item }) => {
  const { updateItemQuantity, removeItem, isLoading } = useCartStore();

  const handleUpdateQuantity = (qty: number) => {
    updateItemQuantity(item.book.id, qty);
  };

  const handleIncrement = () => {
    updateItemQuantity(item.book.id, item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateItemQuantity(item.book.id, item.quantity - 1);
    }
  };

  const handleRemove = () => {
    removeItem(item.book.id);
  };

  // Placeholder image if no cover is available
  const coverImage =
    item.book.coverImage || "https://via.placeholder.com/100x150?text=No+Image";

  return (
    <Paper sx={{ p: 2, mb: 2, display: "flex", width: "100%" }}>
      <Box sx={{ width: 80, height: 120, mr: 2, flexShrink: 0 }}>
        <CardMedia
          component="img"
          image={coverImage}
          alt={item.book.title}
          sx={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography
            component={RouterLink}
            to={`/books/${item.book.id}`}
            variant="subtitle1"
            sx={{
              textDecoration: "none",
              color: "primary.main",
              fontWeight: "medium",
            }}
          >
            {item.book.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            by {item.book.author}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mt: 1,
          }}
        >
          <Typography
            variant="subtitle1"
            color="primary.main"
            fontWeight="bold"
          >
            ${(item.book.price * item.quantity).toFixed(2)}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              size="small"
              onClick={handleRemove}
              color="error"
              sx={{ mr: 1 }}
              disabled={isLoading}
            >
              <DeleteIcon />
            </IconButton>

            <IconButton
              size="small"
              onClick={handleDecrement}
              disabled={item.quantity <= 1 || isLoading}
            >
              <RemoveIcon />
            </IconButton>

            <TextField
              size="small"
              value={item.quantity}
              onChange={(e) => {
                const qty = parseInt(e.target.value, 10);
                if (!isNaN(qty) && qty > 0) {
                  handleUpdateQuantity(qty);
                }
              }}
              InputProps={{
                inputProps: {
                  min: 1,
                  style: { textAlign: "center", width: "30px" },
                },
              }}
              variant="outlined"
              sx={{ mx: 0.5 }}
              disabled={isLoading}
            />

            <IconButton
              size="small"
              onClick={handleIncrement}
              disabled={isLoading}
            >
              <AddIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

const CartPage: React.FC = () => {
  const {
    getCartItems,
    getTotalItems,
    getTotalPrice,
    clearCart,
    isLoading,
    error,
    loadCart,
  } = useCartStore();

  const items = getCartItems();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  // Fixed shipping cost
  const shippingCost = totalPrice > 0 && totalPrice <= 50 ? 5.99 : 0;
  // Tax calculation (e.g., 8%)
  const taxRate = 0.08;
  const taxAmount = totalPrice * taxRate;
  // Total with shipping and tax
  const orderTotal = totalPrice + shippingCost + taxAmount;

  if (isLoading && items.length === 0) {
    return (
      <MainLayout>
        <Container
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
          }}
        >
          <CircularProgress size={50} />
        </Container>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ my: 4 }}>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => loadCart()}>
                RETRY
              </Button>
            }
          >
            Error loading cart: {error}
          </Alert>
        </Container>
      </MainLayout>
    );
  }

  if (items.length === 0) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Shopping Cart
          </Typography>

          <Paper sx={{ p: 4, textAlign: "center", my: 3 }}>
            <ShoppingCartIcon
              sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
            />
            <Typography variant="h5" gutterBottom>
              Your cart is empty
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Looks like you haven't added anything to your cart yet.
            </Typography>
            <Button
              component={RouterLink}
              to="/books"
              variant="contained"
              startIcon={<ArrowBackIcon />}
            >
              Continue Shopping
            </Button>
          </Paper>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Shopping Cart ({totalItems} {totalItems === 1 ? "item" : "items"})
        </Typography>

        <Grid container spacing={3}>
          {/* Cart Items */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Button
              component={RouterLink}
              to="/books"
              startIcon={<ArrowBackIcon />}
              sx={{ mb: 2 }}
            >
              Continue Shopping
            </Button>

            <Box sx={{ position: "relative" }}>
              {isLoading && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    bgcolor: "rgba(255,255,255,0.7)",
                    zIndex: 1,
                  }}
                >
                  <CircularProgress />
                </Box>
              )}
              {items.map((item) => (
                <CartItemRow key={item._id || item.book.id} item={item} />
              ))}
            </Box>

            <Box
              sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}
            >
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={clearCart}
                disabled={isLoading || items.length === 0}
              >
                Clear Cart
              </Button>
            </Box>
          </Grid>

          {/* Order Summary */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ p: 3, position: "sticky", top: 80 }}>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body1">Subtotal</Typography>
                <Typography variant="body1">
                  ${totalPrice.toFixed(2)}
                </Typography>
              </Box>

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body1">Shipping</Typography>
                <Typography variant="body1">
                  {shippingCost === 0 ? "FREE" : `$${shippingCost.toFixed(2)}`}
                </Typography>
              </Box>

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
              >
                <Typography variant="body1">Tax (8%)</Typography>
                <Typography variant="body1">${taxAmount.toFixed(2)}</Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
              >
                <Typography variant="h6">Order Total</Typography>
                <Typography variant="h6">${orderTotal.toFixed(2)}</Typography>
              </Box>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                component={RouterLink}
                to="/checkout"
                disabled={isLoading || items.length === 0}
              >
                Proceed to Checkout
              </Button>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </MainLayout>
  );
};

export default CartPage;
