
export interface CD {
  _id: string;
  id?: string; // Optional for backward compatibility
  title: string;
  price: number; // Calculated from originalPrice and discountRate
  originalPrice: number;
  discountRate: number; // Percentage discount (0-100)
  coverImage: string;
  stock: number;
  createdAt: string;
  updatedAt: string;
    artist: string;
    albumTitle: string; // Tên album
    trackList: string; // Danh sách bài hát
    category: string; // Thể loại: Pop, Rock, Jazz, Classical, etc.
    releaseddate: string; // Ngày phát hành (dạng chuỗi ISO 8601)
    isAvailableRush: boolean; // New field for rush delivery
}








export interface CDFormData {
  title: string;
  price: number;
  originalPrice: number; // Base price before discount
  coverImage?: File | null;
  coverImageUrl?: string;
  stock: number;
    artist: string;
    albumTitle: string; // Tên album
    trackList: string; // Danh sách bài hát
    category: string; // Thể loại: Pop, Rock, Jazz, Classical, etc.
    releaseddate: string; // Ngày phát hành (dạng chuỗi ISO 8601)
  isAvailableRush: boolean; // New field for rush delivery

}

export interface CDFilters {
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

export interface CDListResponse {
  cds: CD[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;

}

