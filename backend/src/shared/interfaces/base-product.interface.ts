import { Document, Types } from 'mongoose';

// Base product interface for common properties
export interface IBaseProduct {
  _id?: Types.ObjectId | string;
  id?: string;
  title: string;
  description?: string;
  originalPrice: number;
  discountRate: number;
  price: number;
  coverImage?: string;
  stock: number;
  productType: string; // Keep as string to match existing schema
  rating?: number;
  totalRatings?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Pricing-specific interface (ISP)
export interface IPricingData {
  originalPrice: number;
  discountRate: number;
  price: number;
}

// Inventory-specific interface (ISP)
export interface IInventoryData {
  stock: number;
  isAvailable?: boolean;
  isAvailableRush?: boolean;
}

// Rating-specific interface (ISP)
export interface IRatingData {
  rating?: number;
  totalRatings?: number;
}

// Media-specific interface (ISP)
export interface IMediaData {
  coverImage?: string;
  title: string;
  description: string;
}

// Document interface for MongoDB
export interface IBaseProductDocument extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  originalPrice: number;
  discountRate: number;
  price: number;
  coverImage?: string;
  stock: number;
  productType: string;
  rating?: number;
  totalRatings?: number;
  createdAt?: Date;
  updatedAt?: Date;
  toObject(): any;
}

// Service interface for product operations (DIP)
export interface IProductService<T extends IBaseProduct> {
  findOne(id: string): Promise<T>;
  findAll(query: any): Promise<{ products: T[]; total: number; page: number; limit: number }>;
  findFeatured(limit?: number): Promise<T[]>;
  create(createDto: any): Promise<T>;
  update(id: string, updateDto: any): Promise<T>;
  remove(id: string): Promise<{ deleted: boolean; message?: string }>;
}

// Data processor interface (SRP)
export interface IProductDataProcessor<T extends IBaseProduct> {
  processProductData(rawData: any): Promise<T>;
}

// Query interface for filtering
export interface IBaseProductQuery {
  search?: string;
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  onSale?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}