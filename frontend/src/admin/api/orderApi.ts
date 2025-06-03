import axios from "axios";
import {
  Order,
  OrderFilters,
  OrderFormData,
  OrderListResponse,
} from "../types/order.types";
import {
  mapOrderListResponse,
  mapOrder,
  mapOrderDataToBackend,
  handleApiError,
} from "../utils/orderDataMapper";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

// Helper function to get admin token
const getAdminToken = (): string | null => {
  return localStorage.getItem("adminToken");
};

// Helper function to set auth header
const getAuthHeaders = () => {
  const token = getAdminToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Function to convert OrderFilters to query params
const buildQueryParams = (filters: OrderFilters): string => {
  const params = new URLSearchParams();

  if (filters.status) params.append("status", filters.status);
  if (filters.userId) params.append("userId", filters.userId);
  if (filters.minTotal !== undefined)
    params.append("minTotal", filters.minTotal.toString());
  if (filters.maxTotal !== undefined)
    params.append("maxTotal", filters.maxTotal.toString());
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.sortBy) params.append("sortBy", filters.sortBy);
  if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

  params.append("page", filters.page.toString());
  params.append("limit", filters.limit.toString());

  return params.toString();
};

// ✅ REAL API IMPLEMENTATION - Mock data removed
// All functions now use real backend API calls with proper data mapping

// Get all orders with filters - REAL API IMPLEMENTATION
export const getOrders = async (
  filters: OrderFilters
): Promise<OrderListResponse> => {
  try {
    console.log('[Admin API] Fetching orders with filters:', filters);

    // Make real API call to backend
    const response = await axios.get(
      `${API_URL}/admin/orders?${buildQueryParams(filters)}`,
      getAuthHeaders()
    );

    console.log('[Admin API] Raw backend response:', response.data);

    // Transform backend response to frontend format
    const transformedResponse = mapOrderListResponse(response.data);

    console.log('[Admin API] Transformed response:', transformedResponse);

    return transformedResponse;
  } catch (error) {
    console.error("Error fetching orders:", error);
    const errorMessage = handleApiError(error);
    throw new Error(errorMessage);
  }
};

// Get a single order by ID - REAL API IMPLEMENTATION
export const getOrder = async (id: string): Promise<Order> => {
  try {
    console.log(`[Admin API] Fetching order ${id}`);

    // Make real API call to backend
    const response = await axios.get(
      `${API_URL}/admin/orders/${id}`,
      getAuthHeaders()
    );

    console.log(`[Admin API] Raw order response:`, response.data);

    // Transform backend response to frontend format
    const transformedOrder = mapOrder(response.data);

    console.log(`[Admin API] Transformed order:`, transformedOrder);

    return transformedOrder;
  } catch (error) {
    console.error(`Error fetching order ${id}:`, error);
    const errorMessage = handleApiError(error);
    throw new Error(errorMessage);
  }
};

// Update an order - REAL API IMPLEMENTATION
export const updateOrder = async (
  id: string,
  orderData: OrderFormData
): Promise<Order> => {
  try {
    console.log(`[Admin API] Updating order ${id} with data:`, orderData);

    // Transform frontend data to backend format
    const backendData = mapOrderDataToBackend(orderData);

    console.log(`[Admin API] Backend update data:`, backendData);

    // Make real API call to backend
    const response = await axios.put(
      `${API_URL}/admin/orders/${id}`,
      backendData,
      getAuthHeaders()
    );

    console.log(`[Admin API] Update response:`, response.data);

    // Transform backend response to frontend format
    const transformedOrder = mapOrder(response.data);

    console.log(`[Admin API] Transformed updated order:`, transformedOrder);

    return transformedOrder;
  } catch (error) {
    console.error(`Error updating order ${id}:`, error);
    const errorMessage = handleApiError(error);
    throw new Error(errorMessage);
  }
};

// Delete an order - REAL API IMPLEMENTATION
export const deleteOrder = async (id: string): Promise<void> => {
  try {
    console.log(`[Admin API] Deleting order ${id}`);

    // Make real API call to backend
    await axios.delete(
      `${API_URL}/admin/orders/${id}`,
      getAuthHeaders()
    );

    console.log(`[Admin API] Order ${id} deleted successfully`);
  } catch (error) {
    console.error(`Error deleting order ${id}:`, error);
    const errorMessage = handleApiError(error);
    throw new Error(errorMessage);
  }
};
