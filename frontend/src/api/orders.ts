import api from "./axios";
import { Book } from "./books";

// Transform raw book data from backend to frontend format (reused from cart.ts)
const transformBookData = (bookData: any): Book => {
  const id = bookData._id || bookData.id || "";
  const originalPrice = Number(bookData.originalPrice) || bookData.price;
  const discountRate = Number(bookData.discountRate) || 0;
  const price = Number(bookData.price);
  const rating = bookData.rating
    ? Number(bookData.rating)
    : bookData.averageRating
    ? Number(bookData.averageRating)
    : undefined;
  const stock = Number(bookData.stock) || 0;
  const pageCount = bookData.pageCount ? Number(bookData.pageCount) : undefined;
  const genres = Array.isArray(bookData.genres) ? bookData.genres : [];

  return {
    id,
    title: bookData.title?.trim() || "",
    author: bookData.author?.trim() || "",
    description: bookData.description?.trim() || "",
    originalPrice,
    discountRate,
    price,
    coverImage: bookData.coverImage,
    isbn: bookData.isbn || "",
    genres,
    publisher: bookData.publisher?.trim() || "",
    publicationYear: bookData.publicationYear || 0,
    rating,
    stock,
    pageCount,
  };
};

// Enums and Types
export enum PaymentMethod {
  CASH = "COD", // Updated to match MongoDB validation
  VNPAY = "VNPAY", // Updated to match MongoDB validation
  PAYPAL = "paypal",
  GIFT_CARD = "gift_card",
  LOYALTY_POINTS = "loyalty_points",
  MOCK = "mock",
}

export enum OrderStatus {
  PENDING = "PENDING",
  RECEIVED = "RECEIVED",
  CONFIRMED = "CONFIRMED",
  PREPARED = "PREPARED",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

// Interfaces
export interface OrderItem {
  book: Book | string; // Can be populated Book object or just ID
  quantity: number;
  price: number;
  discount: number;
  title: string;
  author: string;
}

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
  email: string;
}

export interface PaymentInfo {
  method: PaymentMethod;
  transactionId?: string;
  isPaid: boolean;
  paidAt?: string;
  giftCardCode?: string;
  loyaltyPointsUsed?: number;
}

export interface Order {
  _id: string;
  id?: string; // Virtual field from backend transform
  user: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentInfo: PaymentInfo;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  status: OrderStatus;
  trackingNumber?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  refundedAt?: string;
  isGift: boolean;
  giftMessage?: string;
  loyaltyPointsEarned: number;
  notes: string[];
  createdAt: string;
  updatedAt: string;
}

// Request DTOs
export interface CreateOrderItemRequest {
  bookId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  items: CreateOrderItemRequest[];
  shippingAddress: ShippingAddress;
  paymentInfo: {
    method: PaymentMethod;
    transactionId?: string;
  };
  isGift?: boolean;
  giftMessage?: string;
}

export interface UpdateOrderRequest {
  status?: OrderStatus;
  trackingNumber?: string;
  notes?: string[];
}

export interface CreateOrderFromCartRequest {
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phoneNumber?: string;
    email: string;
  };
  paymentInfo: {
    method: PaymentMethod;
    paymentId?: string;
    transactionId?: string;
  };
  isGift?: boolean;
  giftMessage?: string;
  isRushOrder?: boolean;
  rushDeliveryTime?: Date;
  rushInstructions?: string;
}

export interface OrderViewResponse {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    items: Array<{
      title: string;
      author: string;
      price: number;
      quantity: number;
      discount?: number;
    }>;
    total: number;
    subtotal: number;
    tax: number;
    shippingCost: number;
    shippingAddress: {
      fullName: string;
      phone: string;
      address: string;
      city: string;
    };
    createdAt: string;
    receivedAt?: string;
  };
  payment: {
    id: string;
    status: string;
    method: string;
    amount: number;
    transactionId?: string;
    bankCode?: string;
    completedAt?: string;
  } | null;
  canRefund: boolean;
}

export interface RefundResponse {
  success: boolean;
  message: string;
  orderId?: string;
  paymentId?: string;
  refundAmount?: number;
  orderStatus?: string;
  paymentStatus?: string;
  error?: any;
}

// Response interfaces
export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Transform order data from backend to frontend format
const transformOrderData = (orderData: any): Order => {
  return {
    ...orderData,
    _id: orderData._id || orderData.id || "unknown",
    id: orderData.id || orderData._id || "unknown", // Ensure id field is available
    items:
      orderData.items?.map((item: any) => ({
        ...item,
        book:
          typeof item.book === "object"
            ? transformBookData(item.book)
            : item.book,
      })) || [],
    createdAt: orderData.createdAt || new Date().toISOString(),
    updatedAt: orderData.updatedAt || new Date().toISOString(),
  };
};

// Transform order list response
const transformOrderListResponse = (response: any): OrderListResponse => {
  return {
    orders:
      response.orders?.map(transformOrderData) ||
      response.map?.(transformOrderData) ||
      [],
    total: response.total || response.length || 0,
    page: response.page || 1,
    limit: response.limit || 10,
    totalPages:
      response.totalPages ||
      Math.ceil(
        (response.total || response.length || 0) / (response.limit || 10)
      ),
  };
};

// --- API Functions ---

/**
 * Creates a new order.
 * @param orderData The order data to create
 * @returns Promise<Order> The created order
 */
export const createOrder = async (
  orderData: CreateOrderRequest
): Promise<Order> => {
  try {
    console.log("[Order API] Creating order:", orderData);
    const response = await api.post("/orders", orderData);
    console.log("[Order API] Order created successfully:", response.data);
    return transformOrderData(response.data);
  } catch (error: any) {
    console.error("Error creating order:", error);

    // Enhanced error handling with specific error messages
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          throw new Error(
            data.message || "Invalid order data. Please check your input."
          );
        case 401:
          throw new Error("Authentication required. Please log in.");
        case 403:
          throw new Error("You don't have permission to create orders.");
        case 404:
          throw new Error("One or more books in your order were not found.");
        case 409:
          throw new Error("Insufficient stock for one or more items.");
        case 500:
          throw new Error("Server error. Please try again later.");
        default:
          throw new Error(
            data.message || `Order creation failed with status ${status}`
          );
      }
    } else if (error.request) {
      throw new Error(
        "Network error. Please check your connection and try again."
      );
    } else {
      throw new Error("An unexpected error occurred while creating the order.");
    }
  }
};

/**
 * Fetches all orders for the current user.
 * @param params Optional query parameters for pagination and filtering
 * @returns Promise<OrderListResponse> List of orders with pagination info
 */
export const getUserOrders = async (params?: {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<OrderListResponse> => {
  try {
    console.log("[Order API] Fetching user orders:", params);

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const queryString = queryParams.toString();
    const url = queryString ? `/orders?${queryString}` : "/orders";

    const response = await api.get(url);
    console.log("[Order API] User orders fetched successfully:", response.data);

    // Handle both array response and paginated response
    if (Array.isArray(response.data)) {
      return transformOrderListResponse(response.data);
    } else {
      return transformOrderListResponse(response.data);
    }
  } catch (error: any) {
    console.error("Error fetching user orders:", error);

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          throw new Error("Authentication required. Please log in.");
        case 403:
          throw new Error("You don't have permission to view orders.");
        case 500:
          throw new Error("Server error. Please try again later.");
        default:
          throw new Error(
            data.message || `Failed to fetch orders with status ${status}`
          );
      }
    } else if (error.request) {
      throw new Error(
        "Network error. Please check your connection and try again."
      );
    } else {
      throw new Error("An unexpected error occurred while fetching orders.");
    }
  }
};

/**
 * Fetches a specific order by ID.
 * @param orderId The ID of the order to fetch
 * @returns Promise<Order> The order details
 */
export const getOrderById = async (orderId: string): Promise<Order> => {
  try {
    console.log("[Order API] Fetching order by ID:", orderId);
    const response = await api.get(`/orders/${orderId}`);
    console.log("[Order API] Order fetched successfully:", response.data);
    return transformOrderData(response.data);
  } catch (error: any) {
    console.error("Error fetching order by ID:", error);

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          throw new Error("Authentication required. Please log in.");
        case 403:
          throw new Error("You don't have permission to view this order.");
        case 404:
          throw new Error("Order not found.");
        case 500:
          throw new Error("Server error. Please try again later.");
        default:
          throw new Error(
            data.message || `Failed to fetch order with status ${status}`
          );
      }
    } else if (error.request) {
      throw new Error(
        "Network error. Please check your connection and try again."
      );
    } else {
      throw new Error("An unexpected error occurred while fetching the order.");
    }
  }
};

/**
 * Updates an existing order.
 * Note: Most order updates are restricted to admin users or specific status changes.
 * @param orderId The ID of the order to update
 * @param updateData The data to update
 * @returns Promise<Order> The updated order
 */
export const updateOrder = async (
  orderId: string,
  updateData: UpdateOrderRequest
): Promise<Order> => {
  try {
    console.log("[Order API] Updating order:", orderId, updateData);
    const response = await api.put(`/orders/${orderId}`, updateData);
    console.log("[Order API] Order updated successfully:", response.data);
    return transformOrderData(response.data);
  } catch (error: any) {
    console.error("Error updating order:", error);

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          throw new Error(
            data.message || "Invalid update data. Please check your input."
          );
        case 401:
          throw new Error("Authentication required. Please log in.");
        case 403:
          throw new Error("You don't have permission to update this order.");
        case 404:
          throw new Error("Order not found.");
        case 409:
          throw new Error("Order cannot be updated in its current state.");
        case 500:
          throw new Error("Server error. Please try again later.");
        default:
          throw new Error(
            data.message || `Failed to update order with status ${status}`
          );
      }
    } else if (error.request) {
      throw new Error(
        "Network error. Please check your connection and try again."
      );
    } else {
      throw new Error("An unexpected error occurred while updating the order.");
    }
  }
};

/**
 * Cancels an order (sets status to cancelled).
 * This is a safer alternative to deletion for user-facing operations.
 * @param orderId The ID of the order to cancel
 * @param reason Optional cancellation reason
 * @returns Promise<Order> The cancelled order
 */
export const cancelOrder = async (
  orderId: string,
  reason?: string
): Promise<Order> => {
  try {
    console.log("[Order API] Cancelling order:", orderId, reason);
    const updateData: UpdateOrderRequest = {
      status: OrderStatus.CANCELLED,
      ...(reason && { notes: [reason] }),
    };
    return await updateOrder(orderId, updateData);
  } catch (error) {
    console.error("Error cancelling order:", error);
    throw error;
  }
};

/**
 * Deletes an order (admin only - not recommended for user-facing operations).
 * @param orderId The ID of the order to delete
 * @returns Promise<void>
 */
export const deleteOrder = async (orderId: string): Promise<void> => {
  try {
    console.log("[Order API] Deleting order:", orderId);
    await api.delete(`/orders/${orderId}`);
    console.log("[Order API] Order deleted successfully");
  } catch (error: any) {
    console.error("Error deleting order:", error);

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          throw new Error("Authentication required. Please log in.");
        case 403:
          throw new Error("You don't have permission to delete this order.");
        case 404:
          throw new Error("Order not found.");
        case 409:
          throw new Error("Order cannot be deleted in its current state.");
        case 500:
          throw new Error("Server error. Please try again later.");
        default:
          throw new Error(
            data.message || `Failed to delete order with status ${status}`
          );
      }
    } else if (error.request) {
      throw new Error(
        "Network error. Please check your connection and try again."
      );
    } else {
      throw new Error("An unexpected error occurred while deleting the order.");
    }
  }
};

// --- New API Functions from Backend ---

/**
 * Creates an order from the current user's cart
 * @param orderData The order data including shipping address and payment method
 * @returns Promise<Order> The created order
 */
export const createOrderFromCart = async (
  orderData: CreateOrderFromCartRequest
): Promise<Order> => {
  try {
    console.log("[Order API] Creating order from cart:", orderData);
    const response = await api.post("/orders/from-cart", orderData);
    console.log(
      "[Order API] Order from cart created successfully:",
      response.data
    );
    return transformOrderData(response.data);
  } catch (error: any) {
    console.error("Error creating order from cart:", error);

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          throw new Error(data.message || "Invalid order data or empty cart.");
        case 401:
          throw new Error("Authentication required. Please log in.");
        case 403:
          throw new Error("You don't have permission to create orders.");
        case 404:
          throw new Error("Cart is empty or items not found.");
        case 409:
          throw new Error("Insufficient stock for one or more items in cart.");
        case 500:
          throw new Error("Server error. Please try again later.");
        default:
          throw new Error(
            data.message ||
              `Failed to create order from cart with status ${status}`
          );
      }
    } else if (error.request) {
      throw new Error(
        "Network error. Please check your connection and try again."
      );
    } else {
      throw new Error(
        "An unexpected error occurred while creating order from cart."
      );
    }
  }
};

/**
 * Views an order using a secure token (public access, no auth required)
 * @param token The secure token from email link
 * @returns Promise<OrderViewResponse> Order details with payment info
 */
export const viewOrderByToken = async (
  token: string
): Promise<OrderViewResponse> => {
  try {
    console.log("[Order API] Viewing order by token:", token);
    const response = await api.get(`/orders/view/${token}`);
    console.log("[Order API] Order viewed successfully:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error viewing order by token:", error);

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          throw new Error("Invalid token format.");
        case 404:
          throw new Error("Order not found or token expired.");
        case 500:
          throw new Error("Server error. Please try again later.");
        default:
          throw new Error(
            data.message || `Failed to view order with status ${status}`
          );
      }
    } else if (error.request) {
      throw new Error(
        "Network error. Please check your connection and try again."
      );
    } else {
      throw new Error("An unexpected error occurred while viewing the order.");
    }
  }
};

/**
 * Requests a refund using a secure token (public access, no auth required)
 * @param token The secure token from email link
 * @param reason The reason for refund request
 * @returns Promise<RefundResponse> Refund processing result
 */
export const requestRefundByToken = async (
  token: string,
  reason: string
): Promise<RefundResponse> => {
  try {
    console.log("[Order API] Requesting refund by token:", token, reason);
    const response = await api.post(`/orders/refund/${token}`, { reason });
    console.log("[Order API] Refund requested successfully:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error requesting refund by token:", error);

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          throw new Error(
            data.message || "Invalid token or refund not allowed."
          );
        case 404:
          throw new Error("Order not found or token expired.");
        case 409:
          throw new Error(
            "Order has already been refunded or cannot be refunded."
          );
        case 500:
          throw new Error("Server error. Please try again later.");
        default:
          throw new Error(
            data.message || `Failed to request refund with status ${status}`
          );
      }
    } else if (error.request) {
      throw new Error(
        "Network error. Please check your connection and try again."
      );
    } else {
      throw new Error("An unexpected error occurred while requesting refund.");
    }
  }
};

/**
 * Executes a refund using a secure token via GET request (direct link from email)
 * @param token The secure token from email link
 * @returns Promise<string> HTML response for refund result
 */
export const executeRefundByToken = async (token: string): Promise<string> => {
  try {
    console.log("[Order API] Executing refund by token:", token);
    const response = await api.get(`/orders/refund/${token}/execute`, {
      headers: {
        Accept: "text/html",
      },
    });
    console.log("[Order API] Refund executed successfully");
    return response.data;
  } catch (error: any) {
    console.error("Error executing refund by token:", error);

    if (error.response) {
      const { status, data } = error.response;
      // Return HTML error response if available
      if (typeof data === "string" && data.includes("<html>")) {
        return data;
      }

      switch (status) {
        case 400:
          throw new Error(
            data.message || "Invalid token or refund not allowed."
          );
        case 404:
          throw new Error("Order not found or token expired.");
        case 409:
          throw new Error("Order has already been refunded.");
        case 500:
          throw new Error("Server error. Please try again later.");
        default:
          throw new Error(
            data.message || `Failed to execute refund with status ${status}`
          );
      }
    } else if (error.request) {
      throw new Error(
        "Network error. Please check your connection and try again."
      );
    } else {
      throw new Error("An unexpected error occurred while executing refund.");
    }
  }
};

/**
 * Checks refund status using a secure token
 * @param token The secure token from email link
 * @returns Promise<any> Refund status information
 */
export const checkRefundStatus = async (token: string): Promise<any> => {
  try {
    console.log("[Order API] Checking refund status by token:", token);
    const response = await api.get(`/orders/refund-status/${token}`);
    console.log(
      "[Order API] Refund status checked successfully:",
      response.data
    );
    return response.data;
  } catch (error: any) {
    console.error("Error checking refund status by token:", error);

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 404:
          throw new Error("Order not found or token expired.");
        case 500:
          throw new Error("Server error. Please try again later.");
        default:
          throw new Error(
            data.message ||
              `Failed to check refund status with status ${status}`
          );
      }
    } else if (error.request) {
      throw new Error(
        "Network error. Please check your connection and try again."
      );
    } else {
      throw new Error(
        "An unexpected error occurred while checking refund status."
      );
    }
  }
};
