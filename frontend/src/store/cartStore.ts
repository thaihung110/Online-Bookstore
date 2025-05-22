import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Book } from "../api/books";
import {
  Cart,
  CartItem,
  getCart as apiGetCart,
  addToCart as apiAddToCart,
  removeFromCart as apiRemoveFromCart,
  updateCartItemQuantity as apiUpdateCartItemQuantity,
  clearCart as apiClearCart,
} from "../api/cart";

// Use ApiCartItem directly or ensure BookCartItem is compatible
export type BookCartItem = CartItem;

interface CartState {
  cart: Cart | null; // Store the whole cart object from API
  isLoading: boolean;
  error: string | null;

  // Actions
  loadCart: () => Promise<void>;
  addItem: (book: Book, quantity?: number) => Promise<void>;
  removeItem: (bookId: string) => Promise<void>;
  updateItemQuantity: (bookId: string, quantity: number) => Promise<void>; // Renamed for clarity
  clearCart: () => Promise<void>;
  isInCart: (bookId: string) => boolean;
  clearError: () => void;
  // Derived values (getters)
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getCartItems: () => BookCartItem[];
  getTotalQuantity: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: null,
      isLoading: false,
      error: null,

      loadCart: async () => {
        try {
          set({ isLoading: true, error: null });
          const cartData = await apiGetCart();
          set({ cart: cartData, isLoading: false });
        } catch (err) {
          const errorMsg =
            err instanceof Error ? err.message : "Failed to load cart";
          set({ error: errorMsg, isLoading: false, cart: null }); // Clear cart on load error
          console.error("loadCart error:", errorMsg);
        }
      },

      addItem: async (book: Book, quantity: number = 1) => {
        try {
          set({ isLoading: true, error: null });
          const cartData = await apiAddToCart({ bookId: book.id, quantity });
          set({ cart: cartData, isLoading: false });
        } catch (err) {
          const errorMsg =
            err instanceof Error ? err.message : "Failed to add item to cart";
          set({ error: errorMsg, isLoading: false });
          console.error("addItem error:", errorMsg);
        }
      },

      removeItem: async (bookId: string) => {
        try {
          set({ isLoading: true, error: null });
          const cartData = await apiRemoveFromCart(bookId);
          set({ cart: cartData, isLoading: false });
        } catch (err) {
          const errorMsg =
            err instanceof Error
              ? err.message
              : "Failed to remove item from cart";
          set({ error: errorMsg, isLoading: false });
          console.error("removeItem error:", errorMsg);
        }
      },

      updateItemQuantity: async (bookId: string, quantity: number) => {
        if (quantity < 1) {
          // Option 1: Remove item if quantity is less than 1
          // return get().removeItem(bookId);
          // Option 2: Set a minimum quantity (e.g., 1) - current API placeholder might not support this well
          // For now, let the API handle invalid quantities if any, or ensure UI prevents < 1.
          // We can also add a specific error message here.
          console.warn(
            "updateItemQuantity: quantity cannot be less than 1. API will handle this."
          );
        }
        try {
          set({ isLoading: true, error: null });
          const cartData = await apiUpdateCartItemQuantity({
            bookId,
            quantity,
          });
          set({ cart: cartData, isLoading: false });
        } catch (err) {
          const errorMsg =
            err instanceof Error
              ? err.message
              : "Failed to update item quantity";
          set({ error: errorMsg, isLoading: false });
          console.error("updateItemQuantity error:", errorMsg);
        }
      },

      clearCart: async () => {
        try {
          set({ isLoading: true, error: null });
          const cartData = await apiClearCart();
          set({ cart: cartData, isLoading: false });
        } catch (err) {
          const errorMsg =
            err instanceof Error ? err.message : "Failed to clear cart";
          set({ error: errorMsg, isLoading: false });
          console.error("clearCart error:", errorMsg);
        }
      },

      isInCart: (bookId: string) => {
        return (
          get().cart?.items.some((item) => item.book.id === bookId) || false
        );
      },

      clearError: () => set({ error: null }),

      // Derived values (getters)
      getTotalItems: () => get().cart?.totalItems || 0,
      getTotalPrice: () => get().cart?.totalPrice || 0,
      getCartItems: () => get().cart?.items || [],

      // Thêm hàm tính tổng số lượng sản phẩm
      getTotalQuantity: () => {
        const cart = get().cart;
        if (!cart || !cart.items) return 0;
        return cart.items.reduce(
          (total: number, item: BookCartItem) => total + item.quantity,
          0
        );
      },
    }),
    {
      name: "cart-storage", // Persist the whole cart object from API
      // We might not need to persist isLoading and error states,
      // but cart itself is good to persist for faster UI on reload before fetch.
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);
