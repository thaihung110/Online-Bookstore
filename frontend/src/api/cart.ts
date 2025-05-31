import api from "./axios";
import { Book } from "./books"; // Assuming Book type is needed for cart items

// Interface for a cart item
export interface CartItem {
  _id?: string;
  book: Book;
  quantity: number;
  priceAtAdd: number;
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
}

// Request to update item quantity in cart
export interface UpdateCartItemRequest {
  bookId: string;
  quantity: number;
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
 * Updates the quantity of an item in the cart.
 */
export const updateCartItemQuantity = async (
  itemData: UpdateCartItemRequest
): Promise<Cart> => {
  try {
    const response = await api.patch<Cart>(`/carts/items/${itemData.bookId}`, {
      quantity: itemData.quantity,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating cart item quantity:", error);
    throw error;
  }
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
