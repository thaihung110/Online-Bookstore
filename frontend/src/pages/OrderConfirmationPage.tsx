import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Divider,
  Stack,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HomeIcon from "@mui/icons-material/Home";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import ReceiptIcon from "@mui/icons-material/Receipt";
import RefreshIcon from "@mui/icons-material/Refresh";
import MainLayout from "../components/layouts/MainLayout";
import { useCheckoutStore } from "../store/checkoutStore";
import { useCartStore } from "../store/cartStore";
import { formatCurrency, formatDate } from "../utils/format";
import { getPayment, getPaymentByOrderId } from "../api/payments";

const OrderConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    order,
    payment,
    reset: resetCheckout,
    getPayment: getPaymentFromStore,
  } = useCheckoutStore();
  const { clearCart } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle VNPAY callback and save orderId to localStorage
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);

    // Check if this is a VNPAY callback (has vnp_ResponseCode)
    const vnpResponseCode = searchParams.get("vnp_ResponseCode");
    const vnpTxnRef = searchParams.get("vnp_TxnRef"); // This is the payment ID
    const vnpOrderInfo = searchParams.get("vnp_OrderInfo");

    if (vnpResponseCode && vnpTxnRef) {
      console.log("[VNPAY Callback] Processing VNPAY callback");
      console.log("[VNPAY Callback] Response Code:", vnpResponseCode);
      console.log("[VNPAY Callback] Transaction Ref:", vnpTxnRef);
      console.log("[VNPAY Callback] Order Info:", vnpOrderInfo);

      // Extract orderId from order info if available
      if (vnpOrderInfo) {
        const orderIdMatch = vnpOrderInfo.match(/#([a-f0-9]{24})/);
        if (orderIdMatch) {
          const extractedOrderId = orderIdMatch[1];
          console.log("[VNPAY Callback] Extracted orderId:", extractedOrderId);

          // Save orderId to localStorage for persistence
          localStorage.setItem("completedOrderId", extractedOrderId);
          localStorage.setItem(
            "completedOrderTimestamp",
            Date.now().toString()
          );
        }
      }

      // Fetch payment data using payment ID (vnp_TxnRef)
      setIsLoading(true);
      getPaymentFromStore(vnpTxnRef)
        .then(() => {
          console.log("[VNPAY Callback] Payment data fetched successfully");
        })
        .catch((err) => {
          setError(
            "Unable to load payment information. Please try again later."
          );
          console.error("[VNPAY Callback] Error fetching payment:", err);
        })
        .finally(() => setIsLoading(false));

      return; // Don't run the regular payment polling logic
    }
  }, [location, getPaymentFromStore]);

  // Load order from localStorage if no current order/payment data
  useEffect(() => {
    const completedOrderId = localStorage.getItem("completedOrderId");
    const completedOrderTimestamp = localStorage.getItem(
      "completedOrderTimestamp"
    );

    // Only load from localStorage if we don't have current data and timestamp is recent (within 1 hour)
    if (completedOrderId && completedOrderTimestamp && !order && !payment) {
      const timestamp = parseInt(completedOrderTimestamp);
      const oneHour = 60 * 60 * 1000;

      if (Date.now() - timestamp < oneHour) {
        console.log(
          "[Order Persistence] Loading order from localStorage:",
          completedOrderId
        );
        setIsLoading(true);

        // Fetch order and payment data
        Promise.all([
          useCheckoutStore
            .getState()
            .getOrder(completedOrderId)
            .catch(() => null),
          getPaymentByOrderId(completedOrderId)
            .then((payment: any) => {
              if (payment) {
                return getPaymentFromStore(payment.id);
              }
              return null;
            })
            .catch(() => null),
        ])
          .then(() => {
            console.log("[Order Persistence] Order and payment data loaded");
          })
          .catch((err) => {
            console.error(
              "[Order Persistence] Error loading persisted order:",
              err
            );
            // Clear invalid localStorage data
            localStorage.removeItem("completedOrderId");
            localStorage.removeItem("completedOrderTimestamp");
          })
          .finally(() => setIsLoading(false));
      } else {
        // Clear expired localStorage data
        localStorage.removeItem("completedOrderId");
        localStorage.removeItem("completedOrderTimestamp");
      }
    }
  }, [order, payment, getPaymentFromStore]);

  // Check for payment ID in URL query params (for VNPAY redirects) with polling
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const paymentId = searchParams.get("paymentId");

    if (!paymentId) return;

    let pollInterval: NodeJS.Timeout;

    const fetchPaymentStatus = async () => {
      try {
        setError(null);
        await getPaymentFromStore(paymentId);
      } catch (err) {
        setError("Unable to load payment information. Please try again later.");
        console.error("Error fetching payment:", err);
      }
    };

    // Initial fetch
    setIsLoading(true);
    fetchPaymentStatus().then(() => setIsLoading(false));

    // Start polling if payment is still pending
    const startPolling = () => {
      pollInterval = setInterval(async () => {
        console.log("[Payment Polling] Checking payment status...");
        await fetchPaymentStatus();

        // Check current payment status from store
        const currentPayment = useCheckoutStore.getState().payment;
        const currentOrder = useCheckoutStore.getState().order;

        // Stop polling if payment is completed or failed
        if (
          currentPayment?.status === "COMPLETED" ||
          currentPayment?.status === "FAILED" ||
          currentOrder?.status === "RECEIVED"
        ) {
          console.log(
            "[Payment Polling] Payment completed or failed, stopping polling"
          );
          clearInterval(pollInterval);
        }
      }, 3000); // Poll every 3 seconds
    };

    // Start polling after initial fetch
    const startPollingTimer = setTimeout(() => {
      const currentPayment = useCheckoutStore.getState().payment;
      const currentOrder = useCheckoutStore.getState().order;

      // Only start polling if payment is still pending
      if (
        currentPayment?.status === "PENDING" &&
        currentOrder?.status !== "RECEIVED"
      ) {
        console.log("[Payment Polling] Starting payment status polling...");
        startPolling();
      }
    }, 2000); // Wait 2 seconds after initial fetch

    // Cleanup
    return () => {
      if (pollInterval) {
        console.log("[Payment Polling] Cleaning up polling interval");
        clearInterval(pollInterval);
      }
      if (startPollingTimer) {
        clearTimeout(startPollingTimer);
      }
    };
  }, [location, getPaymentFromStore]);

  // Clear cart when order is completed and save order to localStorage
  useEffect(() => {
    // Clear cart for successful payments OR when we have a valid order (CASH case)
    const shouldClearCart =
      payment?.status === "COMPLETED" || // VNPAY success
      (order && (payment?.status === "PENDING" || !payment)) || // CASH or order without payment
      (order && payment?.paymentMethod === "COD"); // Explicit COD check

    if (shouldClearCart) {
      console.log(
        "[Order Confirmation] Clearing cart - Order:",
        !!order,
        "Payment status:",
        payment?.status,
        "Payment method:",
        payment?.paymentMethod
      );
      clearCart();

      // Save successful order to localStorage for persistence
      if (order?._id) {
        localStorage.setItem("completedOrderId", order._id);
        localStorage.setItem("completedOrderTimestamp", Date.now().toString());
        console.log(
          "[Order Confirmation] Saved order to localStorage:",
          order._id
        );
      }
    }

    // Cleanup khi unmount - delay reset to allow user to stay on success page
    return () => {
      // Don't immediately reset checkout store to preserve order data for success page
      // Users can manually navigate away using the buttons provided
      // resetCheckout();
    };
  }, [clearCart, resetCheckout, payment, order]);

  // Only redirect if we're sure there's no order data and no payment info
  // Remove automatic redirect to let users stay on success page
  // useEffect(() => {
  //   if (!order && !payment && !location.search) {
  //     navigate("/");
  //   }
  // }, [order, payment, navigate, location.search]);

  // Create fallback order ID if not available
  const orderId =
    order?._id ||
    payment?.orderId ||
    `ORD-${Date.now().toString().substring(5)}`;
  const orderDate = order?.createdAt || new Date().toISOString();

  // Calculate total amount - backend uses 'total' field (in USD)
  const totalAmount = order?.total || payment?.amount || 0;

  // Check payment status - handle CASH orders as successful
  const paymentStatus = payment?.status || "PENDING";
  const orderStatus = order?.status || "PENDING";
  const isCashOrder = payment?.paymentMethod === "COD" || (!payment && order);

  // Fix VNPAY success detection: Check both payment status and order status
  const isVNPaySuccessful =
    payment?.paymentMethod === "VNPAY" &&
    (paymentStatus === "COMPLETED" || orderStatus === "RECEIVED");
  const isOrderReceived = orderStatus === "RECEIVED";
  const isPaymentSuccessful =
    isVNPaySuccessful || isCashOrder || isOrderReceived;
  const isPaymentFailed = paymentStatus === "FAILED";
  const isPaymentPending =
    paymentStatus === "PENDING" && orderStatus !== "RECEIVED" && !isCashOrder;

  if (isLoading) {
    return (
      <MainLayout>
        <Container maxWidth="md" sx={{ py: 6 }}>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight="50vh"
          >
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 3 }}>
              Loading payment information...
            </Typography>
          </Box>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, position: "relative" }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ textAlign: "center", mb: 4 }}>
            {isPaymentSuccessful ? (
              <>
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    mx: "auto",
                    mb: 3,
                    background: "linear-gradient(45deg, #4caf50, #81c784)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    animation: "pulse 2s infinite",
                    "@keyframes pulse": {
                      "0%": { transform: "scale(1)" },
                      "50%": { transform: "scale(1.05)" },
                      "100%": { transform: "scale(1)" },
                    },
                  }}
                >
                  <CheckCircleOutlineIcon
                    sx={{ fontSize: 60, color: "white" }}
                  />
                </Box>
                <Typography
                  variant="h3"
                  gutterBottom
                  sx={{
                    fontWeight: "bold",
                    background: "linear-gradient(45deg, #4caf50, #81c784)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    mb: 2,
                  }}
                >
                  {isCashOrder
                    ? "🎉 Order placed successfully!"
                    : isOrderReceived
                    ? "🎉 Your payment has been processed!"
                    : isVNPaySuccessful
                    ? "🎉 Payment successful!"
                    : "🎉 Order placed successfully!"}
                </Typography>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{
                    maxWidth: 600,
                    mx: "auto",
                    lineHeight: 1.6,
                  }}
                >
                  {isCashOrder
                    ? "Thank you for your order. Your order has been confirmed and is being processed. You will pay upon delivery."
                    : isOrderReceived
                    ? "Thank you for your payment. Your order has been confirmed and is being prepared for shipping."
                    : isVNPaySuccessful
                    ? "Thank you for your payment via VNPay. Your order has been confirmed and is being processed."
                    : "Thank you for your order. Your order has been confirmed and is being processed."}
                </Typography>
              </>
            ) : isPaymentFailed ? (
              <>
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    mx: "auto",
                    mb: 3,
                    background: "linear-gradient(45deg, #f44336, #e57373)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Box sx={{ color: "white", fontSize: 60 }}>❌</Box>
                </Box>
                <Typography
                  variant="h3"
                  gutterBottom
                  sx={{ fontWeight: "bold", color: "error.main" }}
                >
                  Payment Failed
                </Typography>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ maxWidth: 600, mx: "auto" }}
                >
                  An error occurred during payment processing. Please try again
                  or choose a different payment method.
                </Typography>
              </>
            ) : (
              <>
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    mx: "auto",
                    mb: 3,
                    background: "linear-gradient(45deg, #ff9800, #ffb74d)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    animation: "spin 2s linear infinite",
                    "@keyframes spin": {
                      "0%": { transform: "rotate(0deg)" },
                      "100%": { transform: "rotate(360deg)" },
                    },
                  }}
                >
                  <Box sx={{ color: "white", fontSize: 60 }}>⏳</Box>
                </Box>
                <Typography
                  variant="h3"
                  gutterBottom
                  sx={{ fontWeight: "bold", color: "warning.main" }}
                >
                  Processing Payment
                </Typography>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ maxWidth: 600, mx: "auto", mb: 3 }}
                >
                  Your payment is being processed. Please wait a moment.
                </Typography>
              </>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ my: 4 }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ fontWeight: "bold", mb: 3 }}
            >
              📋 Order Information
            </Typography>

            <Paper
              elevation={2}
              sx={{
                p: 3,
                background: "linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)",
              }}
            >
              <Stack spacing={3}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ fontWeight: 500 }}
                  >
                    Order ID:
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    sx={{
                      background: "linear-gradient(45deg, #2196f3, #21cbf3)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      fontSize: "1.1rem",
                    }}
                  >
                    #{orderId.slice(-8).toUpperCase()}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ fontWeight: 500 }}
                  >
                    Order Date:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDate(orderDate)}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ fontWeight: 500 }}
                  >
                    Payment Method:
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {payment?.paymentMethod === "VNPAY"
                      ? "💳"
                      : payment?.paymentMethod === "COD"
                      ? "💵"
                      : "🏦"}
                    <Typography variant="body1" fontWeight="medium">
                      {payment?.paymentMethod === "VNPAY"
                        ? "VNPAY"
                        : payment?.paymentMethod === "COD"
                        ? "Cash on Delivery (COD)"
                        : "Bank Card"}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ fontWeight: 500 }}
                  >
                    Status:
                  </Typography>
                  <Box
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: "20px",
                      background: isPaymentSuccessful
                        ? "linear-gradient(45deg, #4caf50, #81c784)"
                        : isPaymentFailed
                        ? "linear-gradient(45deg, #f44336, #e57373)"
                        : "linear-gradient(45deg, #ff9800, #ffb74d)",
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "0.9rem",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    }}
                  >
                    {isPaymentSuccessful
                      ? isCashOrder
                        ? "✅ Order Successful - COD"
                        : isOrderReceived
                        ? "✅ Order Paid"
                        : isVNPaySuccessful
                        ? "✅ Payment Successful - VNPAY"
                        : "✅ Order Successful"
                      : isPaymentFailed
                      ? "❌ Payment Failed"
                      : "⏳ Processing"}
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    💰 Total Payment:
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: "bold",
                      background: "linear-gradient(45deg, #4caf50, #81c784)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {formatCurrency(totalAmount)}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 3,
              flexWrap: "wrap",
              mt: 5,
            }}
          >
            {/* Show refresh button for pending payments */}
            {isPaymentPending && (
              <Button
                variant="outlined"
                size="large"
                startIcon={<RefreshIcon />}
                onClick={async () => {
                  const searchParams = new URLSearchParams(location.search);
                  const paymentId = searchParams.get("paymentId");
                  if (paymentId) {
                    setIsLoading(true);
                    try {
                      await getPaymentFromStore(paymentId);
                      console.log("[Manual Refresh] Payment status refreshed");
                    } catch (err) {
                      console.error("Error refreshing payment:", err);
                    } finally {
                      setIsLoading(false);
                    }
                  }
                }}
                disabled={isLoading}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontWeight: "bold",
                  fontSize: "1rem",
                  borderRadius: "25px",
                  borderWidth: 2,
                  color: "#ff9800",
                  borderColor: "#ff9800",
                  "&:hover": {
                    background: "linear-gradient(45deg, #ff9800, #ffb74d)",
                    color: "white",
                    borderColor: "#ff9800",
                  },
                }}
              >
                Refresh Status
              </Button>
            )}

            <Button
              variant="contained"
              size="large"
              component={RouterLink}
              to="/books"
              startIcon={<ShoppingBagIcon />}
              onClick={() => {
                // Clear localStorage and reset checkout store when user manually navigates away
                localStorage.removeItem("completedOrderId");
                localStorage.removeItem("completedOrderTimestamp");
                resetCheckout();
              }}
              sx={{
                px: 4,
                py: 1.5,
                background: "linear-gradient(45deg, #2196f3, #21cbf3)",
                fontWeight: "bold",
                fontSize: "1rem",
                borderRadius: "25px",
                boxShadow: "0 4px 15px rgba(33, 150, 243, 0.3)",
                "&:hover": {
                  background: "linear-gradient(45deg, #1976d2, #1e88e5)",
                  boxShadow: "0 6px 20px rgba(33, 150, 243, 0.4)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              🛍️ Continue Shopping
            </Button>

            <Button
              variant="outlined"
              size="large"
              component={RouterLink}
              to="/"
              startIcon={<HomeIcon />}
              onClick={() => {
                // Clear localStorage and reset checkout store when user manually navigates away
                localStorage.removeItem("completedOrderId");
                localStorage.removeItem("completedOrderTimestamp");
                resetCheckout();
              }}
              sx={{
                px: 4,
                py: 1.5,
                fontWeight: "bold",
                fontSize: "1rem",
                borderRadius: "25px",
                borderWidth: 2,
                color: "#4caf50",
                borderColor: "#4caf50",
                "&:hover": {
                  background: "linear-gradient(45deg, #4caf50, #81c784)",
                  color: "white",
                  borderColor: "#4caf50",
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 15px rgba(76, 175, 80, 0.3)",
                },
              }}
            >
              🏠 Back to Home
            </Button>
          </Box>
        </Paper>
      </Container>
    </MainLayout>
  );
};

export default OrderConfirmationPage;
