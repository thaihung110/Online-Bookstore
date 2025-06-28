// Generic product types for Books, CDs, and DVDs

export type ProductType = 'BOOK' | 'CD' | 'DVD';

// Base product interface that all products share
export interface BaseProduct {
  id: string;
  _id?: string; // MongoDB _id for backend operations
  productType: ProductType;
  title: string;
  description?: string;
  originalPrice: number;
  discountRate: number;
  price: number;
  stock: number;
  coverImage?: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
  isAvailableForPreOrder?: boolean;
  preOrderReleaseDate?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  isAvailableRush?: boolean; // Rush delivery eligibility
}

// Book-specific interface
export interface Book extends BaseProduct {
  productType: 'BOOK';
  author: string;
  isbn: string;
  publisher: string;
  publicationYear: number;
  pageCount?: number;
  language?: string;
  genres: string[];
  rating?: number;
  totalRatings?: number;
  publishedDate?: string;
  category?: string[]; // For backward compatibility
  converImage?: string; // For backward compatibility
}

// CD-specific interface
export interface CD extends BaseProduct {
  productType: 'CD';
  artist: string;
  albumTitle: string;
  trackList: string;
  category: string; // Music genre (Pop, Rock, Jazz, etc.)
  releaseddate: Date | string;
}

// DVD-specific interface
export interface DVD extends BaseProduct {
  productType: 'DVD';
  director: string;
  runtime: number; // Runtime in minutes
  studio: string;
  subtitles: string;
  releaseddate: Date | string;
  filmtype: string; // Movie genre (Action, Comedy, Drama, etc.)
  disctype: string; // Disc format (DVD, Blu-ray, 4K UHD, etc.)
}

// Union type for all products
export type Product = Book | CD | DVD;

// Query interfaces
export interface BaseProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  onSale?: boolean;
  minDiscountRate?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface BookQuery extends BaseProductQuery {
  author?: string;
  genres?: string[];
  minYear?: number;
  maxYear?: number;
}

export interface CDQuery extends BaseProductQuery {
  artist?: string;
  albumTitle?: string;
  categories?: string[];
  minYear?: number;
  maxYear?: number;
}

export interface DVDQuery extends BaseProductQuery {
  director?: string;
  studio?: string;
  discTypes?: string[];
  filmTypes?: string[];
  minRuntime?: number;
  maxRuntime?: number;
  minYear?: number;
  maxYear?: number;
}

// Response interfaces
export interface ProductResponse<T extends Product = Product> {
  books?: T[];
  cds?: T[];
  dvds?: T[];
  total: number;
  page: number;
  limit: number;
}

export interface BookResponse extends ProductResponse<Book> {
  books: Book[];
}

export interface CDResponse extends ProductResponse<CD> {
  cds: CD[];
}

export interface DVDResponse extends ProductResponse<DVD> {
  dvds: DVD[];
}

// Type guards for product discrimination
export const isBook = (product: Product): product is Book => {
  return product.productType === 'BOOK';
};

export const isCD = (product: Product): product is CD => {
  return product.productType === 'CD';
};

export const isDVD = (product: Product): product is DVD => {
  return product.productType === 'DVD';
};

// Utility functions
export const getProductTypeName = (productType: ProductType): string => {
  switch (productType) {
    case 'BOOK':
      return 'Book';
    case 'CD':
      return 'CD';
    case 'DVD':
      return 'DVD';
    default:
      return 'Product';
  }
};

export const getProductTypeRoute = (productType: ProductType): string => {
  switch (productType) {
    case 'BOOK':
      return '/books';
    case 'CD':
      return '/cds';
    case 'DVD':
      return '/dvds';
    default:
      return '/products';
  }
};

export const getProductDetailRoute = (product: Product): string => {
  const baseRoute = getProductTypeRoute(product.productType);
  return `${baseRoute}/${product.id}`;
};