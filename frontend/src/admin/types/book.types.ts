export interface Book {
  _id: string;
  id?: string; // Optional for backward compatibility
  title: string;
  author: string;
  description: string;
  price: number; // Current price (calculated from originalPrice and discountRate)
  originalPrice: number;
  discountRate?: number; // Percentage discount (0-100) - may not be present from backend, calculated on frontend
  coverImage: string;
  isbn: string;
  publicationYear: number; // Use publication year instead of full date
  publisher: string;
  pageCount: number;
  genres: string[];
  language: string;
  stock: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookFormData {
  title: string;
  author: string;
  description: string;
  originalPrice: number; // Base price before discount
  discountRate: number; // Percentage discount (0-100) - for UI only
  coverImage?: File | null;
  coverImageUrl?: string;
  isbn: string;
  publicationYear: number; // Use publication year instead of full date
  publisher: string;
  pageCount: number;
  genres: string[];
  language: string;
  stock: number;
}

// API request interfaces - without discountRate
export interface CreateBookRequest {
  title: string;
  author: string;
  description: string;
  price: number; // Calculated from originalPrice and discountRate
  originalPrice: number;
  isbn: string;
  publicationYear: number;
  publisher: string;
  pageCount: number;
  genres: string[];
  language: string;
  stock: number;
  coverImage?: string; // S3 key for cover image
}

export interface UpdateBookRequest {
  title: string;
  author: string;
  description: string;
  price: number; // Calculated from originalPrice and discountRate
  originalPrice: number;
  isbn: string;
  publicationYear: number;
  publisher: string;
  pageCount: number;
  genres: string[];
  language: string;
  stock: number;
  coverImage?: string; // S3 key for cover image
}

export interface BookFilters {
  search?: string;
  author?: string;
  minPrice?: number;
  maxPrice?: number;
  genres?: string[];
  inStock?: boolean;
  onSale?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page: number;
  limit: number;
}

export interface BookListResponse {
  books: Book[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
