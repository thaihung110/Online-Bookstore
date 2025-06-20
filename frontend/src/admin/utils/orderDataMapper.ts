/**
 * Data mapping utilities for transforming backend order data to frontend format
 * Handles field name differences and data structure transformations
 */

import { Order, OrderItem, OrderListResponse } from "../types/order.types";

// Backend order structure (from API response)
interface BackendOrder {
  _id: string;
  user: {
    _id?: string;
    username: string;
    email: string;
  };
  items: BackendOrderItem[];
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phoneNumber?: string;
  };
  paymentInfo: any;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  status: string;
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

interface BackendOrderItem {
  book: {
    _id: string;
    title: string;
    author: string;
    price: number;
    coverImage?: string;
  };
  quantity: number;
  price: number;
  discount?: number;
  title: string;
  author: string;
}

interface BackendOrderListResponse {
  orders: BackendOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Transform backend order item to frontend format
 */
export const mapOrderItem = (backendItem: BackendOrderItem): OrderItem => {
  return {
    book: {
      id: backendItem.book._id,
      title: backendItem.book.title || backendItem.title,
      author: backendItem.book.author || backendItem.author,
      price: backendItem.book.price || backendItem.price,
      coverImage: backendItem.book.coverImage || "",
    },
    quantity: backendItem.quantity,
    price: backendItem.price,
  };
};

/**
 * Transform backend shipping address to frontend string format
 */
export const mapShippingAddress = (backendAddress: BackendOrder['shippingAddress']): string => {
  const parts = [
    backendAddress.addressLine1,
    backendAddress.addressLine2,
    backendAddress.city,
    backendAddress.state,
    backendAddress.postalCode,
    backendAddress.country,
  ].filter(Boolean);
  
  return parts.join(", ");
};

/**
 * Transform backend order to frontend format
 */
export const mapOrder = (backendOrder: BackendOrder): Order => {
  return {
    id: backendOrder._id,
    user: {
      id: backendOrder.user._id || backendOrder.user.username, // Fallback to username if _id not available
      name: backendOrder.user.username,
      email: backendOrder.user.email,
    },
    items: backendOrder.items.map(mapOrderItem),
    status: backendOrder.status,
    totalAmount: backendOrder.total, // Backend 'total' → Frontend 'totalAmount'
    shippingAddress: mapShippingAddress(backendOrder.shippingAddress),
    trackingNumber: backendOrder.trackingNumber || null,
    notes: backendOrder.notes.join("; "), // Convert array to string
    createdAt: backendOrder.createdAt,
    updatedAt: backendOrder.updatedAt,
    // Add price breakdown fields for UI clarity
    subtotal: backendOrder.subtotal,
    tax: backendOrder.tax,
    shippingCost: backendOrder.shippingCost,
    discount: backendOrder.discount,
  };
};

/**
 * Transform backend order list response to frontend format
 */
export const mapOrderListResponse = (backendResponse: BackendOrderListResponse): OrderListResponse => {
  return {
    orders: backendResponse.orders.map(mapOrder),
    total: backendResponse.total,
    page: backendResponse.page,
    limit: backendResponse.limit,
    totalPages: backendResponse.totalPages,
  };
};

/**
 * Transform frontend order data to backend format for updates
 */
export const mapOrderDataToBackend = (frontendData: any) => {
  const backendData: any = { ...frontendData };
  
  // Ensure notes is always a string
  if (Array.isArray(frontendData.notes)) {
    backendData.notes = frontendData.notes.join('; ');
  } else if (typeof frontendData.notes !== 'string') {
    backendData.notes = '';
  }
  
  return backendData;
};

/**
 * Handle API errors and provide user-friendly messages
 */
export const handleApiError = (error: any): string => {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const message = error.response.data?.message || error.response.data?.error;
    
    switch (status) {
      case 401:
        return "Authentication failed. Please log in again.";
      case 403:
        return "Access denied. Admin privileges required.";
      case 404:
        return "Order not found.";
      case 400:
        return message || "Invalid request data.";
      case 500:
        return "Server error. Please try again later.";
      default:
        return message || `Request failed with status ${status}`;
    }
  } else if (error.request) {
    // Network error
    return "Network error. Please check your connection.";
  } else {
    // Other error
    return error.message || "An unexpected error occurred.";
  }
};
