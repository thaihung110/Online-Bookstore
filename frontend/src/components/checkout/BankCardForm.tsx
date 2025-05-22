import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Paper,
} from "@mui/material";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LockIcon from "@mui/icons-material/Lock";
import { useCheckoutStore } from "../../store/checkoutStore";
import { BankCardDetails } from "../../api/payments";

// Format card number with spaces
const formatCardNumber = (value: string) => {
  const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
  const matches = v.match(/\d{4,16}/g);
  const match = (matches && matches[0]) || "";
  const parts = [];

  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }

  if (parts.length) {
    return parts.join(" ");
  } else {
    return value;
  }
};

// Format CVV to only allow numbers
const formatCVV = (value: string) => {
  return value.replace(/\D/g, "").substring(0, 4);
};

// Format expiry date as MM/YY
const formatExpiryDate = (value: string) => {
  const v = value.replace(/\D/g, "");
  if (v.length >= 3) {
    return v.substring(0, 2) + "/" + v.substring(2, 4);
  }
  return v;
};

const BankCardForm: React.FC = () => {
  const { paymentDetails, setPaymentDetails } = useCheckoutStore();

  const [formData, setFormData] = useState<BankCardDetails>({
    cardNumber: "",
    cardholderName: "",
    expiryDate: "",
    cvv: "",
  });

  // Khi component render, lấy dữ liệu từ store nếu có
  useEffect(() => {
    if (paymentDetails) {
      setFormData(paymentDetails as BankCardDetails);
    }
  }, [paymentDetails]);

  // Xử lý thay đổi input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format các trường input
    if (name === "cardNumber") {
      formattedValue = formatCardNumber(value);
    } else if (name === "expiryDate") {
      formattedValue = formatExpiryDate(value);
    } else if (name === "cvv") {
      formattedValue = formatCVV(value);
    }

    const updatedData = { ...formData, [name]: formattedValue };
    setFormData(updatedData);
    setPaymentDetails(updatedData);
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Thông tin thẻ ngân hàng
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Box>
          <TextField
            required
            id="cardNumber"
            name="cardNumber"
            label="Số thẻ"
            fullWidth
            variant="outlined"
            value={formData.cardNumber}
            onChange={handleChange}
            placeholder="1234 5678 9012 3456"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CreditCardIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box>
          <TextField
            required
            id="cardholderName"
            name="cardholderName"
            label="Tên chủ thẻ"
            fullWidth
            variant="outlined"
            value={formData.cardholderName}
            onChange={handleChange}
            placeholder="NGUYEN VAN A"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AccountCircleIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box sx={{ display: "flex", gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <TextField
              required
              id="expiryDate"
              name="expiryDate"
              label="Ngày hết hạn"
              fullWidth
              variant="outlined"
              value={formData.expiryDate}
              onChange={handleChange}
              placeholder="MM/YY"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarTodayIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box sx={{ flex: 1 }}>
            <TextField
              required
              id="cvv"
              name="cvv"
              label="CVV"
              fullWidth
              variant="outlined"
              value={formData.cvv}
              onChange={handleChange}
              placeholder="123"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          * Thông tin thẻ của bạn được bảo mật và chỉ được sử dụng cho giao dịch
          này.
        </Typography>
      </Box>
    </Paper>
  );
};

export default BankCardForm;
