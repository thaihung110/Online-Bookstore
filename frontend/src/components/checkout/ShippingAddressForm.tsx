import React, { useEffect, useState } from "react";
import {
  Grid,
  TextField,
  Typography,
  FormControlLabel,
  Checkbox,
  Box,
  Divider,
} from "@mui/material";
import { useCheckoutStore } from "../../store/checkoutStore";
import { Address } from "../../utils/checkout";

const ShippingAddressForm: React.FC = () => {
  const {
    shippingAddress,
    setShippingAddress,
    billingAddress,
    setBillingAddress,
    useShippingAsBilling,
    setUseShippingAsBilling,
  } = useCheckoutStore();

  const [formData, setFormData] = useState<Address>({
    fullName: "",
    phoneNumber: "",
    email: "",
    address: "",
    city: "",
    district: "",
    ward: "",
    zipCode: "",
  });

  const [billingData, setBillingData] = useState<Address>({
    fullName: "",
    phoneNumber: "",
    email: "",
    address: "",
    city: "",
    district: "",
    ward: "",
    zipCode: "",
  });

  // Load data from store to form when component renders
  useEffect(() => {
    if (shippingAddress) {
      setFormData(shippingAddress);
    }
    if (billingAddress) {
      setBillingData(billingAddress);
    }
  }, [shippingAddress, billingAddress]);

  // Handle shipping input changes
  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);
    setShippingAddress(updatedData);

    // If using same address for billing, update billing data
    if (useShippingAsBilling) {
      setBillingData(updatedData);
      setBillingAddress(updatedData);
    }
  };

  // Handle billing input changes
  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedData = { ...billingData, [name]: value };
    setBillingData(updatedData);
    setBillingAddress(updatedData);
  };

  // Handle "Use shipping address as billing address" checkbox change
  const handleUseShippingAsBillingChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const checked = e.target.checked;
    setUseShippingAsBilling(checked);

    if (checked) {
      setBillingData(formData);
      setBillingAddress(formData);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Shipping Address
      </Typography>

      <Box sx={{ flexGrow: 1 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
            <TextField
              required
              id="fullName"
              name="fullName"
              label="Full Name"
              fullWidth
              variant="outlined"
              value={formData.fullName}
              onChange={handleShippingChange}
            />
          </Box>

          <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
            <TextField
              required
              id="phoneNumber"
              name="phoneNumber"
              label="Phone Number"
              fullWidth
              variant="outlined"
              value={formData.phoneNumber}
              onChange={handleShippingChange}
            />
          </Box>

          <Box sx={{ width: "100%", mt: 2 }}>
            <TextField
              required
              id="email"
              name="email"
              label="Email"
              fullWidth
              variant="outlined"
              value={formData.email}
              onChange={handleShippingChange}
            />
          </Box>

          <Box sx={{ width: "100%", mt: 2 }}>
            <TextField
              required
              id="address"
              name="address"
              label="Address"
              fullWidth
              variant="outlined"
              value={formData.address}
              onChange={handleShippingChange}
            />
          </Box>

          <Box sx={{ display: "flex", width: "100%", gap: 2, mt: 2 }}>
            <Box sx={{ width: { xs: "100%", sm: "calc(33.33% - 8px)" } }}>
              <TextField
                required
                id="city"
                name="city"
                label="City/Province"
                fullWidth
                variant="outlined"
                value={formData.city}
                onChange={handleShippingChange}
              />
            </Box>

            <Box sx={{ width: { xs: "100%", sm: "calc(33.33% - 8px)" } }}>
              <TextField
                required
                id="district"
                name="district"
                label="District"
                fullWidth
                variant="outlined"
                value={formData.district}
                onChange={handleShippingChange}
              />
            </Box>

            <Box sx={{ width: { xs: "100%", sm: "calc(33.33% - 8px)" } }}>
              <TextField
                required
                id="ward"
                name="ward"
                label="Ward"
                fullWidth
                variant="outlined"
                value={formData.ward}
                onChange={handleShippingChange}
              />
            </Box>
          </Box>

          <Box sx={{ width: "100%", mt: 2 }}>
            <TextField
              id="zipCode"
              name="zipCode"
              label="Postal Code"
              fullWidth
              variant="outlined"
              value={formData.zipCode}
              onChange={handleShippingChange}
            />
          </Box>

          <Box sx={{ width: "100%", mt: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  color="primary"
                  checked={useShippingAsBilling}
                  onChange={handleUseShippingAsBillingChange}
                />
              }
              label="Use shipping address as billing address"
            />
          </Box>
        </Box>
      </Box>

      {!useShippingAsBilling && (
        <>
          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Billing Address
          </Typography>

          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
                <TextField
                  required
                  id="billing-fullName"
                  name="fullName"
                  label="Full Name"
                  fullWidth
                  variant="outlined"
                  value={billingData.fullName}
                  onChange={handleBillingChange}
                />
              </Box>

              <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
                <TextField
                  required
                  id="billing-phoneNumber"
                  name="phoneNumber"
                  label="Phone Number"
                  fullWidth
                  variant="outlined"
                  value={billingData.phoneNumber}
                  onChange={handleBillingChange}
                />
              </Box>

              <Box sx={{ width: "100%", mt: 2 }}>
                <TextField
                  required
                  id="billing-email"
                  name="email"
                  label="Email"
                  fullWidth
                  variant="outlined"
                  value={billingData.email}
                  onChange={handleBillingChange}
                />
              </Box>

              <Box sx={{ width: "100%", mt: 2 }}>
                <TextField
                  required
                  id="billing-address"
                  name="address"
                  label="Address"
                  fullWidth
                  variant="outlined"
                  value={billingData.address}
                  onChange={handleBillingChange}
                />
              </Box>

              <Box sx={{ display: "flex", width: "100%", gap: 2, mt: 2 }}>
                <Box sx={{ width: { xs: "100%", sm: "calc(33.33% - 8px)" } }}>
                  <TextField
                    required
                    id="billing-city"
                    name="city"
                    label="City/Province"
                    fullWidth
                    variant="outlined"
                    value={billingData.city}
                    onChange={handleBillingChange}
                  />
                </Box>

                <Box sx={{ width: { xs: "100%", sm: "calc(33.33% - 8px)" } }}>
                  <TextField
                    required
                    id="billing-district"
                    name="district"
                    label="District"
                    fullWidth
                    variant="outlined"
                    value={billingData.district}
                    onChange={handleBillingChange}
                  />
                </Box>

                <Box sx={{ width: { xs: "100%", sm: "calc(33.33% - 8px)" } }}>
                  <TextField
                    required
                    id="billing-ward"
                    name="ward"
                    label="Ward"
                    fullWidth
                    variant="outlined"
                    value={billingData.ward}
                    onChange={handleBillingChange}
                  />
                </Box>
              </Box>

              <Box sx={{ width: "100%", mt: 2 }}>
                <TextField
                  id="billing-zipCode"
                  name="zipCode"
                  label="Postal Code"
                  fullWidth
                  variant="outlined"
                  value={billingData.zipCode}
                  onChange={handleBillingChange}
                />
              </Box>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default ShippingAddressForm;
