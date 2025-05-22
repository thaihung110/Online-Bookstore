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
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import { useCheckoutStore } from "../../store/checkoutStore";
import { useCartStore } from "../../store/cartStore";
import { formatCurrency } from "../../utils/format";

const OrderSummary: React.FC = () => {
  const {
    shippingAddress,
    billingAddress,
    useShippingAsBilling,
    paymentMethod,
    paymentDetails,
  } = useCheckoutStore();

  const { getCartItems, getTotalPrice, getTotalQuantity } = useCartStore();

  const cartItems = getCartItems();
  const totalPrice = getTotalPrice();
  const totalItems = getTotalQuantity();

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

    if (paymentMethod === "BANK_CARD" && paymentDetails) {
      const details = paymentDetails as any;
      return `Thẻ ngân hàng: ${details.cardNumber} - ${details.cardholderName}`;
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
                <AccountBalanceIcon color="primary" />
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
              Đơn hàng của bạn ({totalItems} sản phẩm)
            </Typography>

            <List disablePadding>
              {cartItems.map((item) => (
                <ListItem key={item.book.id} sx={{ py: 1, px: 0 }}>
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
                    {formatCurrency(item.book.price * item.quantity)}
                  </Typography>
                </ListItem>
              ))}

              <Divider sx={{ my: 2 }} />

              <ListItem sx={{ py: 1, px: 0 }}>
                <ListItemText primary="Tạm tính" />
                <Typography variant="body1">
                  {formatCurrency(totalPrice)}
                </Typography>
              </ListItem>

              <ListItem sx={{ py: 1, px: 0 }}>
                <ListItemText primary="Phí vận chuyển" />
                <Typography variant="body1">{formatCurrency(0)}</Typography>
              </ListItem>

              <ListItem sx={{ py: 1, px: 0 }}>
                <ListItemText primary="Tổng cộng" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {formatCurrency(totalPrice)}
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
