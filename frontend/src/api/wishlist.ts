import api from "./axios";
import { Book } from "./books"; // Assuming Book interface is in books.ts

export interface WishlistItem {
  id: string;
  book: Book;
  addedAt: string; // ISO date string
}

export interface Wishlist {
  items: WishlistItem[];
  userId: string;
  totalItems: number;
}

// Backend response interfaces
interface BackendWishlistItem {
  _id: string;
  book: Book;
  addedAt: string;
}

interface BackendWishlistResponse {
  _id: string;
  userId: string;
  items: BackendWishlistItem[];
  totalItems: number;
}

/**
 * Get the current user's wishlist
 */
export const getWishlist = async (): Promise<Wishlist> => {
  try {
    const response = await api.get<BackendWishlistResponse>("/wishlists");

    // Transform the response to match our frontend interface
    const items = response.data.items.map((item: BackendWishlistItem) => ({
      id: item._id,
      book: item.book,
      addedAt: item.addedAt,
    }));

    return {
      userId: response.data.userId,
      items,
      totalItems: response.data.totalItems,
    };
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    // Return empty wishlist on error
    return {
      userId: "",
      items: [],
      totalItems: 0,
    };
  }
};

/**
 * Add a book to the wishlist
 */
export const addToWishlist = async (
  bookId: string,
  book: Book
): Promise<WishlistItem> => {
  try {
    const response = await api.post("/wishlists", { bookId });

    // Since the backend doesn't return the full book details in the response,
    // we'll use the book object passed to this function
    return {
      id: response.data._id || `temp_${Date.now()}`,
      book,
      addedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    throw error;
  }
};

/**
 * Remove a book from the wishlist
 */
export const removeFromWishlist = async (
  bookId: string
): Promise<{ bookId: string }> => {
  try {
    await api.delete(`/wishlists/${bookId}`);
    return { bookId };
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    throw error;
  }
};
