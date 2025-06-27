import React from "react";
import {
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Paper,
  Stack,
} from "@mui/material";
import { useCheckoutStore } from "../../store/checkoutStore";
import { PaymentMethod } from "../../api/payments";
import PaymentIcon from "@mui/icons-material/Payment";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";

const PaymentMethodSelector: React.FC = () => {
  const { paymentMethod, setPaymentMethod } = useCheckoutStore();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentMethod(event.target.value as PaymentMethod);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Payment Method
      </Typography>

      <FormControl component="fieldset">
        <FormLabel component="legend">Select payment method</FormLabel>
        <RadioGroup
          aria-label="payment-method"
          name="payment-method"
          value={paymentMethod || ""}
          onChange={handleChange}
        >
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderColor:
                  paymentMethod === "VNPAY" ? "primary.main" : "divider",
                borderWidth: paymentMethod === "VNPAY" ? 2 : 1,
              }}
            >
              <FormControlLabel
                value="VNPAY"
                control={<Radio />}
                label={
                  <Stack direction="row" spacing={2} alignItems="center">
                    <PaymentIcon color="primary" />
                    <Box>
                      <Typography variant="subtitle1">VNPAY</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Secure payment through VNPAY gateway. Supports multiple
                        banks and e-wallets.
                      </Typography>
                    </Box>
                  </Stack>
                }
              />
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderColor:
                  paymentMethod === "COD" ? "primary.main" : "divider",
                borderWidth: paymentMethod === "COD" ? 2 : 1,
              }}
            >
              <FormControlLabel
                value="COD"
                control={<Radio />}
                label={
                  <Stack direction="row" spacing={2} alignItems="center">
                    <LocalShippingIcon color="primary" />
                    <Box>
                      <Typography variant="subtitle1">
                        Cash on Delivery
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pay with cash when receiving the order. No need for bank
                        cards or e-wallets.
                      </Typography>
                    </Box>
                  </Stack>
                }
              />
            </Paper>
          </Stack>
        </RadioGroup>
      </FormControl>
    </Box>
  );
};

export default PaymentMethodSelector;
