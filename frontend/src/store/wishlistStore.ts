import { create } from "zustand";
import * as wishlistApi from "../api/wishlist";
import { WishlistItem, Wishlist } from "../api/wishlist";
import { Book } from "../api/books"; // Assuming Book interface is in books.ts

interface WishlistState {
  wishlist: Wishlist | null;
  isLoading: boolean;
  error: string | null;
  loadWishlist: () => Promise<void>;
  addItemToWishlist: (book: Book) => Promise<void>;
  removeItemFromWishlist: (bookId: string) => Promise<void>;
  isItemInWishlist: (bookId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  wishlist: null,
  isLoading: false,
  error: null,

  loadWishlist: async () => {
    set({ isLoading: true, error: null });
    try {
      const wishlistData = await wishlistApi.getWishlist();
      set({ wishlist: wishlistData, isLoading: false });
    } catch (err) {
      const error =
        err instanceof Error ? err.message : "Failed to load wishlist";
      set({ error, isLoading: false });
      console.error(error);
    }
  },

  addItemToWishlist: async (book: Book) => {
    set({ isLoading: true, error: null });
    try {
      // Check if item already exists to prevent duplicate API calls if UI doesn't check
      if (get().isItemInWishlist(book.id)) {
        // Optionally, set an error or simply return if already in wishlist
        // For now, let API handle the error if it's an actual duplicate attempt
        // set({ error: 'Item already in wishlist', isLoading: false });
        // return;
      }
      await wishlistApi.addToWishlist(book.id, book);
      // Instead of returning the item, we reload the whole wishlist to ensure consistency
      // This is simpler for mock APIs; real APIs might return the updated wishlist or item
      await get().loadWishlist(); // Reload wishlist to reflect changes
    } catch (err) {
      const error =
        err instanceof Error ? err.message : "Failed to add item to wishlist";
      set({ error, isLoading: false });
      console.error(error);
      // Propagate the error so UI can react
      throw err;
    }
  },

  removeItemFromWishlist: async (bookId: string) => {
    set({ isLoading: true, error: null });
    try {
      await wishlistApi.removeFromWishlist(bookId);
      await get().loadWishlist(); // Reload wishlist to reflect changes
    } catch (err) {
      const error =
        err instanceof Error
          ? err.message
          : "Failed to remove item from wishlist";
      set({ error, isLoading: false });
      console.error(error);
      // Propagate the error so UI can react
      throw err;
    }
  },

  isItemInWishlist: (bookId: string) => {
    const { wishlist } = get();
    return wishlist?.items.some((item) => item.book.id === bookId) || false;
  },
}));

// Optional: Load wishlist when store is initialized or app starts
// This can also be done in App.tsx or a similar top-level component
// useWishlistStore.getState().loadWishlist();
