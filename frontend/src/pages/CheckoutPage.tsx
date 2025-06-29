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

const steps = ["Shipping Address", "Payment Method", "Order Confirmation"];

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

  // Check if cart is empty
  useEffect(() => {
    const cartItems = getCartItems();
    if (cartItems.length === 0) {
      navigate("/cart");
    }
  }, [getCartItems, navigate]);

  // Handle proceed to next step
  const handleNext = async () => {
    // Check required values before proceeding to checkout
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
      // Handle payment when reaching final step
      const result = await processCheckoutPayment(
        placeOrder,
        createPayment,
        (id) => processPayment(id),
        paymentMethod
      );

      if (!result.success) {
        setSnackbar({
          open: true,
          message: result.error || "An error occurred while processing payment",
          severity: "error",
        });
        return;
      }

      // If need to redirect to payment gateway (VNPAY)
      if (result.redirectUrl) {
        // Redirect to VNPay in same tab
        window.location.href = result.redirectUrl;
        return;
      }

      // If payment successful, navigate to confirmation page
      navigate("/order-confirmation");
    } else {
      // Proceed to next step
      setActiveStep(activeStep + 1);
    }
  };

  // Handle go back to previous step
  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  // Handle close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Typography variant="h4" gutterBottom align="center">
            Checkout
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
                  Back
                </Button>

                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  disabled={isLoading}
                >
                  {activeStep === steps.length - 1 ? "Pay Now" : "Next"}
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
