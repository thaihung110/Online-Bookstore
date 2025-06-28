export interface DVD {
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
  disctype: string; // Type of disc (e.g., DVD, Blu-ray)
  director: string; // Director of the DVD
  runtime: number; // Runtime in minutes
  studio: string; // Studio that produced the DVD
  subtitles: string; // List of subtitles available
  releaseddate: string; // Release date of the DVD
  filmtype: string; // Type of film (e.g., movie, series)
  isAvailableRush: boolean; // Whether the DVD is available for rush delivery
  isFeatured: boolean; // Whether the DVD is featured
  isAvailable: boolean; // Whether the DVD is available
  isAvailableForPreOrder: boolean; // Whether the DVD is available for pre-order
  weight: number; // Weight of the DVD for shipping
}

export interface DVDFormData {
  title: string;
  originalPrice: number; // Base price before discount
  price: number; // Calculated field
  coverImage?: File | null;
  coverImageUrl?: string;
  stock: number;
  disctype: string; // Type of disc (e.g., DVD, Blu-ray)
  director: string; // Director of the DVD
  runtime: number; // Runtime in minutes
  studio: string; // Studio that produced the DVD
  subtitles: string; // List of subtitles available
  releaseddate: string; // Release date of the DVD
  filmtype: string; // Type of film (e.g., movie, series)
  isAvailableRush: boolean; // Whether the DVD is available for rush delivery
  isFeatured?: boolean; // Whether the DVD is featured
  isAvailable?: boolean; // Whether the DVD is available
  isAvailableForPreOrder?: boolean; // Whether the DVD is available for pre-order
  weight: number; // Weight of the DVD for shipping
}

export interface DVDFilters {
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

export interface DVDListResponse {
  dvds: DVD[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
