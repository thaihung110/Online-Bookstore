import { create } from "zustand";
import { getOrders, getOrder, updateOrder, deleteOrder } from "../api/orderApi";
import {
  Order,
  OrderFilters,
  OrderFormData,
  OrderListResponse,
} from "../types/order.types";

interface OrderState {
  // Orders list
  orders: Order[];
  totalOrders: number;
  currentPage: number;
  totalPages: number;
  limit: number;

  // Current order
  currentOrder: Order | null;

  // Loading states
  isLoading: boolean;
  isLoadingOrder: boolean;
  isUpdating: boolean;
  isDeleting: boolean;

  // Error states
  error: string | null;
  orderError: string | null;
  updateError: string | null;
  deleteError: string | null;

  // Filters
  filters: OrderFilters;

  // Actions
  setFilters: (filters: Partial<OrderFilters>) => void;
  fetchOrders: () => Promise<void>;
  fetchOrder: (id: string) => Promise<void>;
  updateOrderStatus: (id: string, data: OrderFormData) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  clearCurrentOrder: () => void;
  resetErrors: () => void;
}

const defaultFilters: OrderFilters = {
  page: 1,
  limit: 10,
  sortBy: "createdAt",
  sortOrder: "desc",
};

export const useOrderStore = create<OrderState>((set, get) => ({
  // State
  orders: [],
  totalOrders: 0,
  currentPage: 1,
  totalPages: 1,
  limit: 10,
  currentOrder: null,
  isLoading: false,
  isLoadingOrder: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  orderError: null,
  updateError: null,
  deleteError: null,
  filters: defaultFilters,

  // Actions
  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  fetchOrders: async () => {
    try {
      set({ isLoading: true, error: null });

      const response: OrderListResponse = await getOrders(get().filters);

      set({
        orders: response.orders,
        totalOrders: response.total,
        currentPage: response.page,
        totalPages: response.totalPages,
        limit: response.limit,
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch orders",
        isLoading: false,
      });
    }
  },

  fetchOrder: async (id: string) => {
    try {
      set({ isLoadingOrder: true, orderError: null });

      const order = await getOrder(id);

      set({
        currentOrder: order,
        isLoadingOrder: false,
      });
    } catch (error) {
      set({
        orderError:
          error instanceof Error ? error.message : "Failed to fetch order",
        isLoadingOrder: false,
      });
    }
  },

  updateOrderStatus: async (id: string, data: OrderFormData) => {
    try {
      set({ isUpdating: true, updateError: null });

      const updatedOrder = await updateOrder(id, data);

      // Update current order if it matches
      if (get().currentOrder?.id === id) {
        set({ currentOrder: updatedOrder });
      }

      // Update order in list if it exists
      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === id ? updatedOrder : order
        ),
        isUpdating: false,
      }));
    } catch (error) {
      set({
        updateError:
          error instanceof Error ? error.message : "Failed to update order",
        isUpdating: false,
      });
    }
  },

  deleteOrder: async (id: string) => {
    try {
      set({ isDeleting: true, deleteError: null });

      await deleteOrder(id);

      // Remove order from list
      set((state) => ({
        orders: state.orders.filter((order) => order.id !== id),
        isDeleting: false,
        // Clear current order if it was deleted
        currentOrder: state.currentOrder?.id === id ? null : state.currentOrder,
      }));
    } catch (error) {
      set({
        deleteError:
          error instanceof Error ? error.message : "Failed to delete order",
        isDeleting: false,
      });
    }
  },

  clearCurrentOrder: () => {
    set({ currentOrder: null });
  },

  resetErrors: () => {
    set({
      error: null,
      orderError: null,
      updateError: null,
      deleteError: null,
    });
  },
}));
