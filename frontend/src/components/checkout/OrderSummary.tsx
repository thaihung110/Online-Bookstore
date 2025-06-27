import React from "react";
import {
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Chip,
  Avatar,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PaymentIcon from "@mui/icons-material/Payment";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import { useCheckoutStore } from "../../store/checkoutStore";
import { useCartStore } from "../../store/cartStore";
import { CartItem } from "../../api/cart";
import {
  getProductDisplayData,
  getProductPlaceholder,
} from "../../utils/productDisplayHelper";

const OrderSummary: React.FC = () => {
  const {
    shippingAddress,
    billingAddress,
    useShippingAsBilling,
    paymentMethod,
    getShippingCost,
  } = useCheckoutStore();

  const { cart, getSelectedItems } = useCartStore();

  const selectedItems = getSelectedItems();

  // Use cart totals calculated by backend (single source of truth)
  const subtotal = cart?.subtotal || 0;
  const shippingCost = cart?.shippingCost || 0;
  const taxAmount = cart?.taxAmount || 0;
  const total = cart?.total || 0;
  const totalQuantity = selectedItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  // Display full formatted address
  const formatAddress = (address: any) => {
    if (!address) return "No information available";

    return `${address.fullName}, ${address.phoneNumber}, ${address.address}, ${
      address.ward
    }, ${address.district}, ${address.city}${
      address.zipCode ? ", " + address.zipCode : ""
    }`;
  };

  // Display payment method information
  const renderPaymentMethodInfo = () => {
    if (!paymentMethod) return "No payment method selected";

    if (paymentMethod === "VNPAY") {
      return "Payment via VNPAY gateway";
    }

    if (paymentMethod === "COD") {
      return "Cash on Delivery (COD)";
    }

    return "No payment information available";
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Order Confirmation
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 60%" } }}>
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <LocationOnIcon color="primary" />
              <Typography variant="subtitle1">Shipping Address</Typography>
            </Stack>
            <Typography variant="body2" sx={{ ml: 4 }}>
              {shippingAddress
                ? formatAddress(shippingAddress)
                : "No information available"}
            </Typography>
          </Paper>

          {!useShippingAsBilling && (
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <LocationOnIcon color="primary" />
                <Typography variant="subtitle1">Billing Address</Typography>
              </Stack>
              <Typography variant="body2" sx={{ ml: 4 }}>
                {billingAddress
                  ? formatAddress(billingAddress)
                  : "No information available"}
              </Typography>
            </Paper>
          )}

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 1 }}
            >
              {paymentMethod === "VNPAY" ? (
                <PaymentIcon color="primary" />
              ) : (
                <LocalShippingIcon color="primary" />
              )}
              <Typography variant="subtitle1">Payment Method</Typography>
            </Stack>
            <Typography variant="body2" sx={{ ml: 4 }}>
              {renderPaymentMethodInfo()}
            </Typography>
          </Paper>
        </Box>

        <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 35%" } }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Your Order ({totalQuantity} items)
            </Typography>

            <List disablePadding>
              {selectedItems.map((item: CartItem, idx: number) => {
                const productData = getProductDisplayData(item.product);
                return (
                  <ListItem
                    key={item.product.id + "-" + idx}
                    sx={{ py: 1, px: 0 }}
                  >
                    <Avatar
                      src={
                        productData.coverImage ||
                        getProductPlaceholder(productData.productType)
                      }
                      alt={productData.title}
                      variant="rounded"
                      sx={{ mr: 2, width: 48, height: 48 }}
                    />
                    <ListItemText
                      primary={productData.title}
                      secondary={`Quantity: ${item.quantity}`}
                    />
                    <Typography variant="body2">
                      ${(item.priceAtAdd * item.quantity).toFixed(2)}
                    </Typography>
                  </ListItem>
                );
              })}

              <Divider sx={{ my: 2 }} />

              <ListItem sx={{ py: 1, px: 0 }}>
                <ListItemText primary="Subtotal" />
                <Typography variant="body1">${subtotal.toFixed(2)}</Typography>
              </ListItem>

              <ListItem sx={{ py: 1, px: 0 }}>
                <ListItemText primary="Shipping" />
                <Typography variant="body1">
                  ${shippingCost.toFixed(2)}
                </Typography>
              </ListItem>

              {taxAmount > 0 && (
                <ListItem sx={{ py: 1, px: 0 }}>
                  <ListItemText primary="Tax (8%)" />
                  <Typography variant="body1">
                    ${taxAmount.toFixed(2)}
                  </Typography>
                </ListItem>
              )}

              <ListItem sx={{ py: 1, px: 0 }}>
                <ListItemText primary="Total" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  ${total.toFixed(2)}
                </Typography>
              </ListItem>
            </List>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              <Chip
                label="VAT included"
                color="success"
                size="small"
                variant="outlined"
              />
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default OrderSummary;
