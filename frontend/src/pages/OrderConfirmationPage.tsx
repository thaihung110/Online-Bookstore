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
import MainLayout from "../components/layouts/MainLayout";
import { useCheckoutStore } from "../store/checkoutStore";
import { useCartStore } from "../store/cartStore";
import { formatCurrency, formatDate } from "../utils/format";
import { getPayment } from "../api/payments";

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

  // Check for payment ID in URL query params (for VNPAY redirects)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const paymentId = searchParams.get("paymentId");

    const fetchPaymentStatus = async () => {
      if (paymentId) {
        try {
          setIsLoading(true);
          setError(null);
          await getPaymentFromStore(paymentId);
          setIsLoading(false);
        } catch (err) {
          setIsLoading(false);
          setError("Không thể tải thông tin thanh toán. Vui lòng thử lại sau.");
          console.error("Error fetching payment:", err);
        }
      }
    };

    if (paymentId) {
      fetchPaymentStatus();
    }
  }, [location, getPaymentFromStore]);

  // Xóa giỏ hàng khi đơn hàng đã hoàn thành
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

  // Tạo ID đơn hàng giả lập nếu chưa có
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
              Đang tải thông tin thanh toán...
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
                    ? "🎉 Đặt hàng thành công!"
                    : isOrderReceived
                    ? "🎉 Số tiền của bạn đã được thanh toán!"
                    : isVNPaySuccessful
                    ? "🎉 Thanh toán thành công!"
                    : "🎉 Đặt hàng thành công!"}
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
                    ? "Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đã được xác nhận và đang được xử lý. Bạn sẽ thanh toán khi nhận hàng."
                    : isOrderReceived
                    ? "Cảm ơn bạn đã thanh toán. Đơn hàng của bạn đã được xác nhận và đang được chuẩn bị giao hàng."
                    : isVNPaySuccessful
                    ? "Cảm ơn bạn đã thanh toán qua VNPay. Đơn hàng của bạn đã được xác nhận và đang được xử lý."
                    : "Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đã được xác nhận và đang được xử lý."}
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
                  Thanh toán thất bại
                </Typography>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ maxWidth: 600, mx: "auto" }}
                >
                  Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại
                  hoặc chọn phương thức thanh toán khác.
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
                  Đang xử lý thanh toán
                </Typography>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ maxWidth: 600, mx: "auto" }}
                >
                  Thanh toán của bạn đang được xử lý. Vui lòng chờ trong giây
                  lát.
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
              📋 Thông tin đơn hàng
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
                    Mã đơn hàng:
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
                    Ngày đặt hàng:
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
                    Phương thức thanh toán:
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
                        ? "Thanh toán khi nhận hàng (COD)"
                        : "Thẻ ngân hàng"}
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
                    Trạng thái:
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
                        ? "✅ Đặt hàng thành công - COD"
                        : isOrderReceived
                        ? "✅ Đơn hàng đã được thanh toán"
                        : isVNPaySuccessful
                        ? "✅ Thanh toán thành công - VNPAY"
                        : "✅ Đặt hàng thành công"
                      : isPaymentFailed
                      ? "❌ Thanh toán thất bại"
                      : "⏳ Đang xử lý"}
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
                    💰 Tổng thanh toán:
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
            <Button
              variant="contained"
              size="large"
              component={RouterLink}
              to="/books"
              startIcon={<ShoppingBagIcon />}
              onClick={() => {
                // Reset checkout store when user manually navigates away
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
              🛍️ Tiếp tục mua sắm
            </Button>

            <Button
              variant="outlined"
              size="large"
              component={RouterLink}
              to="/"
              startIcon={<HomeIcon />}
              onClick={() => {
                // Reset checkout store when user manually navigates away
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
              🏠 Về trang chủ
            </Button>

            {isPaymentSuccessful && (
              <Button
                variant="contained"
                size="large"
                sx={{
                  px: 4,
                  py: 1.5,
                  background: "linear-gradient(45deg, #ff9800, #ffb74d)",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  borderRadius: "25px",
                  boxShadow: "0 4px 15px rgba(255, 152, 0, 0.3)",
                  "&:hover": {
                    background: "linear-gradient(45deg, #f57c00, #ff9800)",
                    boxShadow: "0 6px 20px rgba(255, 152, 0, 0.4)",
                    transform: "translateY(-2px)",
                  },
                }}
                onClick={() => {
                  // TODO: Implement order tracking
                  alert(
                    `Theo dõi đơn hàng #${orderId.slice(-8).toUpperCase()}`
                  );
                }}
              >
                📦 Theo dõi đơn hàng
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    </MainLayout>
  );
};

export default OrderConfirmationPage;
