// Base interfaces following Interface Segregation Principle (ISP)

// Essential product information for display
export interface ProductSummary {
  id: string;
  title: string;
  productType: 'BOOK' | 'CD' | 'DVD';
}

// Pricing information (ISP - separated concern)
export interface ProductPricing {
  price: number;
  originalPrice: number;
  discountRate: number;
}

// Media information (ISP - separated concern)
export interface ProductMedia {
  coverImage?: string;
  description: string;
}

// Inventory information (ISP - separated concern)
export interface ProductInventory {
  stock: number;
  isAvailable?: boolean;
  isAvailableRush?: boolean;
}

// Rating information (ISP - separated concern)
export interface ProductRating {
  rating?: number;
  totalRatings?: number;
}

// Complete product detail interface (composition of smaller interfaces)
export interface ProductDetail extends 
  ProductSummary, 
  ProductPricing, 
  ProductMedia, 
  ProductInventory, 
  ProductRating {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Book-specific interfaces
export interface BookSpecific {
  author: string;
  isbn: string;
  genres: string[];
  publisher: string;
  publicationYear: number;
  language?: string;
  pageCount?: number;
}

export interface Book extends ProductDetail, BookSpecific {
  productType: 'BOOK';
}

// CD-specific interfaces
export interface CDSpecific {
  artist: string;
  albumTitle: string;
  trackList?: string;
  category?: string;
  releaseddate?: string;
}

export interface CD extends ProductDetail, CDSpecific {
  productType: 'CD';
}

// DVD-specific interfaces
export interface DVDSpecific {
  director: string;
  studio?: string;
  runtime?: number;
  filmType?: string;
  discType?: string;
  cast?: string;
  releaseddate?: string;
}

export interface DVD extends ProductDetail, DVDSpecific {
  productType: 'DVD';
}

// Union type for all products
export type Product = Book | CD | DVD;

// Interfaces for cart operations (ISP - only what cart needs)
export interface CartItem {
  id: string;
  title: string;
  price: number;
  coverImage?: string;
  productType: 'BOOK' | 'CD' | 'DVD';
}

// Interfaces for API responses
export interface ProductResponse<T> {
  products: T[];
  total: number;
  page: number;
  limit: number;
}

// Query interfaces (ISP - separated by concern)
export interface BaseProductQuery {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PricingQuery {
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
}

export interface InventoryQuery {
  inStock?: boolean;
}

export interface BookQuery extends BaseProductQuery, PricingQuery, InventoryQuery {
  author?: string;
  genres?: string[];
  minYear?: number;
  maxYear?: number;
}

export interface CDQuery extends BaseProductQuery, PricingQuery, InventoryQuery {
  artist?: string;
  albumTitle?: string;
  categories?: string[];
  minYear?: number;
  maxYear?: number;
}

export interface DVDQuery extends BaseProductQuery, PricingQuery, InventoryQuery {
  director?: string;
  studio?: string;
  filmTypes?: string[];
  discTypes?: string[];
  minRuntime?: number;
  maxRuntime?: number;
}

// Service interfaces for dependency inversion (DIP)
export interface ProductService<T extends ProductDetail> {
  getProductById(id: string): Promise<T>;
  getProducts(query?: any): Promise<ProductResponse<T>>;
  getFeaturedProducts(limit?: number): Promise<T[]>;
}

// Store interfaces for dependency inversion (DIP)
export interface ProductStore<T extends ProductDetail> {
  currentProduct: T | null;
  isLoading: boolean;
  error: string | null;
  fetchProductById: (id: string) => Promise<void>;
  clearCurrentProduct: () => void;
}

export interface CartStore {
  items: CartItem[];
  addItem: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  isInCart: (productId: string) => boolean;
  clearCart: () => void;
}