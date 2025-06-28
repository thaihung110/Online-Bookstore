/**
 * UNIVERSAL PRICE CALCULATOR
 * 
 * This is the SINGLE SOURCE OF TRUTH for all price calculations
 * Used by both frontend and backend to ensure consistency
 */

export interface CartItem {
  quantity: number;
  priceAtAdd: number; // Price per item in USD
  product?: {
    isAvailableRush?: boolean; // Optional, defaults to true for backward compatibility
  };
}

export interface PriceCalculation {
  subtotal: number;
  shippingCost: number;
  rushSurcharge: number;
  taxAmount: number;
  total: number;
  totalItems: number;
}

export interface PriceCalculatorConfig {
  // Shipping rules
  freeShippingThreshold: number; // USD amount for free shipping
  standardShippingCost: number;  // Standard shipping cost in USD

  // Tax rules
  taxRate: number; // Tax rate as decimal (0.08 = 8%)

  // Rush delivery rules
  rushSurchargePerItem: number; // Rush surcharge per item in USD
}

export interface ShippingAddress {
  city: string;
  fullName?: string;
  addressLine1?: string;
  state?: string;
  country?: string;
}

// Default configuration - SINGLE SOURCE OF TRUTH
export const DEFAULT_PRICE_CONFIG: PriceCalculatorConfig = {
  freeShippingThreshold: 50.00, // Free shipping over $50
  standardShippingCost: 2.99,   // $2.99 standard shipping (match backend)
  taxRate: 0.08,                // 8% tax rate
  rushSurchargePerItem: 4.0,    // $4 rush surcharge per item
};

/**
 * Calculate subtotal from cart items
 */
export function calculateSubtotal(items: CartItem[]): number {
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.priceAtAdd * item.quantity);
  }, 0);
  
  return parseFloat(subtotal.toFixed(2));
}

/**
 * Calculate total number of items
 */
export function calculateTotalItems(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Calculate shipping cost based on subtotal and item count
 */
export function calculateShippingCost(
  subtotal: number, 
  totalItems: number, 
  config: PriceCalculatorConfig = DEFAULT_PRICE_CONFIG
): number {
  // Free shipping if subtotal exceeds threshold, otherwise standard rate if there are items
  if (subtotal >= config.freeShippingThreshold) {
    return 0;
  }
  
  return totalItems > 0 ? config.standardShippingCost : 0;
}

/**
 * Calculate tax amount based on subtotal
 */
export function calculateTaxAmount(
  subtotal: number, 
  config: PriceCalculatorConfig = DEFAULT_PRICE_CONFIG
): number {
  const taxAmount = subtotal * config.taxRate;
  return parseFloat(taxAmount.toFixed(2));
}

/**
 * Simple Hanoi address validation for rush delivery
 */
function isHanoiAddress(city: string): boolean {
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
}

/**
 * Calculate rush delivery surcharge
 */
export function calculateRushSurcharge(
  items: CartItem[],
  isRushOrder: boolean,
  address?: ShippingAddress,
  config: PriceCalculatorConfig = DEFAULT_PRICE_CONFIG,
): number {
  // No surcharge if not a rush order
  if (!isRushOrder) {
    return 0;
  }

  // Validate address for rush delivery
  if (address && !isHanoiAddress(address.city)) {
    throw new Error('Rush delivery is only available in Hanoi');
  }

  // Check if all items are rush-eligible
  // Default to true if isAvailableRush is undefined (for backward compatibility)
  const ineligibleItems = items.filter(item =>
    item.product && item.product.isAvailableRush === false
  );

  if (ineligibleItems.length > 0) {
    throw new Error('Some items are not eligible for rush delivery');
  }

  // Calculate surcharge: $4 per item
  const totalItems = calculateTotalItems(items);
  const surcharge = totalItems * config.rushSurchargePerItem;

  return parseFloat(surcharge.toFixed(2));
}

/**
 * MASTER CALCULATION FUNCTION
 * This is the ONLY function that should be used for price calculations
 */
export function calculateOrderTotal(
  items: CartItem[],
  config: PriceCalculatorConfig = DEFAULT_PRICE_CONFIG,
  isRushOrder: boolean = false,
  address?: ShippingAddress,
): PriceCalculation {
  // Step 1: Calculate subtotal
  const subtotal = calculateSubtotal(items);

  // Step 2: Calculate total items
  const totalItems = calculateTotalItems(items);

  // Step 3: Calculate shipping cost
  const shippingCost = calculateShippingCost(subtotal, totalItems, config);

  // Step 4: Calculate rush surcharge
  const rushSurcharge = calculateRushSurcharge(items, isRushOrder, address, config);

  // Step 5: Calculate tax (on subtotal only, not shipping or rush)
  const taxAmount = calculateTaxAmount(subtotal, config);

  // Step 6: Calculate final total
  const total = parseFloat((subtotal + shippingCost + rushSurcharge + taxAmount).toFixed(2));

  return {
    subtotal,
    shippingCost,
    rushSurcharge,
    taxAmount,
    total,
    totalItems,
  };
}

/**
 * Format currency amount to USD string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
