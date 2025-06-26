import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Box,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/layouts/MainLayout";
// @ts-ignore
import ShippingAddressForm from "../components/checkout/ShippingAddressForm";
// @ts-ignore
import PaymentMethodSelector from "../components/checkout/PaymentMethodSelector";

// @ts-ignore
import OrderSummary from "../components/checkout/OrderSummary";
import { useCheckoutStore } from "../store/checkoutStore";
import { useCartStore } from "../store/cartStore";
import {
  canProceedToCheckout,
  processCheckoutPayment,
} from "../utils/checkout";

const steps = [
  "Địa chỉ giao hàng",
  "Phương thức thanh toán",
  "Xác nhận đơn hàng",
];

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeStep,
    setActiveStep,
    shippingAddress,
    paymentMethod,
    paymentDetails,
    placeOrder,
    createPayment,
    processPayment,
    isLoading,
    error,
    clearError,
  } = useCheckoutStore();
  const { getCartItems, getTotalPrice } = useCartStore();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info" as "info" | "success" | "error",
  });

  // Kiểm tra giỏ hàng có trống không
  useEffect(() => {
    const cartItems = getCartItems();
    if (cartItems.length === 0) {
      navigate("/cart");
    }
  }, [getCartItems, navigate]);

  // Xử lý chuyển đến bước tiếp theo
  const handleNext = async () => {
    // Kiểm tra giá trị bắt buộc trước khi tiến hành checkout
    if (activeStep === 0 || activeStep === 1) {
      const { canProceed, error } = canProceedToCheckout(
        shippingAddress,
        activeStep === 1 ? paymentMethod : "temp",
        activeStep === 1 ? paymentDetails : {}
      );

      if (!canProceed && error) {
        setSnackbar({
          open: true,
          message: error,
          severity: "error",
        });
        return;
      }
    }

    if (activeStep === steps.length - 1) {
      // Xử lý thanh toán khi đến bước cuối cùng
      const result = await processCheckoutPayment(
        placeOrder,
        createPayment,
        (id) => processPayment(id),
        paymentMethod
      );

      if (!result.success) {
        setSnackbar({
          open: true,
          message: result.error || "Có lỗi xảy ra khi xử lý thanh toán",
          severity: "error",
        });
        return;
      }

      // Nếu cần chuyển hướng đến cổng thanh toán (VNPAY)
      if (result.redirectUrl) {
        // Mở VNPay trong tab mới
        window.open(result.redirectUrl, "_blank", "noopener,noreferrer");
        // Chuyển đến trang xác nhận đơn hàng
        navigate("/order-confirmation");
        return;
      }

      // Nếu thanh toán thành công, chuyển đến trang xác nhận
      navigate("/order-confirmation");
    } else {
      // Chuyển đến bước tiếp theo
      setActiveStep(activeStep + 1);
    }
  };

  // Xử lý quay lại bước trước
  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  // Xử lý đóng snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Typography variant="h4" gutterBottom align="center">
            Thanh toán
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
              {error}
            </Alert>
          )}

          {isLoading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {activeStep === 0 && <ShippingAddressForm />}

              {activeStep === 1 && <PaymentMethodSelector />}

              {activeStep === 2 && <OrderSummary />}

              <Divider sx={{ my: 3 }} />

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}
              >
                <Button
                  color="inherit"
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  sx={{ mr: 1 }}
                >
                  Quay lại
                </Button>

                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  disabled={isLoading}
                >
                  {activeStep === steps.length - 1 ? "Thanh toán" : "Tiếp theo"}
                </Button>
              </Box>
            </Box>
          )}
        </Paper>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </MainLayout>
  );
};

export default CheckoutPage;
