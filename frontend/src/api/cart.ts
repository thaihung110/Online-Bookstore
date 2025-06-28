import api from "./axios";
import { Book } from "./books"; // Assuming Book type is needed for cart items
import { Product } from "../types/product.types"; // Import generic Product type

// Transform raw product data from backend to frontend format
const transformProductData = (productData: any): Product => {
  console.log("[Cart API] Transforming product data:", productData);

  // Handle null/undefined data
  if (!productData) {
    console.error("[Cart API] Product data is null/undefined");
    throw new Error("Product data is missing");
  }

  // Convert _id to id if necessary, but preserve _id for backend operations
  const id = productData._id || productData.id || "";
  const _id = productData._id || productData.id || ""; // Preserve original _id

  // Common fields for all product types
  const baseProduct = {
    id,
    _id, // Include original MongoDB _id
    productType: productData.productType || "BOOK",
    title: productData.title?.trim() || "",
    description: productData.description?.trim() || "",
    originalPrice:
      Number(productData.originalPrice) || Number(productData.price) || 0,
    discountRate: Number(productData.discountRate) || 0,
    price: Number(productData.price) || 0,
    coverImage: productData.coverImage,
    stock: Number(productData.stock) || 0,
    isAvailable: productData.isAvailable !== false,
    isFeatured: productData.isFeatured || false,
    isAvailableRush: productData.isAvailableRush !== false, // Default to true for backward compatibility
    createdAt: productData.createdAt,
    updatedAt: productData.updatedAt,
  };

  // Handle different product types
  switch (productData.productType) {
    case "CD":
      return {
        ...baseProduct,
        productType: "CD" as const,
        artist: productData.artist?.trim() || "",
        albumTitle: productData.albumTitle?.trim() || "",
        trackList: productData.trackList || "",
        category: productData.category || "",
        releaseddate: productData.releaseddate || new Date(),
      };

    case "DVD":
      return {
        ...baseProduct,
        productType: "DVD" as const,
        director: productData.director?.trim() || "",
        runtime: Number(productData.runtime) || 0,
        studio: productData.studio?.trim() || "",
        subtitles: productData.subtitles || "",
        releaseddate: productData.releaseddate || new Date(),
        filmtype: productData.filmtype || "",
        disctype: productData.disctype || "",
      };

    case "BOOK":
    default:
      // Handle books and fallback for unknown types
      const rating = productData.rating
        ? Number(productData.rating)
        : productData.averageRating
        ? Number(productData.averageRating)
        : undefined;
      const pageCount = productData.pageCount
        ? Number(productData.pageCount)
        : undefined;
      const genres = Array.isArray(productData.genres)
        ? productData.genres
        : [];

      return {
        ...baseProduct,
        productType: "BOOK" as const,
        author: productData.author?.trim() || "",
        isbn: productData.isbn || "",
        genres,
        publisher: productData.publisher?.trim() || "",
        publicationYear: productData.publicationYear || 0,
        rating,
        pageCount,
        language: productData.language || "English",
        totalRatings: productData.totalRatings || 0,
        publishedDate: productData.publishedDate,
        category: productData.category, // For backward compatibility
        converImage: productData.converImage, // For backward compatibility
      };
  }
};

// Transform cart data from backend to frontend format
const transformCartData = (cartData: any): Cart => {
  console.log("[Cart API] Transforming cart data:", cartData);
  return {
    ...cartData,
    items:
      cartData.items?.map((item: any) => {
        console.log("[Cart API] Transforming cart item:", item);
        return {
          ...item,
          product: transformProductData(item.product), // Use generic product transform
        };
      }) || [],
  };
};

// Interface for a cart item
export interface CartItem {
  _id?: string;
  product: Product; // Use generic Product instead of just Book
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
  shippingCost: number;
  taxAmount: number;
  discount: number;
  total: number;
  appliedCouponCode?: string;
  appliedGiftCardCode?: string;
  loyaltyPointsToUse?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Request to add an item to the cart
export interface AddToCartRequest {
  productId: string;
  quantity: number;
  isTicked?: boolean;
}

// Request to update item in cart (quantity and/or selection)
export interface UpdateCartItemRequest {
  productId: string;
  quantity?: number;
  isTicked?: boolean;
}

// --- API Functions ---

/**
 * Fetches the current user's cart.
 */
export const getCart = async (): Promise<Cart> => {
  try {
    const response = await api.get("/carts");
    return transformCartData(response.data);
  } catch (error) {
    console.error("Error fetching cart:", error);
    // Return empty cart on error
    return {
      _id: "",
      user: "",
      items: [],
      subtotal: 0,
      shippingCost: 0,
      taxAmount: 0,
      discount: 0,
      total: 0,
    };
  }
};

/**
 * Adds an item to the cart.
 */
export const addToCart = async (itemData: AddToCartRequest): Promise<Cart> => {
  try {
    console.log("[Cart API] Adding item to cart:", itemData);
    const response = await api.post("/carts/items", itemData);
    console.log("[Cart API] Add to cart response:", response.data);
    return transformCartData(response.data);
  } catch (error) {
    console.error("Error adding item to cart:", error);
    console.error("Request data was:", itemData);
    throw error;
  }
};

/**
 * Removes an item from the cart.
 * @param productId The ID of the product to remove.
 */
export const removeFromCart = async (productId: string): Promise<Cart> => {
  try {
    const response = await api.delete(`/carts/items/${productId}`);
    return transformCartData(response.data);
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
    if (itemData.quantity !== undefined)
      updatePayload.quantity = itemData.quantity;
    if (itemData.isTicked !== undefined)
      updatePayload.isTicked = itemData.isTicked;

    const response = await api.patch(
      `/carts/items/${itemData.productId}`,
      updatePayload
    );
    return transformCartData(response.data);
  } catch (error) {
    console.error("Error updating cart item:", error);
    throw error;
  }
};

/**
 * Updates the quantity of an item in the cart.
 * @deprecated Use updateCartItem instead for better flexibility
 */
export const updateCartItemQuantity = async (itemData: {
  productId: string;
  quantity: number;
}): Promise<Cart> => {
  return updateCartItem(itemData);
};

/**
 * Updates the selection status of an item in the cart.
 */
export const updateCartItemSelection = async (
  productId: string,
  isTicked: boolean
): Promise<Cart> => {
  return updateCartItem({ productId, isTicked });
};

/**
 * Clears all items from the cart.
 */
export const clearCart = async (): Promise<Cart> => {
  try {
    const response = await api.delete("/carts");
    return transformCartData(response.data);
  } catch (error) {
    console.error("Error clearing cart:", error);
    throw error;
  }
};

// Interface for cart validation results
export interface CartValidationIssue {
  productId: string;
  type: "stock" | "price" | "unavailable";
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
