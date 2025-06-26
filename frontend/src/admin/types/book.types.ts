export interface Book {
  _id: string;
  id?: string; // Optional for backward compatibility
  title: string;
  author: string;
  description: string;
  price: number; // Calculated from originalPrice and discountRate
  originalPrice: number;
  discountRate: number; // Percentage discount (0-100)
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

// export interface BookFormData {
//   title: string;
//   author: string;
//   description: string;
//   originalPrice: number; // Base price before discount
//   discountRate: number; // Percentage discount (0-100)
//   coverImage?: File | null;
//   coverImageUrl?: string;
//   isbn: string;
//   publicationYear: number; // Use publication year instead of full date
//   publisher: string;
//   pageCount: number;
//   genres: string[];
//   language: string;
//   stock: number;
// }


export interface BookFormData {
  title: string;
  author: string;
  description: string;
  originalPrice: number; // Base price before discount
  price: number; // Calculated field
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
