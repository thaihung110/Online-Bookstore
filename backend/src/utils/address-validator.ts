/**
 * Address validation utilities for rush delivery eligibility
 */

/**
 * Validates if a city is in Hanoi for rush delivery eligibility
 * Handles case-insensitive matching and Vietnamese accent removal
 * 
 * @param city - The city name to validate
 * @returns true if the city is Hanoi, false otherwise
 */
export function isHanoiAddress(city: string): boolean {
  if (!city || typeof city !== 'string') {
    return false;
  }

  // Remove accents and normalize the text
  const normalizedCity = city
    .toLowerCase()
    .trim()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .replace(/\s+/g, ' '); // Normalize whitespace

  // Check for various Hanoi representations
  const hanoiVariations = [
    'hanoi',
    'ha noi', 
    'hn',
    'hà nội',
    'hà noi',
    'hanoi city',
    'ha noi city'
  ];

  // Check if the normalized city matches any Hanoi variation exactly
  return hanoiVariations.some(variation => {
    const normalizedVariation = variation
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return normalizedCity === normalizedVariation;
  });
}

/**
 * Validates if an address is eligible for rush delivery
 * Currently only checks city, but can be extended for districts
 * 
 * @param address - Address object with city field
 * @returns true if address is eligible for rush delivery
 */
export function isAddressRushEligible(address: { city: string }): boolean {
  return isHanoiAddress(address.city);
}
