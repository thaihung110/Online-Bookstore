import api from "./axios";

export interface BaseProduct {
  id: string;
  _id?: string;
  title: string;
  description: string;
  originalPrice: number;
  discountRate: number;
  price: number;
  coverImage?: string;
  stock: number;
  rating?: number;
  totalRatings?: number;
  isFeatured?: boolean;
}

// Book-specific fields
export interface BookProduct extends BaseProduct {
  productType: 'BOOK';
  author: string;
  isbn: string;
  genres: string[];
  publisher: string;
  publicationYear: number;
  language?: string;
  pageCount?: number;
}

// CD-specific fields
export interface CDProduct extends BaseProduct {
  productType: 'CD';
  artist: string;
  albumTitle: string;
  trackList?: string;
  category?: string;
  releaseddate?: string;
}

// DVD-specific fields
export interface DVDProduct extends BaseProduct {
  productType: 'DVD';
  director: string;
  studio?: string;
  runtime?: number;
  filmType?: string;
  discType?: string;
  cast?: string;
  releaseddate?: string;
}

export type Product = BookProduct | CDProduct | DVDProduct;

export interface ProductResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

// API function to get featured products (mix of all types)
export const getFeaturedProducts = async (limit: number = 12): Promise<Product[]> => {
  try {
    const response = await api.get(`/products/featured?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching featured products:", error);
    throw error;
  }
};

// API function to get mixed products from different endpoints
export const getMixedFeaturedProducts = async (limit: number = 12): Promise<Product[]> => {
  try {
    const itemsPerType = Math.ceil(limit / 3);
    
    const [booksResponse, cdsResponse, dvdsResponse] = await Promise.allSettled([
      api.get(`/books/featured?limit=${itemsPerType}`),
      api.get(`/cds/featured?limit=${itemsPerType}`),
      api.get(`/dvds/featured?limit=${itemsPerType}`),
    ]);

    const products: Product[] = [];

    // Process books
    if (booksResponse.status === 'fulfilled') {
      const books = booksResponse.value.data
        .map((book: any) => ({
          ...book,
          id: book.id || book._id, // Ensure id is properly set
          productType: 'BOOK' as const,
        }))
        .filter((book: any) => book.id && book.id !== 'undefined'); // Filter out invalid IDs
      products.push(...books);
    }

    // Process CDs
    if (cdsResponse.status === 'fulfilled') {
      const cds = (cdsResponse.value.data || [])
        .map((cd: any) => ({
          ...cd,
          id: cd.id || cd._id, // Ensure id is properly set
          productType: 'CD' as const,
        }))
        .filter((cd: any) => cd.id && cd.id !== 'undefined'); // Filter out invalid IDs
      products.push(...cds);
    }

    // Process DVDs
    if (dvdsResponse.status === 'fulfilled') {
      const dvds = (dvdsResponse.value.data || [])
        .map((dvd: any) => ({
          ...dvd,
          id: dvd.id || dvd._id, // Ensure id is properly set
          productType: 'DVD' as const,
        }))
        .filter((dvd: any) => dvd.id && dvd.id !== 'undefined'); // Filter out invalid IDs
      products.push(...dvds);
    }

    console.log('Mixed products loaded:', products.length, 'products');
    console.log('Sample product IDs:', products.slice(0, 3).map(p => ({ type: p.productType, id: p.id, _id: p._id })));

    // Shuffle the products array to mix different types
    const shuffled = products.sort(() => Math.random() - 0.5);
    
    return shuffled.slice(0, limit);
  } catch (error) {
    console.error("Error fetching mixed featured products:", error);
    throw error;
  }
};

// API function to get random mixed products (not featured)
export const getRandomMixedProducts = async (limit: number = 20): Promise<Product[]> => {
  try {
    // Fetch more items than needed to have a good selection for randomization
    const itemsPerType = Math.ceil(limit / 2); // Get more items per type
    
    const [booksResponse, cdsResponse, dvdsResponse] = await Promise.allSettled([
      api.get(`/books?limit=${itemsPerType}`),
      api.get(`/cds?limit=${itemsPerType}`),
      api.get(`/dvds?limit=${itemsPerType}`),
    ]);

    const products: Product[] = [];

    // Process books
    if (booksResponse.status === 'fulfilled') {
      const books = (booksResponse.value.data.books || booksResponse.value.data || [])
        .map((book: any) => ({
          ...book,
          id: book.id || book._id,
          productType: 'BOOK' as const,
        }))
        .filter((book: any) => book.id && book.id !== 'undefined');
      products.push(...books);
      console.log('Books loaded:', books.length);
    } else {
      console.log('Books failed to load:', booksResponse.reason);
    }

    // Process CDs
    if (cdsResponse.status === 'fulfilled') {
      const cds = (cdsResponse.value.data.cds || cdsResponse.value.data || [])
        .map((cd: any) => ({
          ...cd,
          id: cd.id || cd._id,
          productType: 'CD' as const,
        }))
        .filter((cd: any) => cd.id && cd.id !== 'undefined');
      products.push(...cds);
      console.log('CDs loaded:', cds.length);
    } else {
      console.log('CDs failed to load:', cdsResponse.reason);
    }

    // Process DVDs
    if (dvdsResponse.status === 'fulfilled') {
      const dvds = (dvdsResponse.value.data.dvds || dvdsResponse.value.data || [])
        .map((dvd: any) => ({
          ...dvd,
          id: dvd.id || dvd._id,
          productType: 'DVD' as const,
        }))
        .filter((dvd: any) => dvd.id && dvd.id !== 'undefined');
      products.push(...dvds);
      console.log('DVDs loaded:', dvds.length);
    } else {
      console.log('DVDs failed to load:', dvdsResponse.reason);
    }

    console.log('Total mixed products loaded:', products.length, 'products');

    // Shuffle the products array to mix different types
    const shuffled = products.sort(() => Math.random() - 0.5);
    
    return shuffled.slice(0, limit);
  } catch (error) {
    console.error("Error fetching random mixed products:", error);
    throw error;
  }
};

// API function to search across all product types by title
export const searchAllProducts = async (query: string, limit: number = 50): Promise<Product[]> => {
  if (!query.trim()) {
    return [];
  }

  try {
    const searchQuery = query.trim();
    const itemsPerType = Math.ceil(limit / 3);
    
    const [booksResponse, cdsResponse, dvdsResponse] = await Promise.allSettled([
      api.get(`/books?search=${encodeURIComponent(searchQuery)}&limit=${itemsPerType}`),
      api.get(`/cds?search=${encodeURIComponent(searchQuery)}&limit=${itemsPerType}`),
      api.get(`/dvds?search=${encodeURIComponent(searchQuery)}&limit=${itemsPerType}`),
    ]);

    const products: Product[] = [];

    // Process books
    if (booksResponse.status === 'fulfilled') {
      const books = (booksResponse.value.data.books || booksResponse.value.data || [])
        .map((book: any) => ({
          ...book,
          id: book.id || book._id,
          productType: 'BOOK' as const,
        }))
        .filter((book: any) => book.id && book.id !== 'undefined');
      products.push(...books);
    }

    // Process CDs
    if (cdsResponse.status === 'fulfilled') {
      const cds = (cdsResponse.value.data.cds || cdsResponse.value.data || [])
        .map((cd: any) => ({
          ...cd,
          id: cd.id || cd._id,
          productType: 'CD' as const,
        }))
        .filter((cd: any) => cd.id && cd.id !== 'undefined');
      products.push(...cds);
    }

    // Process DVDs
    if (dvdsResponse.status === 'fulfilled') {
      const dvds = (dvdsResponse.value.data.dvds || dvdsResponse.value.data || [])
        .map((dvd: any) => ({
          ...dvd,
          id: dvd.id || dvd._id,
          productType: 'DVD' as const,
        }))
        .filter((dvd: any) => dvd.id && dvd.id !== 'undefined');
      products.push(...dvds);
    }

    console.log(`Search results for "${searchQuery}":`, products.length, 'products found');

    // Sort by relevance (exact title matches first, then partial matches)
    const sortedProducts = products.sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      const queryLower = searchQuery.toLowerCase();

      // Exact matches first
      if (aTitle === queryLower && bTitle !== queryLower) return -1;
      if (bTitle === queryLower && aTitle !== queryLower) return 1;

      // Title starts with query
      if (aTitle.startsWith(queryLower) && !bTitle.startsWith(queryLower)) return -1;
      if (bTitle.startsWith(queryLower) && !aTitle.startsWith(queryLower)) return 1;

      // Alphabetical order
      return aTitle.localeCompare(bTitle);
    });
    
    return sortedProducts.slice(0, limit);
  } catch (error) {
    console.error("Error searching products:", error);
    throw error;
  }
};