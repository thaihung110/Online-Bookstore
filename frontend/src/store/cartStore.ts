import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Cart,
  CartItem,
  getCart as apiGetCart,
  addToCart as apiAddToCart,
  removeFromCart as apiRemoveFromCart,
  updateCartItem as apiUpdateCartItem,
  updateCartItemSelection as apiUpdateCartItemSelection,
  clearCart as apiClearCart,
  validateCart as apiValidateCart,
  CartValidationResult,
  CartValidationIssue,
} from "../api/cart";

// Use ApiCartItem directly or ensure BookCartItem is compatible
export type BookCartItem = CartItem;

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  validationResult: CartValidationResult | null;
  isValidating: boolean;

  // Actions
  loadCart: () => Promise<void>;
  addItem: (bookId: string, quantity: number, isTicked?: boolean) => Promise<void>;
  updateItemQuantity: (bookId: string, quantity: number) => Promise<void>;
  updateItemSelection: (bookId: string, isTicked: boolean) => Promise<void>;
  updateItem: (bookId: string, updates: { quantity?: number; isTicked?: boolean }) => Promise<void>;
  removeItem: (bookId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  validateCart: () => Promise<void>;
  setError: (error: string | null) => void;
  // Getters
  isInCart: (bookId: string) => boolean;
  getCartItems: () => CartItem[];
  getSelectedItems: () => CartItem[];
  getTotalPrice: () => number;
  getSelectedTotalPrice: () => number;
  getTotalQuantity: () => number;
  getTotalItems: () => number;
  getValidationIssues: () => CartValidationIssue[];
  hasValidationIssues: () => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set: any, get: any) => ({
      cart: null,
      isLoading: false,
      error: null,
      validationResult: null,
      isValidating: false,

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

      addItem: async (bookId: string, quantity: number, isTicked: boolean = true) => {
        try {
          console.log('[Cart Store] Adding item with bookId:', bookId);
          set({ isLoading: true, error: null });

          // Note: bookId here should be the MongoDB _id, but we need to ensure
          // the calling code passes the correct _id instead of the frontend id
          const updatedCart = await apiAddToCart({ bookId, quantity, isTicked });
          set({ cart: updatedCart, isLoading: false });
        } catch (error: any) {
          console.error('[Cart Store] Failed to add item:', error);
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
          console.log("[Cart Store] updateItemQuantity called with bookId:", bookId, "quantity:", quantity);
          set({ isLoading: true, error: null });

          // Note: For cart operations, we need to use the MongoDB _id
          // But the bookId passed here might be the frontend id, so we need to find the correct _id
          const cart = get().cart;
          let actualBookId = bookId;

          if (cart) {
            const item = cart.items.find((item: any) => item.book.id === bookId);
            if (item && item.book._id) {
              actualBookId = item.book._id;
              console.log("[Cart Store] Found MongoDB _id for update:", actualBookId);
            }
          }

          const updatedCart = await apiUpdateCartItem({
            bookId: actualBookId,
            quantity,
          });
          console.log("[Cart Store] API returned updated cart:", updatedCart);

          set({ cart: updatedCart, isLoading: false });
          console.log("[Cart Store] State updated successfully");
        } catch (error: any) {
          console.error("[Cart Store] Error updating item quantity:", error);
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to update item quantity",
            isLoading: false,
          });
        }
      },

      updateItemSelection: async (bookId: string, isTicked: boolean) => {
        try {
          set({ isLoading: true, error: null });

          // Find the MongoDB _id for the book
          const cart = get().cart;
          let actualBookId = bookId;

          if (cart) {
            const item = cart.items.find((item: any) => item.book.id === bookId);
            if (item && item.book._id) {
              actualBookId = item.book._id;
              console.log("[Cart Store] Found MongoDB _id for selection update:", actualBookId);
            }
          }

          const updatedCart = await apiUpdateCartItemSelection(actualBookId, isTicked);
          set({ cart: updatedCart, isLoading: false });
        } catch (error: any) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to update item selection",
            isLoading: false,
          });
        }
      },

      updateItem: async (bookId: string, updates: { quantity?: number; isTicked?: boolean }) => {
        try {
          set({ isLoading: true, error: null });

          // Find the MongoDB _id for the book
          const cart = get().cart;
          let actualBookId = bookId;

          if (cart) {
            const item = cart.items.find((item: any) => item.book.id === bookId);
            if (item && item.book._id) {
              actualBookId = item.book._id;
              console.log("[Cart Store] Found MongoDB _id for item update:", actualBookId);
            }
          }

          const updatedCart = await apiUpdateCartItem({
            bookId: actualBookId,
            ...updates,
          });
          set({ cart: updatedCart, isLoading: false });
        } catch (error: any) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to update item",
            isLoading: false,
          });
        }
      },

      removeItem: async (bookId: string) => {
        try {
          set({ isLoading: true, error: null });

          // Find the MongoDB _id for the book
          const cart = get().cart;
          let actualBookId = bookId;

          if (cart) {
            const item = cart.items.find((item: any) => item.book.id === bookId);
            if (item && item.book._id) {
              actualBookId = item.book._id;
              console.log("[Cart Store] Found MongoDB _id for item removal:", actualBookId);
            }
          }

          const updatedCart = await apiRemoveFromCart(actualBookId);
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
          set({ cart: emptyCart, isLoading: false, validationResult: null });
        } catch (error: any) {
          set({
            error:
              error instanceof Error ? error.message : "Failed to clear cart",
            isLoading: false,
          });
        }
      },

      validateCart: async () => {
        try {
          set({ isValidating: true, error: null });
          const validationResult = await apiValidateCart();
          set({ validationResult, isValidating: false });
        } catch (error: any) {
          set({
            error:
              error instanceof Error ? error.message : "Failed to validate cart",
            isValidating: false,
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
        const items = cart ? cart.items : [];
        console.log('[Cart Store] getCartItems called, returning:', items);
        console.log('[Cart Store] Cart object:', cart);
        return items;
      },

      getSelectedItems: () => {
        const cart = get().cart;
        if (!cart) return [];
        return cart.items.filter((item: CartItem) => item.isTicked);
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

      getSelectedTotalPrice: () => {
        const cart = get().cart;
        if (!cart) return 0;
        return cart.items
          .filter((item: CartItem) => item.isTicked)
          .reduce(
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

      getValidationIssues: () => {
        const validationResult = get().validationResult;
        return validationResult ? validationResult.issues : [];
      },

      hasValidationIssues: () => {
        const validationResult = get().validationResult;
        return validationResult ? !validationResult.isValid : false;
      },
    }),
    {
      name: "cart-storage",
      partialize: (state: CartState) => ({ cart: state.cart }),
    } as any
  )
);
