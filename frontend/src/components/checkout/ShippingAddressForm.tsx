import React, { useEffect, useState } from "react";
import {
  Grid,
  TextField,
  Typography,
  FormControlLabel,
  Checkbox,
  Box,
  Divider,
  Tooltip,
} from "@mui/material";
import { useCheckoutStore } from "../../store/checkoutStore";
import { useCartStore } from "../../store/cartStore";
import { Address } from "../../utils/checkout";

const ShippingAddressForm: React.FC = () => {
  const {
    shippingAddress,
    setShippingAddress,
    billingAddress,
    setBillingAddress,
    useShippingAsBilling,
    setUseShippingAsBilling,
    isRushOrder,
    setIsRushOrder,
  } = useCheckoutStore();

  const { getSelectedItems } = useCartStore();

  // Rush delivery state is now managed by checkout store

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

  // Simple Hanoi address check for enabling/disabling rush delivery
  const isHanoiAddress = (city: string): boolean => {
    if (!city || typeof city !== 'string') {
      return false;
    }

    const normalizedCity = city
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');

    const hanoiVariations = ['hanoi', 'ha noi', 'hn'];

    return hanoiVariations.some(variation =>
      normalizedCity === variation || normalizedCity.includes(variation)
    );
  };

  // Check if rush delivery is available based on current address
  const isRushAvailable = isHanoiAddress(formData.city);

  // Check if all selected items are rush-eligible
  const selectedItems = getSelectedItems();
  const allItemsRushEligible = selectedItems.every(item => {
    // If product data is available, check isAvailableRush
    // If not available, assume eligible (for backward compatibility)
    return !item.product || item.product.isAvailableRush !== false;
  });

  // Rush delivery is available only if address is Hanoi AND all items are eligible
  const canEnableRushDelivery = isRushAvailable && allItemsRushEligible;

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

  // Handle rush delivery checkbox change
  const handleRushDeliveryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsRushOrder(checked);
    // Note: The actual rush order flag will be passed to the backend via checkout store
  };

  // Auto-disable rush delivery if address changes to non-Hanoi or items are not eligible
  useEffect(() => {
    if (!canEnableRushDelivery && isRushOrder) {
      setIsRushOrder(false);
    }
  }, [canEnableRushDelivery, isRushOrder, setIsRushOrder]);

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

          <Box sx={{ width: "100%", mt: 2 }}>
            <Tooltip
              title={
                !isRushAvailable
                  ? "Rush delivery is only available in Hanoi"
                  : !allItemsRushEligible
                  ? "Some items in your cart are not eligible for rush delivery"
                  : "2-hour delivery with additional charges"
              }
            >
              <FormControlLabel
                control={
                  <Checkbox
                    color="primary"
                    checked={isRushOrder}
                    onChange={handleRushDeliveryChange}
                    disabled={!canEnableRushDelivery}
                  />
                }
                label={
                  <span style={{
                    color: !canEnableRushDelivery ? '#999' : 'inherit',
                    opacity: !canEnableRushDelivery ? 0.6 : 1
                  }}>
                    Rush Delivery (2 hours) - Additional charges apply
                  </span>
                }
              />
            </Tooltip>
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
