import { isHanoiAddress, isAddressRushEligible } from './address-validator';

describe('Address Validator', () => {
  describe('isHanoiAddress', () => {
    it('should return true for valid Hanoi variations', () => {
      const validHanoiAddresses = [
        'Hanoi',
        'HANOI',
        'hanoi',
        'Ha Noi',
        'HA NOI',
        'ha noi',
        'HN',
        'hn',
        'Hà Nội',
        'hà nội',
        'Hà Noi',
        'hà noi',
        'Hanoi City',
        'hanoi city',
        'Ha Noi City',
        'ha noi city'
      ];

      validHanoiAddresses.forEach(address => {
        expect(isHanoiAddress(address)).toBe(true);
      });
    });

    it('should return true for Hanoi with extra whitespace', () => {
      const addressesWithWhitespace = [
        '  Hanoi  ',
        ' Ha Noi ',
        '   HN   ',
        'Hanoi   City',
        '  Ha  Noi  '
      ];

      addressesWithWhitespace.forEach(address => {
        expect(isHanoiAddress(address)).toBe(true);
      });
    });

    it('should return true for Hanoi with Vietnamese accents', () => {
      const accentedAddresses = [
        'Hà Nội',
        'HÀ NỘI',
        'hà nội',
        'Hà Noi',
        'hà noi'
      ];

      accentedAddresses.forEach(address => {
        expect(isHanoiAddress(address)).toBe(true);
      });
    });

    it('should return false for non-Hanoi cities', () => {
      const nonHanoiAddresses = [
        'Ho Chi Minh City',
        'Saigon',
        'Da Nang',
        'Hue',
        'Can Tho',
        'Hai Phong',
        'New York',
        'London',
        'Tokyo',
        'Bangkok',
        'Singapore'
      ];

      nonHanoiAddresses.forEach(address => {
        expect(isHanoiAddress(address)).toBe(false);
      });
    });

    it('should return false for invalid inputs', () => {
      const invalidInputs = [
        null,
        undefined,
        '',
        '   ',
        123,
        {},
        [],
        true,
        false
      ];

      invalidInputs.forEach(input => {
        expect(isHanoiAddress(input as any)).toBe(false);
      });
    });

    it('should return false for partial matches that are not Hanoi', () => {
      const partialMatches = [
        'Hanoi Street',
        'New Hanoi',
        'Hanoi District',
        'Ha Noi Road',
        'Near Hanoi',
        'Hanoi-like'
      ];

      partialMatches.forEach(address => {
        expect(isHanoiAddress(address)).toBe(false);
      });
    });

    it('should handle mixed case and accents correctly', () => {
      const mixedCases = [
        'HaNoi',
        'hA nOi',
        'HÀ nỘi',
        'hÀ NỘI'
      ];

      mixedCases.forEach(address => {
        expect(isHanoiAddress(address)).toBe(true);
      });
    });
  });

  describe('isAddressRushEligible', () => {
    it('should return true for addresses with Hanoi city', () => {
      const hanoiAddresses = [
        { city: 'Hanoi' },
        { city: 'Ha Noi' },
        { city: 'HN' },
        { city: 'Hà Nội' }
      ];

      hanoiAddresses.forEach(address => {
        expect(isAddressRushEligible(address)).toBe(true);
      });
    });

    it('should return false for addresses with non-Hanoi cities', () => {
      const nonHanoiAddresses = [
        { city: 'Ho Chi Minh City' },
        { city: 'Da Nang' },
        { city: 'Hue' },
        { city: 'Can Tho' }
      ];

      nonHanoiAddresses.forEach(address => {
        expect(isAddressRushEligible(address)).toBe(false);
      });
    });

    it('should handle empty or invalid city values', () => {
      const invalidAddresses = [
        { city: '' },
        { city: null as any },
        { city: undefined as any }
      ];

      invalidAddresses.forEach(address => {
        expect(isAddressRushEligible(address)).toBe(false);
      });
    });
  });
});
