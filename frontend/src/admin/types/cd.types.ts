// CD type definitions for admin interface

export interface CD {
  _id: string;
  id: string;
  productType: 'CD';
  title: string;
  artist: string;
  albumTitle: string;
  trackList: string;
  category: string;
  releaseddate: string | Date;
  description?: string;
  originalPrice: number;
  discountRate: number;
  price: number;
  stock: number;
  coverImage?: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
  isAvailableForPreOrder?: boolean;
  preOrderReleaseDate?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CDFormData {
  title: string;
  artist: string;
  albumTitle: string;
  trackList: string;
  category: string;
  releaseddate: string;
  description?: string;
  originalPrice: number;
  discountRate: number;
  price: number;
  stock: number;
  coverImage?: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
  isAvailableForPreOrder?: boolean;
  preOrderReleaseDate?: string;
}

export interface CDFilters {
  search?: string;
  artist?: string;
  albumTitle?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CDListResponse {
  cds: CD[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}