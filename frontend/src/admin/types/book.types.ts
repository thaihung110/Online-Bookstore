export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  price: number;
  salePrice?: number;
  coverImage: string;
  isbn: string;
  publicationDate: string;
  publisher: string;
  pageCount: number;
  genres: string[];
  language: string;
  stockQuantity: number;
  rating: number;
  isOnSale: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BookFormData {
  title: string;
  author: string;
  description: string;
  price: number;
  salePrice?: number;
  coverImage?: File | null;
  coverImageUrl?: string;
  isbn: string;
  publicationDate: string;
  publisher: string;
  pageCount: number;
  genres: string[];
  language: string;
  stockQuantity: number;
  isOnSale: boolean;
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
