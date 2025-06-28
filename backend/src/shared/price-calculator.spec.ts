import {
  calculateRushSurcharge,
  calculateOrderTotal,
  CartItem,
  DEFAULT_PRICE_CONFIG,
  PriceCalculation
} from './price-calculator';

describe('calculateRushSurcharge', () => {

  const mockHanoiAddress = { city: 'Hanoi' };
  const mockNonHanoiAddress = { city: 'Ho Chi Minh' };

  // Test Case 1: should be defined
  it('should be defined', () => {
    expect(calculateRushSurcharge).toBeDefined();
    expect(typeof calculateRushSurcharge).toBe('function');
  });

  // Test Case 2: should return 0 when isRushOrder is false
  it('should return 0 when isRushOrder is false', () => {
    const items: CartItem[] = [
      {
        quantity: 1,
        priceAtAdd: 10,
        product: { isAvailableRush: true }
      }
    ];

    const result = calculateRushSurcharge(items, false, mockHanoiAddress, DEFAULT_PRICE_CONFIG);
    
    expect(result).toBe(0);
  });

  // Test Case 3: should calculate correct surcharge for single item
  it('should calculate correct surcharge for single item', () => {
    const items: CartItem[] = [
      {
        quantity: 1,
        priceAtAdd: 10,
        product: { isAvailableRush: true }
      }
    ];

    const result = calculateRushSurcharge(items, true, mockHanoiAddress, DEFAULT_PRICE_CONFIG);
    
    expect(result).toBe(4.00);
  });

  // Test Case 4: should calculate correct surcharge for multiple items
  it('should calculate correct surcharge for multiple items', () => {
    const items: CartItem[] = [
      {
        quantity: 2,
        priceAtAdd: 10,
        product: { isAvailableRush: true }
      },
      {
        quantity: 1,
        priceAtAdd: 15,
        product: { isAvailableRush: true }
      }
    ];

    const result = calculateRushSurcharge(items, true, mockHanoiAddress, DEFAULT_PRICE_CONFIG);
    
    // 3 total items × $4 = $12.00
    expect(result).toBe(12.00);
  });

  // Test Case 5: should throw error for non-Hanoi address
  it('should throw error for non-Hanoi address', () => {
    const items: CartItem[] = [
      {
        quantity: 1,
        priceAtAdd: 10,
        product: { isAvailableRush: true }
      }
    ];

    expect(() => {
      calculateRushSurcharge(items, true, mockNonHanoiAddress, DEFAULT_PRICE_CONFIG);
    }).toThrow('Rush delivery is only available in Hanoi');
  });

  // Test Case 6: should throw error for ineligible products
  it('should throw error for ineligible products', () => {
    const items: CartItem[] = [
      {
        quantity: 1,
        priceAtAdd: 10,
        product: { isAvailableRush: false }
      }
    ];

    expect(() => {
      calculateRushSurcharge(items, true, mockHanoiAddress, DEFAULT_PRICE_CONFIG);
    }).toThrow('Some items are not eligible for rush delivery');
  });

  // Test Case 7: should handle undefined product data gracefully
  it('should handle undefined product data gracefully', () => {
    const items: CartItem[] = [
      {
        quantity: 1,
        priceAtAdd: 10,
        product: undefined
      }
    ];

    const result = calculateRushSurcharge(items, true, mockHanoiAddress, DEFAULT_PRICE_CONFIG);
    
    // Should default to eligible (backward compatibility)
    expect(result).toBe(4.00);
  });

  // Additional edge case tests
  describe('Edge cases', () => {
    it('should handle empty items array', () => {
      const items: CartItem[] = [];

      const result = calculateRushSurcharge(items, true, mockHanoiAddress, DEFAULT_PRICE_CONFIG);
      
      expect(result).toBe(0);
    });

    it('should handle mixed eligible and ineligible products', () => {
      const items: CartItem[] = [
        {
          quantity: 1,
          priceAtAdd: 10,
          product: { isAvailableRush: true }
        },
        {
          quantity: 1,
          priceAtAdd: 15,
          product: { isAvailableRush: false }
        }
      ];

      expect(() => {
        calculateRushSurcharge(items, true, mockHanoiAddress, DEFAULT_PRICE_CONFIG);
      }).toThrow('Some items are not eligible for rush delivery');
    });

    it('should handle zero quantity items', () => {
      const items: CartItem[] = [
        {
          quantity: 0,
          priceAtAdd: 10,
          product: { isAvailableRush: true }
        }
      ];

      const result = calculateRushSurcharge(items, true, mockHanoiAddress, DEFAULT_PRICE_CONFIG);
      
      expect(result).toBe(0);
    });
  });
});

describe('calculateOrderTotal', () => {
  const mockHanoiAddress = { city: 'Hanoi' };

  const sampleItems: CartItem[] = [
    {
      quantity: 2,
      priceAtAdd: 10.00, // $20 subtotal
      product: { isAvailableRush: true }
    },
    {
      quantity: 1,
      priceAtAdd: 15.00, // $15 subtotal
      product: { isAvailableRush: true }
    }
  ];
  // Total: $35 subtotal, 3 items

  // Test Case 16: should calculate total with rush surcharge included
  it('should calculate total with rush surcharge included', () => {
    const result: PriceCalculation = calculateOrderTotal(
      sampleItems,
      DEFAULT_PRICE_CONFIG,
      true, // isRushOrder = true
      mockHanoiAddress
    );

    // Expected calculation:
    // Subtotal: $35.00 (2×$10 + 1×$15)
    // Shipping: $2.99 (under $50 threshold)
    // Rush: $12.00 (3 items × $4)
    // Tax: $2.80 (8% of $35 subtotal)
    // Total: $52.79

    expect(result.subtotal).toBe(35.00);
    expect(result.shippingCost).toBe(2.99);
    expect(result.rushSurcharge).toBe(12.00);
    expect(result.taxAmount).toBe(2.80);
    expect(result.total).toBe(52.79);
    expect(result.totalItems).toBe(3);
  });

  // Test Case 17: should calculate total without rush surcharge when not rush order
  it('should calculate total without rush surcharge when not rush order', () => {
    const result: PriceCalculation = calculateOrderTotal(
      sampleItems,
      DEFAULT_PRICE_CONFIG,
      false, // isRushOrder = false
      mockHanoiAddress
    );

    // Expected calculation:
    // Subtotal: $35.00
    // Shipping: $2.99
    // Rush: $0.00 (not rush order)
    // Tax: $2.80 (8% of $35 subtotal)
    // Total: $40.79

    expect(result.subtotal).toBe(35.00);
    expect(result.shippingCost).toBe(2.99);
    expect(result.rushSurcharge).toBe(0.00);
    expect(result.taxAmount).toBe(2.80);
    expect(result.total).toBe(40.79);
    expect(result.totalItems).toBe(3);
  });

  // Test Case 18: should include rush surcharge in breakdown
  it('should include rush surcharge in breakdown', () => {
    const result: PriceCalculation = calculateOrderTotal(
      sampleItems,
      DEFAULT_PRICE_CONFIG,
      true, // isRushOrder = true
      mockHanoiAddress
    );

    // Verify all fields are present in the breakdown
    expect(result).toHaveProperty('subtotal');
    expect(result).toHaveProperty('shippingCost');
    expect(result).toHaveProperty('rushSurcharge');
    expect(result).toHaveProperty('taxAmount');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('totalItems');

    // Verify rush surcharge is correctly included
    expect(result.rushSurcharge).toBe(12.00);
    expect(typeof result.rushSurcharge).toBe('number');
  });

  // Additional edge cases
  describe('Edge cases', () => {
    it('should handle free shipping threshold', () => {
      const highValueItems: CartItem[] = [
        {
          quantity: 1,
          priceAtAdd: 60.00, // Above $50 free shipping threshold
          product: { isAvailableRush: true }
        }
      ];

      const result = calculateOrderTotal(
        highValueItems,
        DEFAULT_PRICE_CONFIG,
        true,
        mockHanoiAddress
      );

      expect(result.subtotal).toBe(60.00);
      expect(result.shippingCost).toBe(0.00); // Free shipping
      expect(result.rushSurcharge).toBe(4.00); // 1 item × $4
      expect(result.taxAmount).toBe(4.80); // 8% of $60
      expect(result.total).toBe(68.80);
    });

    it('should handle empty cart', () => {
      const result = calculateOrderTotal(
        [],
        DEFAULT_PRICE_CONFIG,
        true,
        mockHanoiAddress
      );

      expect(result.subtotal).toBe(0.00);
      expect(result.shippingCost).toBe(0.00);
      expect(result.rushSurcharge).toBe(0.00);
      expect(result.taxAmount).toBe(0.00);
      expect(result.total).toBe(0.00);
      expect(result.totalItems).toBe(0);
    });
  });
});
