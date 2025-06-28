import { 
  validateRushOrder, 
  isRushDeliveryAvailable, 
  validateProductsForRush,
  CartItem,
  ShippingAddress 
} from './rush-order-validator';

describe('Rush Order Validator', () => {
  const mockHanoiAddress: ShippingAddress = {
    city: 'Hanoi',
    fullName: 'John Doe',
    addressLine1: '123 Main St'
  };

  const mockNonHanoiAddress: ShippingAddress = {
    city: 'Ho Chi Minh City',
    fullName: 'Jane Doe',
    addressLine1: '456 Second St'
  };

  const mockRushEligibleItems: CartItem[] = [
    {
      product: {
        id: '1',
        title: 'Rush Book 1',
        isAvailableRush: true
      },
      quantity: 2
    },
    {
      product: {
        id: '2',
        title: 'Rush CD 1',
        isAvailableRush: true
      },
      quantity: 1
    }
  ];

  const mockNonRushEligibleItems: CartItem[] = [
    {
      product: {
        id: '3',
        title: 'Regular Book 1',
        isAvailableRush: false
      },
      quantity: 1
    },
    {
      product: {
        id: '4',
        title: 'Regular DVD 1',
        isAvailableRush: false
      },
      quantity: 2
    }
  ];

  const mockMixedItems: CartItem[] = [
    {
      product: {
        id: '1',
        title: 'Rush Book 1',
        isAvailableRush: true
      },
      quantity: 1
    },
    {
      product: {
        id: '3',
        title: 'Regular Book 1',
        isAvailableRush: false
      },
      quantity: 1
    }
  ];

  describe('validateRushOrder', () => {
    it('should allow rush order for Hanoi address with all rush-eligible items', () => {
      const result = validateRushOrder(mockRushEligibleItems, mockHanoiAddress);

      expect(result.canRushOrder).toBe(true);
      expect(result.addressValid).toBe(true);
      expect(result.ineligibleItems).toEqual([]);
      expect(result.message).toContain('eligible for rush delivery');
    });

    it('should reject rush order for non-Hanoi address', () => {
      const result = validateRushOrder(mockRushEligibleItems, mockNonHanoiAddress);

      expect(result.canRushOrder).toBe(false);
      expect(result.addressValid).toBe(false);
      expect(result.ineligibleItems).toEqual([]);
      expect(result.message).toContain('only available in Hanoi');
    });

    it('should reject rush order for Hanoi address with non-rush-eligible items', () => {
      const result = validateRushOrder(mockNonRushEligibleItems, mockHanoiAddress);

      expect(result.canRushOrder).toBe(false);
      expect(result.addressValid).toBe(true);
      expect(result.ineligibleItems).toEqual(['Regular Book 1', 'Regular DVD 1']);
      expect(result.message).toContain('not eligible for rush delivery');
    });

    it('should reject rush order for mixed eligible/ineligible items', () => {
      const result = validateRushOrder(mockMixedItems, mockHanoiAddress);

      expect(result.canRushOrder).toBe(false);
      expect(result.addressValid).toBe(true);
      expect(result.ineligibleItems).toEqual(['Regular Book 1']);
      expect(result.message).toContain('Regular Book 1');
    });

    it('should handle empty cart items', () => {
      const result = validateRushOrder([], mockHanoiAddress);

      expect(result.canRushOrder).toBe(true);
      expect(result.addressValid).toBe(true);
      expect(result.ineligibleItems).toEqual([]);
    });
  });

  describe('isRushDeliveryAvailable', () => {
    it('should return true for Hanoi variations', () => {
      const hanoiVariations = ['Hanoi', 'Ha Noi', 'HN', 'Hà Nội'];
      
      hanoiVariations.forEach(city => {
        expect(isRushDeliveryAvailable(city)).toBe(true);
      });
    });

    it('should return false for non-Hanoi cities', () => {
      const nonHanoiCities = ['Ho Chi Minh City', 'Da Nang', 'Hue'];
      
      nonHanoiCities.forEach(city => {
        expect(isRushDeliveryAvailable(city)).toBe(false);
      });
    });
  });

  describe('validateProductsForRush', () => {
    it('should validate all rush-eligible products', () => {
      const products = [
        { title: 'Book 1', isAvailableRush: true },
        { title: 'CD 1', isAvailableRush: true }
      ];

      const result = validateProductsForRush(products);

      expect(result.allEligible).toBe(true);
      expect(result.ineligibleProducts).toEqual([]);
      expect(result.eligibleCount).toBe(2);
      expect(result.totalCount).toBe(2);
    });

    it('should identify ineligible products', () => {
      const products = [
        { title: 'Book 1', isAvailableRush: true },
        { title: 'Book 2', isAvailableRush: false },
        { title: 'CD 1', isAvailableRush: false }
      ];

      const result = validateProductsForRush(products);

      expect(result.allEligible).toBe(false);
      expect(result.ineligibleProducts).toEqual(['Book 2', 'CD 1']);
      expect(result.eligibleCount).toBe(1);
      expect(result.totalCount).toBe(3);
    });

    it('should handle empty product list', () => {
      const result = validateProductsForRush([]);

      expect(result.allEligible).toBe(true);
      expect(result.ineligibleProducts).toEqual([]);
      expect(result.eligibleCount).toBe(0);
      expect(result.totalCount).toBe(0);
    });

    // Test Case 15: should default to eligible for undefined isAvailableRush
    it('should default to eligible for undefined isAvailableRush', () => {
      const products = [
        { title: 'Book 1', isAvailableRush: true },
        { title: 'Book 2', isAvailableRush: undefined }, // Should default to eligible
        { title: 'Book 3' }, // No isAvailableRush field - should default to eligible
        { title: 'Book 4', isAvailableRush: false }
      ];

      const result = validateProductsForRush(products);

      expect(result.allEligible).toBe(false); // Because Book 4 is false
      expect(result.ineligibleProducts).toEqual(['Book 4']); // Only Book 4 should be ineligible
      expect(result.eligibleCount).toBe(3); // Book 1, 2, 3 are eligible
      expect(result.totalCount).toBe(4);
    });
  });
});
