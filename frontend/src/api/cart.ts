import api from "./axios";
import { Book } from "./books"; // Assuming Book type is needed for cart items

// Interface for a cart item
export interface CartItem {
  _id?: string;
  book: Book;
  quantity: number;
  priceAtAdd: number;
  isTicked: boolean;
}

// Interface for the cart structure
export interface Cart {
  _id: string; // Cart ID
  user: string; // User ID associated with the cart
  items: CartItem[];
  subtotal: number;
  discount: number;
  appliedCouponCode?: string;
  appliedGiftCardCode?: string;
  loyaltyPointsToUse?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Request to add an item to the cart
export interface AddToCartRequest {
  bookId: string;
  quantity: number;
  isTicked?: boolean;
}

// Request to update item in cart (quantity and/or selection)
export interface UpdateCartItemRequest {
  bookId: string;
  quantity?: number;
  isTicked?: boolean;
}

// --- API Functions ---

/**
 * Fetches the current user's cart.
 */
export const getCart = async (): Promise<Cart> => {
  try {
    const response = await api.get<Cart>("/carts");
    return response.data;
  } catch (error) {
    console.error("Error fetching cart:", error);
    // Return empty cart on error
    return {
      _id: "",
      user: "",
      items: [],
      subtotal: 0,
      discount: 0,
    };
  }
};

/**
 * Adds an item to the cart.
 */
export const addToCart = async (itemData: AddToCartRequest): Promise<Cart> => {
  try {
    const response = await api.post<Cart>("/carts/items", itemData);
    return response.data;
  } catch (error) {
    console.error("Error adding item to cart:", error);
    throw error;
  }
};

/**
 * Removes an item from the cart.
 * @param bookId The ID of the book to remove.
 */
export const removeFromCart = async (bookId: string): Promise<Cart> => {
  try {
    const response = await api.delete<Cart>(`/carts/items/${bookId}`);
    return response.data;
  } catch (error) {
    console.error("Error removing item from cart:", error);
    throw error;
  }
};

/**
 * Updates an item in the cart (quantity and/or selection status).
 */
export const updateCartItem = async (
  itemData: UpdateCartItemRequest
): Promise<Cart> => {
  try {
    const updatePayload: { quantity?: number; isTicked?: boolean } = {};
    if (itemData.quantity !== undefined) updatePayload.quantity = itemData.quantity;
    if (itemData.isTicked !== undefined) updatePayload.isTicked = itemData.isTicked;

    const response = await api.patch<Cart>(`/carts/items/${itemData.bookId}`, updatePayload);
    return response.data;
  } catch (error) {
    console.error("Error updating cart item:", error);
    throw error;
  }
};

/**
 * Updates the quantity of an item in the cart.
 * @deprecated Use updateCartItem instead for better flexibility
 */
export const updateCartItemQuantity = async (
  itemData: { bookId: string; quantity: number }
): Promise<Cart> => {
  return updateCartItem(itemData);
};

/**
 * Updates the selection status of an item in the cart.
 */
export const updateCartItemSelection = async (
  bookId: string,
  isTicked: boolean
): Promise<Cart> => {
  return updateCartItem({ bookId, isTicked });
};

/**
 * Clears all items from the cart.
 */
export const clearCart = async (): Promise<Cart> => {
  try {
    const response = await api.delete<Cart>("/carts");
    return response.data;
  } catch (error) {
    console.error("Error clearing cart:", error);
    throw error;
  }
};

// Interface for cart validation results
export interface CartValidationIssue {
  bookId: string;
  type: 'stock' | 'price' | 'unavailable';
  message: string;
  currentStock?: number;
  requestedQuantity?: number;
  currentPrice?: number;
  cartPrice?: number;
}

export interface CartValidationResult {
  isValid: boolean;
  issues: CartValidationIssue[];
}

/**
 * Validates cart items for stock and price changes.
 */
export const validateCart = async (): Promise<CartValidationResult> => {
  try {
    const response = await api.get<CartValidationResult>("/carts/validate");
    return response.data;
  } catch (error) {
    console.error("Error validating cart:", error);
    throw error;
  }
};
