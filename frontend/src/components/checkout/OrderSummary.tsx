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

  // Hiển thị địa chỉ định dạng đầy đủ
  const formatAddress = (address: any) => {
    if (!address) return "Chưa có thông tin";

    return `${address.fullName}, ${address.phoneNumber}, ${address.address}, ${
      address.ward
    }, ${address.district}, ${address.city}${
      address.zipCode ? ", " + address.zipCode : ""
    }`;
  };

  // Hiển thị thông tin phương thức thanh toán
  const renderPaymentMethodInfo = () => {
    if (!paymentMethod) return "Chưa chọn phương thức thanh toán";

    if (paymentMethod === "VNPAY") {
      return "Thanh toán qua cổng VNPAY";
    }

    if (paymentMethod === "COD") {
      return "Thanh toán khi nhận hàng (COD)";
    }

    return "Chưa có thông tin thanh toán";
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Xác nhận đơn hàng
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
              <Typography variant="subtitle1">Địa chỉ giao hàng</Typography>
            </Stack>
            <Typography variant="body2" sx={{ ml: 4 }}>
              {shippingAddress
                ? formatAddress(shippingAddress)
                : "Chưa có thông tin"}
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
                <Typography variant="subtitle1">Địa chỉ thanh toán</Typography>
              </Stack>
              <Typography variant="body2" sx={{ ml: 4 }}>
                {billingAddress
                  ? formatAddress(billingAddress)
                  : "Chưa có thông tin"}
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
              <Typography variant="subtitle1">
                Phương thức thanh toán
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ ml: 4 }}>
              {renderPaymentMethodInfo()}
            </Typography>
          </Paper>
        </Box>

        <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 35%" } }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Đơn hàng của bạn ({totalQuantity} sản phẩm)
            </Typography>

            <List disablePadding>
              {selectedItems.map((item: CartItem, idx: number) => (
                <ListItem key={item.book.id + "-" + idx} sx={{ py: 1, px: 0 }}>
                  <Avatar
                    src={item.book.coverImage}
                    alt={item.book.title}
                    variant="rounded"
                    sx={{ mr: 2, width: 48, height: 48 }}
                  />
                  <ListItemText
                    primary={item.book.title}
                    secondary={`Số lượng: ${item.quantity}`}
                  />
                  <Typography variant="body2">
                    ${(item.priceAtAdd * item.quantity).toFixed(2)}
                  </Typography>
                </ListItem>
              ))}

              <Divider sx={{ my: 2 }} />

              <ListItem sx={{ py: 1, px: 0 }}>
                <ListItemText primary="Tạm tính" />
                <Typography variant="body1">${subtotal.toFixed(2)}</Typography>
              </ListItem>

              <ListItem sx={{ py: 1, px: 0 }}>
                <ListItemText primary="Phí vận chuyển" />
                <Typography variant="body1">
                  ${shippingCost.toFixed(2)}
                </Typography>
              </ListItem>

              {taxAmount > 0 && (
                <ListItem sx={{ py: 1, px: 0 }}>
                  <ListItemText primary="Thuế (8%)" />
                  <Typography variant="body1">
                    ${taxAmount.toFixed(2)}
                  </Typography>
                </ListItem>
              )}

              <ListItem sx={{ py: 1, px: 0 }}>
                <ListItemText primary="Tổng cộng" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  ${total.toFixed(2)}
                </Typography>
              </ListItem>
            </List>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              <Chip
                label="Đã bao gồm VAT"
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
