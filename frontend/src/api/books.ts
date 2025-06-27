import api from "./axios";
import recommendApi from "./axiosRecommend";
import { useMemo } from "react";

export interface Book {
  id: string;
  _id?: string; // Preserve original MongoDB _id for backend operations
  title: string;
  author: string;
  description: string;
  originalPrice: number;
  discountRate: number;
  price: number;
  coverImage?: string;
  isbn: string;
  genres: string[];
  publisher: string;
  publicationYear: number;
  rating?: number;
  totalRatings?: number;
  language?: string;
  stock: number;
  category?: string[];
  publishedDate?: string;
  pageCount?: number;
  converImage?: string;
}

export interface BookQuery {
  page?: number;
  limit?: number;
  search?: string;
  author?: string;
  genres?: string[];
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  inStock?: boolean;
  onSale?: boolean;
  minDiscountRate?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface BookResponse {
  books: Book[];
  total: number;
  page: number;
  limit: number;
}

// Define raw book data type from API
interface RawBookData {
  _id?: string;
  id?: string;
  title: string;
  author: string;
  description: string;
  originalPrice?: number;
  discountRate?: number;
  price: number;
  coverImage?: string;
  isbn: string;
  genres: string[];
  publisher: string;
  publicationYear: number;
  rating?: number;
  averageRating?: number;
  stock: number;
  category?: string[];
  publishedDate?: string;
  pageCount?: number;
}

// Validate book data
const isValidBook = (book: any): book is RawBookData => {
  return (
    typeof book === "object" &&
    book !== null &&
    typeof book.title === "string" &&
    typeof book.author === "string" &&
    typeof book.description === "string" &&
    typeof book.price === "number" &&
    typeof book.isbn === "string" &&
    Array.isArray(book.genres) &&
    typeof book.publisher === "string" &&
    typeof book.publicationYear === "number"
  );
};

// Cache for memoizing book data
const bookCache = new Map<string, { data: Book | Book[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Transform book data from API to frontend format
const transformBookData = (bookData: RawBookData): Book => {
  // Convert _id to id if necessary, but preserve _id for backend operations
  const id = bookData._id || bookData.id || "";
  const _id = bookData._id || bookData.id || ""; // Preserve original _id

  // Ensure numeric values
  const originalPrice = Number(bookData.originalPrice) || bookData.price;
  const discountRate = Number(bookData.discountRate) || 0;
  const price = Number(bookData.price);
  const rating = bookData.rating
    ? Number(bookData.rating)
    : bookData.averageRating
    ? Number(bookData.averageRating)
    : undefined;
  const stock = Number(bookData.stock) || 0;
  const pageCount = bookData.pageCount ? Number(bookData.pageCount) : undefined;

  // Ensure arrays
  const genres = Array.isArray(bookData.genres) ? bookData.genres : [];
  const category = Array.isArray(bookData.category)
    ? bookData.category
    : undefined;

  return {
    id,
    _id, // Include original MongoDB _id
    title: bookData.title.trim(),
    author: bookData.author.trim(),
    description: bookData.description.trim(),
    originalPrice,
    discountRate,
    price,
    coverImage: bookData.coverImage,
    isbn: bookData.isbn,
    genres,
    publisher: bookData.publisher.trim(),
    publicationYear: bookData.publicationYear,
    rating,
    stock,
    category,
    publishedDate: bookData.publishedDate,
    pageCount,
  };
};

// Get paginated books with filtering options
export const getBooks = async (
  query: BookQuery = {}
): Promise<BookResponse> => {
  console.log("API: Calling getBooks with query:", query);

  try {
    // Clean up query parameters
    const cleanQuery: BookQuery = {};
    if (query.page && query.page > 0) cleanQuery.page = query.page;
    if (query.limit && query.limit > 0) cleanQuery.limit = query.limit;
    if (query.search?.trim()) cleanQuery.search = query.search.trim();
    if (query.author?.trim()) cleanQuery.author = query.author.trim();

    // Xử lý đặc biệt cho genres để phù hợp với backend
    if (Array.isArray(query.genres) && query.genres.length > 0) {
      // Đảm bảo mỗi genre được trim và không empty
      cleanQuery.genres = query.genres
        .map((genre) => genre.trim())
        .filter((genre) => genre.length > 0);
      console.log("API: Clean genres:", cleanQuery.genres);
    }

    if (query.minPrice && query.minPrice >= 0)
      cleanQuery.minPrice = query.minPrice;
    if (query.maxPrice && query.maxPrice >= 0)
      cleanQuery.maxPrice = query.maxPrice;
    if (query.inStock !== undefined) cleanQuery.inStock = query.inStock;
    if (query.onSale !== undefined) cleanQuery.onSale = query.onSale;
    if (query.sortBy) cleanQuery.sortBy = query.sortBy;
    if (query.sortOrder) cleanQuery.sortOrder = query.sortOrder;

    console.log("API: Clean query parameters:", cleanQuery);

    // Sử dụng URLSearchParams để đảm bảo format đúng cho array parameters
    const params = new URLSearchParams();
    Object.entries(cleanQuery).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v));
      } else if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get("/books", {
      params: cleanQuery,
      paramsSerializer: {
        serialize: (params) => {
          return Object.entries(params)
            .map(([key, value]) => {
              if (Array.isArray(value)) {
                return value
                  .map(
                    (v) => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`
                  )
                  .join("&");
              }
              return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
            })
            .join("&");
        },
      },
    });

    // Validate and transform response data
    if (!response.data || !Array.isArray(response.data.books)) {
      throw new Error("Invalid response format from API");
    }

    const transformedBooks = response.data.books.map(transformBookData);

    return {
      books: transformedBooks,
      total: response.data.total || transformedBooks.length,
      page: response.data.page || 1,
      limit: response.data.limit || 10,
    };
  } catch (error) {
    console.error("Error in getBooks API call:", error);
    // Return safe default response
    return {
      books: [],
      total: 0,
      page: 1,
      limit: 10,
    };
  }
};

// Get a single book by ID with caching
export const getBookById = async (id: string): Promise<Book> => {
  console.log(`Calling getBookById API for id: ${id}`);

  // Check cache first
  const cached = bookCache.get(id);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log("Cache hit for book:", id);
    return cached.data as Book;
  }

  try {
    const response = await api.get(`/books/${id}`);
    const transformedBook = transformBookData(response.data as RawBookData);

    // Update cache
    bookCache.set(id, {
      data: transformedBook,
      timestamp: Date.now(),
    });

    return transformedBook;
  } catch (error) {
    console.error(`Error in getBookById API call for id ${id}:`, error);
    throw error;
  }
};

// Get books by category with validation
export const getBooksByCategory = async (
  category: string,
  query: Omit<BookQuery, "genres"> = {}
): Promise<BookResponse> => {
  if (!category?.trim()) {
    throw new Error("Category is required");
  }

  console.log(`Calling getBooksByCategory API for category: ${category}`);
  try {
    const response = await api.get("/books", {
      params: { ...query, genres: [category.trim()] },
    });

    if (!response.data || !Array.isArray(response.data.books)) {
      throw new Error("Invalid response format from API");
    }

    const transformedBooks = response.data.books.map(transformBookData);

    return {
      books: transformedBooks,
      total: response.data.total || transformedBooks.length,
      page: response.data.page || 1,
      limit: response.data.limit || 10,
    };
  } catch (error) {
    console.error(`Error in getBooksByCategory API call:`, error);
    return {
      books: [],
      total: 0,
      page: 1,
      limit: 10,
    };
  }
};

// Get featured books with memoization
export const getFeaturedBooks = async (limit: number = 6): Promise<Book[]> => {
  const cacheKey = `featured_${limit}`;
  const cached = bookCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log("Cache hit for featured books");
    return cached.data as Book[];
  }

  try {
    const response = await api.get("/books/featured", {
      params: { limit: Math.max(1, Math.min(limit, 20)) }, // Limit between 1 and 20
    });

    if (!Array.isArray(response.data)) {
      throw new Error("Invalid response format for featured books");
    }

    const transformedBooks = response.data.map((book: RawBookData) =>
      transformBookData(book)
    );

    // Update cache
    bookCache.set(cacheKey, {
      data: transformedBooks,
      timestamp: Date.now(),
    });

    return transformedBooks;
  } catch (error) {
    console.error("Error in getFeaturedBooks API call:", error);
    return [];
  }
};

// Get all unique genres with caching
const genresCache = {
  data: [] as string[],
  timestamp: 0,
};

export const getAllGenres = async (): Promise<string[]> => {
  // Check cache
  if (Date.now() - genresCache.timestamp < CACHE_TTL) {
    return genresCache.data;
  }

  try {
    const response = await api.get("/books/genres");

    if (!Array.isArray(response.data)) {
      throw new Error("Invalid response format for genres");
    }

    // Update cache
    genresCache.data = response.data;
    genresCache.timestamp = Date.now();

    return response.data;
  } catch (error) {
    console.error("Error in getAllGenres API call:", error);
    // Return cached data if available, otherwise fallback list
    return genresCache.data.length > 0
      ? genresCache.data
      : ["Fiction", "Non-Fiction", "Science Fiction", "Fantasy", "Mystery"];
  }
};

// Lấy danh sách recommended book_id cho user
export const getRecommendedBookIds = async (
  userId: string,
  topK: number = 6
): Promise<string[]> => {
  try {
    const response = await api.get(`/recommend/books/${userId}`, {
      params: { top_k: topK },
    });
    if (!Array.isArray(response.data)) {
      throw new Error("Invalid response format for recommended books");
    }
    return response.data;
  } catch (error) {
    console.error("Error in getRecommendedBookIds API call:", error);
    return [];
  }
};

// Lấy chi tiết nhiều sách theo list id
export const getBooksByIds = async (ids: string[]): Promise<Book[]> => {
  if (!ids || ids.length === 0) return [];
  try {
    // Giả sử backend có API /books/batch?ids=...
    const response = await api.get("/books/batch", {
      params: { ids: ids.join(",") },
    });
    if (!Array.isArray(response.data)) {
      throw new Error("Invalid response format for books by ids");
    }
    return response.data.map(transformBookData);
  } catch (error) {
    // Nếu không có API batch, fallback gọi từng book
    console.warn("Batch API failed, fallback to single getBookById", error);
    const results: Book[] = [];
    for (const id of ids) {
      try {
        const book = await getBookById(id);
        results.push(book);
      } catch (e) {
        // Bỏ qua lỗi từng book
      }
    }
    return results;
  }
};

// Lấy danh sách sách recommend theo username
export const getRecommendedBooksByUsername = async (
  username: string,
  topK: number = 6
): Promise<Book[]> => {
  try {
    const response = await recommendApi.get(
      `/recommend/books/username/${encodeURIComponent(username)}`,
      {
        params: { top_k: topK },
      }
    );
    if (!Array.isArray(response.data)) {
      throw new Error(
        "Invalid response format for recommended books by username"
      );
    }
    return response.data.map(transformBookData);
  } catch (error) {
    console.error("Error in getRecommendedBooksByUsername API call:", error);
    return [];
  }
};
