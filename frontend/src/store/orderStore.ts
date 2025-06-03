import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import {
  getUserOrders,
  getOrderById,
  createOrder,
  updateOrder,
  cancelOrder,
  Order,
  OrderListResponse,
  CreateOrderRequest,
  UpdateOrderRequest,
  OrderStatus,
} from "../api/orders";

// Order store state interface
export interface OrderState {
  // Data
  orders: Order[];
  currentOrder: Order | null;
  orderHistory: OrderListResponse | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingHistory: boolean;
  isCreatingOrder: boolean;
  isUpdatingOrder: boolean;
  
  // Error states
  error: string | null;
  historyError: string | null;
  createError: string | null;
  updateError: string | null;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  totalOrders: number;
  
  // Actions
  fetchUserOrders: (params?: {
    page?: number;
    limit?: number;
    status?: OrderStatus;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => Promise<void>;
  
  fetchOrderById: (orderId: string) => Promise<Order | null>;
  
  createNewOrder: (orderData: CreateOrderRequest) => Promise<Order | null>;
  
  updateExistingOrder: (orderId: string, updateData: UpdateOrderRequest) => Promise<Order | null>;
  
  cancelExistingOrder: (orderId: string, reason?: string) => Promise<Order | null>;
  
  // Utility actions
  clearErrors: () => void;
  clearCurrentOrder: () => void;
  reset: () => void;
  
  // Getters
  getOrderById: (orderId: string) => Order | undefined;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  hasOrders: () => boolean;
  getRecentOrders: (limit?: number) => Order[];
}

// Initial state
const initialState = {
  orders: [],
  currentOrder: null,
  orderHistory: null,
  isLoading: false,
  isLoadingHistory: false,
  isCreatingOrder: false,
  isUpdatingOrder: false,
  error: null,
  historyError: null,
  createError: null,
  updateError: null,
  currentPage: 1,
  totalPages: 0,
  totalOrders: 0,
};

export const useOrderStore = create<OrderState>()(
  devtools(
    persist(
      (set: any, get: any) => ({
        ...initialState,

        // Fetch user orders with optional filtering and pagination
        fetchUserOrders: async (params?: {
          page?: number;
          limit?: number;
          status?: OrderStatus;
          sortBy?: string;
          sortOrder?: 'asc' | 'desc';
        }) => {
          try {
            set({ isLoadingHistory: true, historyError: null });
            console.log('[Order Store] Fetching user orders:', params);
            
            const response = await getUserOrders(params);
            console.log('[Order Store] Orders fetched successfully:', response);
            
            set({
              orders: response.orders,
              orderHistory: response,
              currentPage: response.page,
              totalPages: response.totalPages,
              totalOrders: response.total,
              isLoadingHistory: false,
            });
          } catch (error: any) {
            console.error('[Order Store] Failed to fetch orders:', error);
            set({
              historyError: error.message || 'Failed to fetch orders',
              isLoadingHistory: false,
            });
          }
        },

        // Fetch a specific order by ID
        fetchOrderById: async (orderId: string) => {
          try {
            set({ isLoading: true, error: null });
            console.log('[Order Store] Fetching order by ID:', orderId);
            
            const order = await getOrderById(orderId);
            console.log('[Order Store] Order fetched successfully:', order);
            
            set({
              currentOrder: order,
              isLoading: false,
            });
            
            return order;
          } catch (error: any) {
            console.error('[Order Store] Failed to fetch order:', error);
            set({
              error: error.message || 'Failed to fetch order',
              isLoading: false,
            });
            return null;
          }
        },

        // Create a new order
        createNewOrder: async (orderData: CreateOrderRequest) => {
          try {
            set({ isCreatingOrder: true, createError: null });
            console.log('[Order Store] Creating new order:', orderData);
            
            const newOrder = await createOrder(orderData);
            console.log('[Order Store] Order created successfully:', newOrder);
            
            // Add the new order to the beginning of the orders list
            const currentOrders = get().orders;
            set({
              orders: [newOrder, ...currentOrders],
              currentOrder: newOrder,
              totalOrders: get().totalOrders + 1,
              isCreatingOrder: false,
            });
            
            return newOrder;
          } catch (error: any) {
            console.error('[Order Store] Failed to create order:', error);
            set({
              createError: error.message || 'Failed to create order',
              isCreatingOrder: false,
            });
            return null;
          }
        },

        // Update an existing order
        updateExistingOrder: async (orderId: string, updateData: UpdateOrderRequest) => {
          try {
            set({ isUpdatingOrder: true, updateError: null });
            console.log('[Order Store] Updating order:', orderId, updateData);
            
            const updatedOrder = await updateOrder(orderId, updateData);
            console.log('[Order Store] Order updated successfully:', updatedOrder);
            
            // Update the order in the orders list
            const currentOrders = get().orders;
            const updatedOrders = currentOrders.map((order: Order) =>
              order._id === orderId ? updatedOrder : order
            );
            
            set({
              orders: updatedOrders,
              currentOrder: get().currentOrder?._id === orderId ? updatedOrder : get().currentOrder,
              isUpdatingOrder: false,
            });
            
            return updatedOrder;
          } catch (error: any) {
            console.error('[Order Store] Failed to update order:', error);
            set({
              updateError: error.message || 'Failed to update order',
              isUpdatingOrder: false,
            });
            return null;
          }
        },

        // Cancel an existing order
        cancelExistingOrder: async (orderId: string, reason?: string) => {
          try {
            set({ isUpdatingOrder: true, updateError: null });
            console.log('[Order Store] Cancelling order:', orderId, reason);
            
            const cancelledOrder = await cancelOrder(orderId, reason);
            console.log('[Order Store] Order cancelled successfully:', cancelledOrder);
            
            // Update the order in the orders list
            const currentOrders = get().orders;
            const updatedOrders = currentOrders.map((order: Order) =>
              order._id === orderId ? cancelledOrder : order
            );
            
            set({
              orders: updatedOrders,
              currentOrder: get().currentOrder?._id === orderId ? cancelledOrder : get().currentOrder,
              isUpdatingOrder: false,
            });
            
            return cancelledOrder;
          } catch (error: any) {
            console.error('[Order Store] Failed to cancel order:', error);
            set({
              updateError: error.message || 'Failed to cancel order',
              isUpdatingOrder: false,
            });
            return null;
          }
        },

        // Utility actions
        clearErrors: () => {
          set({
            error: null,
            historyError: null,
            createError: null,
            updateError: null,
          });
        },

        clearCurrentOrder: () => {
          set({ currentOrder: null });
        },

        reset: () => {
          set(initialState);
        },

        // Getters
        getOrderById: (orderId: string) => {
          return get().orders.find((order: Order) => order._id === orderId);
        },

        getOrdersByStatus: (status: OrderStatus) => {
          return get().orders.filter((order: Order) => order.status === status);
        },

        hasOrders: () => {
          return get().orders.length > 0;
        },

        getRecentOrders: (limit = 5) => {
          return get().orders
            .sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limit);
        },
      }),
      {
        name: "order-store",
        // Only persist essential data, not loading states
        partialize: (state: OrderState) => ({
          orders: state.orders,
          currentOrder: state.currentOrder,
          orderHistory: state.orderHistory,
          currentPage: state.currentPage,
          totalPages: state.totalPages,
          totalOrders: state.totalOrders,
        }),
      }
    ),
    { name: "order-store" }
  )
);
