import { create, StateCreator } from "zustand";
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
import { vndToUsd } from "../utils/currency";

// Use ApiCartItem directly or ensure BookCartItem is compatible
export type BookCartItem = CartItem;

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadCart: () => Promise<void>;
  addItem: (bookId: string, quantity: number) => Promise<void>;
  updateItemQuantity: (bookId: string, quantity: number) => Promise<void>;
  removeItem: (bookId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  setError: (error: string | null) => void;
  // Getters
  isInCart: (bookId: string) => boolean;
  getCartItems: () => CartItem[];
  getTotalPrice: () => number;
  getTotalQuantity: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set: any, get: any) => ({
      cart: null,
      isLoading: false,
      error: null,

      loadCart: async () => {
        try {
          set({ isLoading: true, error: null });
          const cart = await apiGetCart();
          set({ cart, isLoading: false });
        } catch (error: any) {
          set({
            error:
              error instanceof Error ? error.message : "Failed to load cart",
            isLoading: false,
          });
        }
      },

      addItem: async (bookId: string, quantity: number) => {
        try {
          set({ isLoading: true, error: null });
          const updatedCart = await apiAddToCart({ bookId, quantity });
          set({ cart: updatedCart, isLoading: false });
        } catch (error: any) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to add item to cart",
            isLoading: false,
          });
        }
      },

      updateItemQuantity: async (bookId: string, quantity: number) => {
        try {
          set({ isLoading: true, error: null });
          const updatedCart = await apiUpdateCartItemQuantity({
            bookId,
            quantity,
          });
          set({ cart: updatedCart, isLoading: false });
        } catch (error: any) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to update item quantity",
            isLoading: false,
          });
        }
      },

      removeItem: async (bookId: string) => {
        try {
          set({ isLoading: true, error: null });
          const updatedCart = await apiRemoveFromCart(bookId);
          set({ cart: updatedCart, isLoading: false });
        } catch (error: any) {
          set({
            error:
              error instanceof Error ? error.message : "Failed to remove item",
            isLoading: false,
          });
        }
      },

      clearCart: async () => {
        try {
          set({ isLoading: true, error: null });
          const emptyCart = await apiClearCart();
          set({ cart: emptyCart, isLoading: false });
        } catch (error: any) {
          set({
            error:
              error instanceof Error ? error.message : "Failed to clear cart",
            isLoading: false,
          });
        }
      },

      setError: (error: string | null) => set({ error }),

      // Getters
      isInCart: (bookId: string) => {
        const cart = get().cart;
        if (!cart) return false;
        return cart.items.some((item: CartItem) => item.book.id === bookId);
      },

      getCartItems: () => {
        const cart = get().cart;
        return cart ? cart.items : [];
      },

      getTotalPrice: () => {
        const cart = get().cart;
        if (!cart) return 0;
        return cart.items.reduce(
          (sum: number, item: CartItem) =>
            sum + item.priceAtAdd * item.quantity,
          0
        );
      },

      getTotalQuantity: () => {
        const cart = get().cart;
        if (!cart) return 0;
        return cart.items.reduce(
          (sum: number, item: CartItem) => sum + item.quantity,
          0
        );
      },

      getTotalItems: () => {
        const cart = get().cart;
        if (!cart) return 0;
        return cart.items.length;
      },
    }),
    {
      name: "cart-storage",
      partialize: (state: CartState) => ({ cart: state.cart }),
    } as any
  )
);
