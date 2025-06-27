export interface Product {
  _id: string;
  id?: string; // Optional for backward compatibility
  title: string;
  price: number; // Calculated from originalPrice and discountRate
  originalPrice: number;
  discountRate: number; // Percentage discount (0-100)
  coverImage: string;
  stock: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
  isAvailableRush: boolean; // Whether the DVD is available for rush delivery
    productType: string; // Type of product (e.g., product, cd, dvd)

}

export interface ProductFormData {
  title: string;
  originalPrice: number; // Base price before discount
  price: number; // Calculated field
  coverImage?: File | null;
  coverImageUrl?: string;
  stock: number;
  isAvailableRush: boolean; // Whether the DVD is available for rush delivery
}

export interface ProductFilters {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  onSale?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page: number;
  limit: number;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
