export interface OrderItem {
  book: {
    id: string;
    title: string;
    author: string;
    price: number;
    coverImage: string;
  };
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  items: OrderItem[];
  status: string;
  totalAmount: number;
  shippingAddress: string;
  trackingNumber: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
}

export interface OrderFilters {
  page: number;
  limit: number;
  status?: string;
  userId?: string;
  minTotal?: number;
  maxTotal?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrderFormData {
  status?: string;
  shippingAddress?: string;
  trackingNumber?: string | null;
  notes?: string;
  items?: OrderItem[];
}
