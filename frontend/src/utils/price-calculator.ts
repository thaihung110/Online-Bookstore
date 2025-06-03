/**
 * UNIVERSAL PRICE CALCULATOR
 * 
 * This is the SINGLE SOURCE OF TRUTH for all price calculations
 * Used by both frontend and backend to ensure consistency
 */

export interface CartItem {
  quantity: number;
  priceAtAdd: number; // Price per item in USD
}

export interface PriceCalculation {
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discount: number;
  total: number;
  totalItems: number;
}

export interface PriceCalculatorConfig {
  // Shipping rules
  freeShippingThreshold: number; // USD amount for free shipping
  standardShippingCost: number;  // Standard shipping cost in USD
  
  // Tax rules
  taxRate: number; // Tax rate as decimal (0.08 = 8%)
  
  // Discount rules
  orderDiscount: number; // Fixed order discount in USD
}

// Default configuration - SINGLE SOURCE OF TRUTH
export const DEFAULT_PRICE_CONFIG: PriceCalculatorConfig = {
  freeShippingThreshold: 50.00, // Free shipping over $50
  standardShippingCost: 5.99,   // $5.99 standard shipping
  taxRate: 0.08,                // 8% tax rate
  orderDiscount: 0,             // No order discount by default
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
 * Calculate order discount
 */
export function calculateOrderDiscount(
  subtotal: number, 
  config: PriceCalculatorConfig = DEFAULT_PRICE_CONFIG
): number {
  return config.orderDiscount;
}

/**
 * MASTER CALCULATION FUNCTION
 * This is the ONLY function that should be used for price calculations
 */
export function calculateOrderTotal(
  items: CartItem[], 
  config: PriceCalculatorConfig = DEFAULT_PRICE_CONFIG
): PriceCalculation {
  // Step 1: Calculate subtotal
  const subtotal = calculateSubtotal(items);
  
  // Step 2: Calculate total items
  const totalItems = calculateTotalItems(items);
  
  // Step 3: Calculate shipping cost
  const shippingCost = calculateShippingCost(subtotal, totalItems, config);
  
  // Step 4: Calculate tax (on subtotal only, not shipping)
  const taxAmount = calculateTaxAmount(subtotal, config);
  
  // Step 5: Calculate discount
  const discount = calculateOrderDiscount(subtotal, config);
  
  // Step 6: Calculate final total
  const total = parseFloat((subtotal + shippingCost + taxAmount - discount).toFixed(2));
  
  return {
    subtotal,
    shippingCost,
    taxAmount,
    discount,
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
