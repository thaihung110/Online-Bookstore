import axios from "axios";
import {
  Order,
  OrderFilters,
  OrderFormData,
  OrderListResponse,
} from "../types/order.types";

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

// Mock data for orders (temporary until backend is ready)
const MOCK_ORDERS: Order[] = [
  {
    id: "1",
    user: {
      id: "1",
      name: "John Doe",
      email: "john.doe@example.com",
    },
    items: [
      {
        book: {
          id: "101",
          title: "The Great Gatsby",
          author: "F. Scott Fitzgerald",
          price: 12.99,
          coverImage: "https://example.com/covers/gatsby.jpg",
        },
        quantity: 1,
        price: 12.99,
      },
      {
        book: {
          id: "102",
          title: "To Kill a Mockingbird",
          author: "Harper Lee",
          price: 14.99,
          coverImage: "https://example.com/covers/mockingbird.jpg",
        },
        quantity: 1,
        price: 14.99,
      },
    ],
    status: "delivered",
    totalAmount: 27.98,
    shippingAddress: "123 Main St, Anytown, USA",
    trackingNumber: "TRACK123456",
    notes: "Leave at door",
    createdAt: "2023-09-15T10:30:00Z",
    updatedAt: "2023-09-17T14:20:00Z",
  },
  {
    id: "2",
    user: {
      id: "2",
      name: "Jane Smith",
      email: "jane.smith@example.com",
    },
    items: [
      {
        book: {
          id: "103",
          title: "1984",
          author: "George Orwell",
          price: 11.99,
          coverImage: "https://example.com/covers/1984.jpg",
        },
        quantity: 2,
        price: 23.98,
      },
    ],
    status: "processing",
    totalAmount: 23.98,
    shippingAddress: "456 Oak Ave, Somewhere, USA",
    trackingNumber: null,
    notes: "",
    createdAt: "2023-09-20T09:15:00Z",
    updatedAt: "2023-09-20T09:15:00Z",
  },
  {
    id: "3",
    user: {
      id: "3",
      name: "Admin User",
      email: "admin@bookstore.com",
    },
    items: [
      {
        book: {
          id: "104",
          title: "The Hobbit",
          author: "J.R.R. Tolkien",
          price: 16.99,
          coverImage: "https://example.com/covers/hobbit.jpg",
        },
        quantity: 1,
        price: 16.99,
      },
    ],
    status: "shipped",
    totalAmount: 16.99,
    shippingAddress: "789 Admin St, Adminville, USA",
    trackingNumber: "TRACK789012",
    notes: "",
    createdAt: "2023-09-18T11:20:00Z",
    updatedAt: "2023-09-19T08:30:00Z",
  },
  {
    id: "4",
    user: {
      id: "4",
      name: "Bob Johnson",
      email: "bob.johnson@example.com",
    },
    items: [
      {
        book: {
          id: "105",
          title: "Pride and Prejudice",
          author: "Jane Austen",
          price: 9.99,
          coverImage: "https://example.com/covers/pride.jpg",
        },
        quantity: 1,
        price: 9.99,
      },
    ],
    status: "cancelled",
    totalAmount: 9.99,
    shippingAddress: "789 Pine Rd, Elsewhere, USA",
    trackingNumber: null,
    notes: "Customer cancelled order",
    createdAt: "2023-09-14T15:45:00Z",
    updatedAt: "2023-09-15T09:10:00Z",
  },
  {
    id: "5",
    user: {
      id: "5",
      name: "Sarah Williams",
      email: "sarah.williams@example.com",
    },
    items: [
      {
        book: {
          id: "106",
          title: "The Catcher in the Rye",
          author: "J.D. Salinger",
          price: 13.99,
          coverImage: "https://example.com/covers/catcher.jpg",
        },
        quantity: 1,
        price: 13.99,
      },
      {
        book: {
          id: "107",
          title: "Lord of the Flies",
          author: "William Golding",
          price: 12.99,
          coverImage: "https://example.com/covers/flies.jpg",
        },
        quantity: 1,
        price: 12.99,
      },
    ],
    status: "pending",
    totalAmount: 26.98,
    shippingAddress: "321 Maple Dr, Nowhere, USA",
    trackingNumber: null,
    notes: "",
    createdAt: "2023-09-21T10:00:00Z",
    updatedAt: "2023-09-21T10:00:00Z",
  },
];

// Get all orders with filters (with mock implementation for now)
export const getOrders = async (
  filters: OrderFilters
): Promise<OrderListResponse> => {
  try {
    // In the future, this will be replaced with a real API call
    // const response = await axios.get(`${API_URL}/admin/orders?${buildQueryParams(filters)}`, getAuthHeaders());
    // return response.data;

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate delay

    let filteredOrders = [...MOCK_ORDERS];

    // Apply filters
    if (filters.status) {
      filteredOrders = filteredOrders.filter(
        (order) => order.status === filters.status
      );
    }

    if (filters.userId) {
      filteredOrders = filteredOrders.filter(
        (order) => order.user.id === filters.userId
      );
    }

    if (filters.minTotal !== undefined) {
      filteredOrders = filteredOrders.filter(
        (order) => order.totalAmount >= filters.minTotal!
      );
    }

    if (filters.maxTotal !== undefined) {
      filteredOrders = filteredOrders.filter(
        (order) => order.totalAmount <= filters.maxTotal!
      );
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filteredOrders = filteredOrders.filter(
        (order) => new Date(order.createdAt) >= startDate
      );
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filteredOrders = filteredOrders.filter(
        (order) => new Date(order.createdAt) <= endDate
      );
    }

    // Apply sorting
    if (filters.sortBy) {
      const direction = filters.sortOrder === "desc" ? -1 : 1;

      filteredOrders.sort((a, b) => {
        switch (filters.sortBy) {
          case "createdAt":
            return (
              direction *
              (new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime())
            );
          case "totalAmount":
            return direction * (a.totalAmount - b.totalAmount);
          case "status":
            return direction * a.status.localeCompare(b.status);
          default:
            return 0;
        }
      });
    }

    // Calculate pagination
    const total = filteredOrders.length;
    const totalPages = Math.ceil(total / filters.limit);
    const startIndex = (filters.page - 1) * filters.limit;
    const endIndex = startIndex + filters.limit;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    return {
      orders: paginatedOrders,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages,
    };
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};

// Get a single order by ID
export const getOrder = async (id: string): Promise<Order> => {
  try {
    // In the future, this will be replaced with a real API call
    // const response = await axios.get(`${API_URL}/admin/orders/${id}`, getAuthHeaders());
    // return response.data;

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate delay

    const order = MOCK_ORDERS.find((o) => o.id === id);

    if (!order) {
      throw new Error("Order not found");
    }

    return order;
  } catch (error) {
    console.error(`Error fetching order ${id}:`, error);
    throw error;
  }
};

// Update an order
export const updateOrder = async (
  id: string,
  orderData: OrderFormData
): Promise<Order> => {
  try {
    // In the future, this will be replaced with a real API call
    // const response = await axios.put(`${API_URL}/admin/orders/${id}`, orderData, getAuthHeaders());
    // return response.data;

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 700)); // Simulate delay

    const orderIndex = MOCK_ORDERS.findIndex((o) => o.id === id);

    if (orderIndex === -1) {
      throw new Error("Order not found");
    }

    // Create updated order
    const updatedOrder = {
      ...MOCK_ORDERS[orderIndex],
      ...orderData,
      updatedAt: new Date().toISOString(),
    };

    // Update the mock data (in a real app, this would be unnecessary)
    MOCK_ORDERS[orderIndex] = updatedOrder;

    return updatedOrder;
  } catch (error) {
    console.error(`Error updating order ${id}:`, error);
    throw error;
  }
};

// Delete an order
export const deleteOrder = async (id: string): Promise<void> => {
  try {
    // In the future, this will be replaced with a real API call
    // await axios.delete(`${API_URL}/admin/orders/${id}`, getAuthHeaders());

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 600)); // Simulate delay

    const orderIndex = MOCK_ORDERS.findIndex((o) => o.id === id);

    if (orderIndex === -1) {
      throw new Error("Order not found");
    }

    // Remove from mock data (in a real app, this would be unnecessary)
    MOCK_ORDERS.splice(orderIndex, 1);
  } catch (error) {
    console.error(`Error deleting order ${id}:`, error);
    throw error;
  }
};
