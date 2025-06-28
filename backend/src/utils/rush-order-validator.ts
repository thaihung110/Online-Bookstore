/**
 * Rush order validation utilities
 */

import { isAddressRushEligible } from './address-validator';

/**
 * Interface for rush order validation result
 */
export interface RushOrderValidation {
  canRushOrder: boolean;
  ineligibleItems: string[];
  addressValid: boolean;
  message?: string;
}

/**
 * Interface for cart items with product information
 */
export interface CartItem {
  product: {
    _id?: string;
    id?: string;
    title: string;
    isAvailableRush?: boolean; // Optional, defaults to true for backward compatibility
  };
  quantity: number;
}

/**
 * Interface for shipping address
 */
export interface ShippingAddress {
  city: string;
  fullName?: string;
  addressLine1?: string;
  state?: string;
  country?: string;
}

/**
 * Validates if a rush order is possible based on address and product eligibility
 * 
 * @param cartItems - Array of items in the cart
 * @param shippingAddress - Shipping address information
 * @returns RushOrderValidation result
 */
export function validateRushOrder(
  cartItems: CartItem[],
  shippingAddress: ShippingAddress
): RushOrderValidation {
  // Check if address is valid for rush delivery
  const addressValid = isAddressRushEligible(shippingAddress);
  
  if (!addressValid) {
    return {
      canRushOrder: false,
      ineligibleItems: [],
      addressValid: false,
      message: "Rush delivery is only available in Hanoi. Please check your shipping address."
    };
  }

  // Check if all products are eligible for rush delivery
  // Default to true if isAvailableRush is undefined (for backward compatibility)
  const ineligibleItems = cartItems
    .filter(item => item.product.isAvailableRush === false)
    .map(item => item.product.title);

  if (ineligibleItems.length > 0) {
    return {
      canRushOrder: false,
      ineligibleItems,
      addressValid: true,
      message: `Some items are not eligible for rush delivery: ${ineligibleItems.join(', ')}. Please remove these items or choose regular delivery.`
    };
  }

  // All checks passed
  return {
    canRushOrder: true,
    ineligibleItems: [],
    addressValid: true,
    message: "All items are eligible for rush delivery to your address."
  };
}

/**
 * Quick check if rush delivery is available for a specific address
 * 
 * @param city - City name to check
 * @returns boolean indicating rush availability
 */
export function isRushDeliveryAvailable(city: string): boolean {
  return isAddressRushEligible({ city });
}

/**
 * Validates if all products in a list are rush-eligible
 * 
 * @param products - Array of products to check
 * @returns object with validation result and ineligible product names
 */
export function validateProductsForRush(products: Array<{ title: string; isAvailableRush?: boolean }>) {
  // Default to true if isAvailableRush is undefined (for backward compatibility)
  const ineligibleProducts = products
    .filter(product => product.isAvailableRush === false)
    .map(product => product.title);

  return {
    allEligible: ineligibleProducts.length === 0,
    ineligibleProducts,
    eligibleCount: products.length - ineligibleProducts.length,
    totalCount: products.length
  };
}
