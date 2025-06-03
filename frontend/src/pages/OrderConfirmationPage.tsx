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
    // Clear cart for successful payments OR when we have a valid order (COD case)
    const shouldClearCart =
      payment?.status === "COMPLETED" || // VNPAY success
      (order && (payment?.status === "PENDING" || !payment)) || // COD or order without payment
      (order && payment?.paymentMethod === "COD"); // Explicit COD check

    if (shouldClearCart) {
      console.log('[Order Confirmation] Clearing cart - Order:', !!order, 'Payment status:', payment?.status, 'Payment method:', payment?.paymentMethod);
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

  // Check payment status - handle COD orders as successful
  const paymentStatus = payment?.status || "PENDING";
  const isCODOrder = payment?.paymentMethod === "COD" || (!payment && order);
  const isPaymentSuccessful = paymentStatus === "COMPLETED" || isCODOrder;
  const isPaymentFailed = paymentStatus === "FAILED";
  const isPaymentPending = paymentStatus === "PENDING" && !isCODOrder;

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
                <CheckCircleOutlineIcon
                  color="success"
                  fontSize="large"
                  sx={{ fontSize: 60, mb: 2 }}
                />
                <Typography variant="h4" gutterBottom>
                  {isCODOrder ? "Đặt hàng thành công!" : "Thanh toán thành công!"}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đã được xác nhận và
                  đang được xử lý.
                  {isCODOrder && " Bạn sẽ thanh toán khi nhận hàng."}
                </Typography>
              </>
            ) : isPaymentFailed ? (
              <>
                <Box sx={{ color: "error.main", fontSize: 60, mb: 2 }}>✕</Box>
                <Typography variant="h4" gutterBottom>
                  Thanh toán thất bại
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại
                  hoặc chọn phương thức thanh toán khác.
                </Typography>
              </>
            ) : (
              <>
                <Box sx={{ color: "warning.main", fontSize: 60, mb: 2 }}>
                  ⌛
                </Box>
                <Typography variant="h4" gutterBottom>
                  Đang xử lý thanh toán
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Thanh toán của bạn đang được xử lý. Vui lòng chờ trong giây
                  lát.
                </Typography>
              </>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ my: 3 }}>
            <Typography variant="h6" gutterBottom>
              Thông tin đơn hàng
            </Typography>

            <Stack spacing={2}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body1" color="text.secondary">
                  Mã đơn hàng:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {orderId}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body1" color="text.secondary">
                  Ngày đặt hàng:
                </Typography>
                <Typography variant="body1">{formatDate(orderDate)}</Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body1" color="text.secondary">
                  Phương thức thanh toán:
                </Typography>
                <Typography variant="body1">
                  {payment?.paymentMethod === "VNPAY"
                    ? "VNPAY"
                    : payment?.paymentMethod === "COD" || isCODOrder
                    ? "Thanh toán khi nhận hàng (COD)"
                    : "Thẻ ngân hàng"}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body1" color="text.secondary">
                  Trạng thái:
                </Typography>
                <Typography
                  variant="body1"
                  color={
                    isPaymentSuccessful
                      ? "success.main"
                      : isPaymentFailed
                      ? "error.main"
                      : "warning.main"
                  }
                  fontWeight="bold"
                >
                  {isPaymentSuccessful
                    ? isCODOrder
                      ? "Đặt hàng thành công - COD"
                      : "Thanh toán thành công"
                    : isPaymentFailed
                    ? "Thanh toán thất bại"
                    : "Đang xử lý"}
                </Typography>
              </Box>

              <Divider />

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="h6">Tổng thanh toán:</Typography>
                <Typography variant="h6" color="primary">
                  {formatCurrency(totalAmount)}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 2,
              flexWrap: "wrap",
              mt: 4,
            }}
          >
            <Button
              variant="contained"
              color="primary"
              component={RouterLink}
              to="/books"
              startIcon={<ShoppingBagIcon />}
              onClick={() => {
                // Reset checkout store when user manually navigates away
                resetCheckout();
              }}
            >
              Tiếp tục mua sắm
            </Button>

            <Button
              variant="outlined"
              component={RouterLink}
              to="/"
              startIcon={<HomeIcon />}
              onClick={() => {
                // Reset checkout store when user manually navigates away
                resetCheckout();
              }}
            >
              Về trang chủ
            </Button>
          </Box>
        </Paper>
      </Container>
    </MainLayout>
  );
};

export default OrderConfirmationPage;
