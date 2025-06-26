import React, { useState } from "react";
import {
  Container,
  Typography,
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
  Checkbox,
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
import { vndToUsd } from "../utils/currency";
import CartValidationAlert from "../components/cart/CartValidationAlert";

const CartItemRow: React.FC<{
  item: CartItem;
}> = ({ item }) => {
  const { updateItemQuantity, updateItemSelection, removeItem, isLoading } =
    useCartStore();

  // Lấy id đúng cho book (sau khi transform, chỉ có id)
  const bookId = item.book.id;

  // State tạm cho số lượng nhập vào (kiểu string để cho phép rỗng)
  const [inputQty, setInputQty] = useState<string>(item.quantity.toString());

  // Khi số lượng trong store thay đổi (do update từ backend), đồng bộ lại input
  React.useEffect(() => {
    console.log(
      "CartItemRow: item.quantity changed to:",
      item.quantity,
      "for book:",
      bookId
    );
    console.log("CartItemRow: updating inputQty to:", item.quantity.toString());
    setInputQty(item.quantity.toString());
  }, [item.quantity, bookId]);

  // Debug: Log when component re-renders
  console.log(
    "CartItemRow render - bookId:",
    bookId,
    "quantity:",
    item.quantity,
    "inputQty:",
    inputQty
  );

  const handleUpdateQuantity = (qty: number) => {
    if (qty > 0 && qty <= (item.book.stock || 0)) {
      updateItemQuantity(bookId, qty);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Cho phép rỗng để user dùng backspace
    if (/^\d*$/.test(val)) {
      setInputQty(val);
    }
  };

  const handleInputBlur = () => {
    const qty = parseInt(inputQty, 10);
    // Nếu input rỗng hoặc không hợp lệ, reset về số lượng cũ
    if (!inputQty || isNaN(qty) || qty < 1 || qty > (item.book.stock || 0)) {
      setInputQty(item.quantity.toString());
      return;
    }
    if (qty !== item.quantity) {
      handleUpdateQuantity(qty);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const val = (e.target as HTMLInputElement).value;
      const qty = parseInt(val, 10);
      if (!val || isNaN(qty) || qty < 1 || qty > (item.book.stock || 0)) {
        setInputQty(item.quantity.toString());
        return;
      }
      if (qty !== item.quantity) {
        handleUpdateQuantity(qty);
      }
    }
  };

  const handleIncrement = () => {
    console.log("CartItemRow: handleIncrement clicked");
    console.log("CartItemRow: bookId:", bookId);
    console.log("CartItemRow: current quantity:", item.quantity);
    console.log("CartItemRow: stock:", item.book.stock);
    console.log(
      "CartItemRow: can increment?",
      item.quantity < (item.book.stock || 0)
    );

    if (item.quantity < (item.book.stock || 0)) {
      console.log(
        "CartItemRow: calling updateItemQuantity with:",
        bookId,
        item.quantity + 1
      );
      updateItemQuantity(bookId, item.quantity + 1);
    } else {
      console.log("CartItemRow: cannot increment - at max stock");
    }
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateItemQuantity(bookId, item.quantity - 1);
    }
  };

  const handleRemove = () => {
    console.log("CartItemRow remove bookId:", bookId);
    removeItem(bookId);
  };

  const handleSelectionChange = (checked: boolean) => {
    console.log(
      "CartItemRow selection change bookId:",
      bookId,
      "checked:",
      checked
    );
    updateItemSelection(bookId, checked);
  };

  // Placeholder image if no cover is available
  const coverImage = item.book.coverImage || "/placeholder-book.jpg";

  // Chuyển đổi giá sang USD
  const priceUsd = vndToUsd(item.priceAtAdd);
  const itemTotal = vndToUsd(item.priceAtAdd * item.quantity);

  return (
    <Paper sx={{ p: 2, mb: 2, display: "flex", width: "100%" }}>
      <Checkbox
        checked={item.isTicked}
        onChange={(e) => handleSelectionChange(e.target.checked)}
        sx={{ mr: 1, alignSelf: "flex-start" }}
        disabled={isLoading}
      />
      <Box sx={{ width: 80, height: 120, mr: 2, flexShrink: 0 }}>
        <CardMedia
          component="img"
          image={coverImage}
          alt={item.book.title}
          sx={{ width: "100%", height: "100%", objectFit: "contain" }}
          onError={(e) => {
            e.currentTarget.src = "/placeholder-book.jpg";
          }}
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

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Price: ${priceUsd.toFixed(2)}
            </Typography>
            <Typography
              variant="subtitle1"
              color="primary.main"
              fontWeight="bold"
            >
              Total: ${itemTotal.toFixed(2)}
            </Typography>
          </Box>

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
              value={inputQty}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              type="text"
              InputProps={{
                inputProps: {
                  min: 1,
                  max: item.book.stock || 1,
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
              disabled={item.quantity >= (item.book.stock || 0) || isLoading}
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
    cart,
    isLoading,
    error,
    loadCart,
    clearCart,
    updateItemSelection,
    getSelectedItems,
    validateCart,
    getValidationIssues,
    hasValidationIssues,
    isValidating,
  } = useCartStore();

  // Handle Buy Now functionality by updating backend state
  React.useEffect(() => {
    const handleBuyNow = async () => {
      const buyNowId = localStorage.getItem("cart-buynow-id");
      if (buyNowId && cart?.items) {
        try {
          // Update all items to be unselected first, then select only the buy now item
          for (const item of cart.items) {
            const id = item.book.id;
            const shouldBeSelected = id === buyNowId;
            if (item.isTicked !== shouldBeSelected) {
              await updateItemSelection(id, shouldBeSelected);
            }
          }
          localStorage.removeItem("cart-buynow-id");
        } catch (error) {
          console.error("Error handling buy now selection:", error);
        }
      }
    };

    if (cart?.items && !isLoading) {
      handleBuyNow();
    }
  }, [cart?.items, isLoading, updateItemSelection]);

  // Validate cart when it loads or changes
  React.useEffect(() => {
    if (cart?.items && cart.items.length > 0 && !isLoading) {
      validateCart();
    }
  }, [cart?.items, validateCart, isLoading]);

  // Get selected items from backend state
  const selectedCartItems = getSelectedItems();
  const validationIssues = getValidationIssues();

  // Use cart totals calculated by backend (single source of truth)
  const subtotal = cart?.subtotal || 0;
  const shippingCost = cart?.shippingCost || 0;
  const taxAmount = cart?.taxAmount || 0;
  const orderTotal = cart?.total || 0;
  const totalItems = selectedCartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  if (isLoading && !cart?.items.length) {
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

  if (!cart?.items.length) {
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

        <Box display="flex" flexDirection={{ xs: "column", md: "row" }}>
          {/* Cart Items */}
          <Box
            flex={2}
            minWidth={0}
            mr={{ md: 3, xs: 0 }}
            mb={{ xs: 3, md: 0 }}
          >
            <Button
              component={RouterLink}
              to="/books"
              startIcon={<ArrowBackIcon />}
              sx={{ mb: 2 }}
            >
              Continue Shopping
            </Button>

            {/* Cart Validation Alert */}
            <CartValidationAlert
              issues={validationIssues}
              onRefresh={() => validateCart()}
              onFixIssues={() => {
                // Auto-fix issues by updating quantities to available stock
                validationIssues.forEach((issue) => {
                  if (
                    issue.type === "stock" &&
                    issue.currentStock !== undefined
                  ) {
                    // This would need to be implemented to auto-fix quantities
                    console.log(
                      "Auto-fixing stock issue for book:",
                      issue.bookId
                    );
                  }
                });
              }}
            />

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
              {cart?.items.map((item, index) => {
                const id = item.book.id;
                // Use a more unique key that includes the item's position and book ID
                const uniqueKey = `${id}-${index}-${item.quantity}-${item.isTicked}`;
                console.log(
                  "CartPage: Rendering item with key:",
                  uniqueKey,
                  "bookId:",
                  id,
                  "isTicked:",
                  item.isTicked
                );
                return <CartItemRow key={uniqueKey} item={item} />;
              })}
            </Box>

            <Box
              sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}
            >
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={clearCart}
                disabled={isLoading || !cart?.items.length}
              >
                Clear Cart
              </Button>
            </Box>
          </Box>

          {/* Order Summary */}
          <Box flex={1} minWidth={0}>
            <Card sx={{ p: 3, position: "sticky", top: 80 }}>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body1">Subtotal</Typography>
                <Typography variant="body1">${subtotal.toFixed(2)}</Typography>
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
                disabled={
                  isLoading ||
                  isValidating ||
                  !cart?.items.length ||
                  selectedCartItems.length === 0 ||
                  (hasValidationIssues() &&
                    validationIssues.some(
                      (issue) =>
                        issue.type === "stock" || issue.type === "unavailable"
                    ))
                }
              >
                Proceed to Checkout
              </Button>
            </Card>
          </Box>
        </Box>
      </Container>
    </MainLayout>
  );
};

export default CartPage;
