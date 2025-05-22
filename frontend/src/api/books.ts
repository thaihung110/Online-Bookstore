import api from "./axios";

export interface Book {
  id: string;
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
  stock: number;
  category?: string[];
  publishedDate?: string;
  pageCount?: number;
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

// Hàm xử lý dữ liệu sách từ API để đảm bảo tính đúng đắn
const transformBookData = (bookData: any): Book => {
  // Đảm bảo ID được chuyển từ _id của MongoDB sang id cho frontend
  const id = bookData._id || bookData.id;

  // Đảm bảo có originalPrice, nếu không thì lấy giá price
  const originalPrice =
    bookData.originalPrice !== undefined
      ? bookData.originalPrice
      : bookData.price;

  // Đảm bảo có discountRate, mặc định là 0
  const discountRate =
    bookData.discountRate !== undefined ? bookData.discountRate : 0;

  // Tính giá hiển thị (đã giảm), nếu không có thì lấy từ API
  const price = bookData.price;

  return {
    id,
    title: bookData.title,
    author: bookData.author,
    description: bookData.description,
    originalPrice,
    discountRate,
    price,
    coverImage: bookData.coverImage,
    isbn: bookData.isbn,
    genres: bookData.genres || [],
    publisher: bookData.publisher,
    publicationYear: bookData.publicationYear,
    rating: bookData.rating || bookData.averageRating,
    stock: bookData.stock,
    category: bookData.category,
    publishedDate: bookData.publishedDate,
    pageCount: bookData.pageCount,
  };
};

// Get paginated books with filtering options
export const getBooks = async (
  query: BookQuery = {}
): Promise<BookResponse> => {
  console.log("API: Calling getBooks with query:", query);

  // Log specifically for genres filter
  if (query.genres) {
    console.log(
      "API: Genres filter:",
      Array.isArray(query.genres) ? query.genres : [query.genres]
    );
  }

  try {
    // Manually build params to ensure genres are sent correctly
    const params: Record<string, any> = { ...query };

    // Check if genres need special handling
    if (
      params.genres &&
      Array.isArray(params.genres) &&
      params.genres.length === 0
    ) {
      delete params.genres; // Remove empty arrays
    }

    console.log("API: Final params for API call:", params);
    const response = await api.get("/books", { params });
    console.log("API: getBooks response data:", response.data);

    // Xử lý dữ liệu để đảm bảo tính đúng đắn
    const transformedBooks = response.data.books.map(transformBookData);

    return {
      books: transformedBooks,
      total: response.data.total,
      page: response.data.page,
      limit: response.data.limit,
    };
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

    // Xử lý dữ liệu để đảm bảo tính đúng đắn
    return transformBookData(response.data);
  } catch (error) {
    console.error(`Error in getBookById API call for id ${id}:`, error);
    throw error;
  }
};

// Get books by category
export const getBooksByCategory = async (
  category: string,
  query: Omit<BookQuery, "genres"> = {}
): Promise<BookResponse> => {
  console.log(
    `Calling getBooksByCategory API for category: ${category} with query:`,
    query
  );
  try {
    const response = await api.get("/books", {
      params: { ...query, genres: [category] },
    });
    console.log("getBooksByCategory API response:", response.data);

    // Xử lý dữ liệu để đảm bảo tính đúng đắn
    const transformedBooks = response.data.books.map(transformBookData);

    return {
      books: transformedBooks,
      total: response.data.total,
      page: response.data.page,
      limit: response.data.limit,
    };
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
  try {
    // Không xây dựng URL thủ công, để axios xử lý việc này
    const response = await api.get("/books/featured", {
      params: { limit },
      // Đảm bảo không xảy ra lỗi từ URL
      paramsSerializer: (params) => {
        const searchParams = new URLSearchParams();
        for (const key in params) {
          searchParams.append(key, params[key]);
        }
        return searchParams.toString();
      },
    });

    console.log("getFeaturedBooks API response:", response.data);

    if (!Array.isArray(response.data)) {
      console.warn("Expected array response, but got:", typeof response.data);
      return [];
    }

    // Xử lý dữ liệu để đảm bảo tính đúng đắn
    return response.data.map(transformBookData);
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

// Get all unique genres
export const getAllGenres = async (): Promise<string[]> => {
  console.log(
    "Calling getAllGenres API with URL:",
    `${api.defaults.baseURL}/books/genres`
  );
  try {
    const response = await api.get("/books/genres");
    console.log("getAllGenres API response:", response);
    console.log(
      "getAllGenres data type:",
      typeof response.data,
      Array.isArray(response.data)
    );

    if (!response.data || !Array.isArray(response.data)) {
      console.warn(
        "Expected array response for genres, but got:",
        response.data
      );
      // Fallback list trong trường hợp API trả về không phải mảng
      return [
        "Fiction",
        "Non-Fiction",
        "Science Fiction",
        "Fantasy",
        "Mystery",
      ];
    }

    return response.data;
  } catch (error: any) {
    console.error("Error in getAllGenres API call:", error);
    if (error.response) {
      console.error("Response error status:", error.response.status);
      console.error("Response error data:", error.response.data);
    } else if (error.request) {
      console.error("Request made but no response received:", error.request);
    }
    // Fallback list khi có lỗi
    return ["Fiction", "Non-Fiction", "Science Fiction", "Fantasy", "Mystery"];
  }
};
