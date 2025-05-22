import { Order } from '../../orders/schemas/order.schema';
import { FilterQuery, SortOrder } from 'mongoose';

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  userId?: string;
  minTotal?: number;
  maxTotal?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrderFilters extends Omit<OrderQueryParams, 'page' | 'limit'> {
  page: number;
  limit: number;
}

export interface OrderSortOptions {
  [key: string]: SortOrder;
}

export interface OrderFilterQuery extends FilterQuery<Order> {
  status?: string;
  user?: string;
  totalAmount?: {
    $gte?: number;
    $lte?: number;
  };
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
}
