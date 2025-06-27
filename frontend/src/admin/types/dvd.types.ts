// DVD type definitions for admin interface

export interface DVD {
  _id: string;
  id: string;
  productType: 'DVD';
  title: string;
  director: string;
  runtime: number;
  studio: string;
  subtitles: string;
  releaseddate: string | Date;
  filmtype: string;
  disctype: string;
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

export interface DVDFormData {
  title: string;
  director: string;
  runtime: number;
  studio: string;
  subtitles: string;
  releaseddate: string;
  filmtype: string;
  disctype: string;
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

export interface DVDFilters {
  search?: string;
  director?: string;
  studio?: string;
  filmtype?: string;
  disctype?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface DVDListResponse {
  dvds: DVD[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}