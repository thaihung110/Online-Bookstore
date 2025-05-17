import api from "./axios";

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  price: number;
  coverImage?: string;
  isbn: string;
  category: string[];
  publisher: string;
  publishedDate: string;
  pageCount: number;
  rating?: number;
  stock: number;
}

export interface BookQuery {
  page?: number;
  limit?: number;
  searchTerm?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface BookResponse {
  books: Book[];
  total: number;
  page: number;
  limit: number;
}

// Get paginated books with filtering options
export const getBooks = async (
  query: BookQuery = {}
): Promise<BookResponse> => {
  console.log("Calling getBooks API with query:", query);
  try {
    const response = await api.get("/books", { params: query });
    console.log("getBooks API response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error in getBooks API call:", error);
    // Return a default empty response instead of throwing to prevent UI from breaking
    return {
      books: [],
      total: 0,
      page: 1,
      limit: 10,
    };
  }
};

// Get a single book by ID
export const getBookById = async (id: string): Promise<Book> => {
  console.log(`Calling getBookById API for id: ${id}`);
  try {
    const response = await api.get(`/books/${id}`);
    console.log("getBookById API response:", response.data);
    return response.data;
  } catch (error) {
    console.error(`Error in getBookById API call for id ${id}:`, error);
    throw error;
  }
};

// Get books by category
export const getBooksByCategory = async (
  category: string,
  query: Omit<BookQuery, "category"> = {}
): Promise<BookResponse> => {
  console.log(
    `Calling getBooksByCategory API for category: ${category} with query:`,
    query
  );
  try {
    const response = await api.get("/books", {
      params: { ...query, category },
    });
    console.log("getBooksByCategory API response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      `Error in getBooksByCategory API call for category ${category}:`,
      error
    );
    return {
      books: [],
      total: 0,
      page: 1,
      limit: 10,
    };
  }
};

// Get featured books
export const getFeaturedBooks = async (limit: number = 6): Promise<Book[]> => {
  console.log(`Calling getFeaturedBooks API with limit: ${limit}`);
  console.log(`API base URL: ${api.defaults.baseURL}`);

  try {
    console.log(
      `Making request to: ${api.defaults.baseURL}/books/featured?limit=${limit}`
    );
    const response = await api.get("/books/featured", { params: { limit } });
    console.log("getFeaturedBooks API response:", response.data);

    if (!Array.isArray(response.data)) {
      console.warn("Expected array response, but got:", typeof response.data);
      return [];
    }

    return response.data;
  } catch (error: any) {
    console.error("Error in getFeaturedBooks API call:", error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Response error data:", error.response.data);
      console.error("Response error status:", error.response.status);
      console.error("Response error headers:", error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error("Request made but no response received:", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error message:", error.message);
    }
    // Return an empty array instead of throwing to prevent UI from breaking
    return [];
  }
};
