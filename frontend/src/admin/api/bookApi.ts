import axios from "axios";
import {
  Book,
  BookFilters,
  BookFormData,
  BookListResponse,
} from "../types/book.types";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

// Helper function to get admin token
const getAdminToken = (): string | null => {
  return localStorage.getItem("adminToken");
};

// Helper function to set auth header
const getAuthHeaders = () => {
  const token = getAdminToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Function to convert BookFilters to query params
const buildQueryParams = (filters: BookFilters): string => {
  const params = new URLSearchParams();

  if (filters.search) params.append("search", filters.search);
  if (filters.author) params.append("author", filters.author);
  if (filters.minPrice !== undefined)
    params.append("minPrice", filters.minPrice.toString());
  if (filters.maxPrice !== undefined)
    params.append("maxPrice", filters.maxPrice.toString());
  if (filters.genres && filters.genres.length > 0) {
    filters.genres.forEach((genre) => params.append("genres", genre));
  }
  if (filters.inStock !== undefined)
    params.append("inStock", filters.inStock.toString());
  if (filters.onSale !== undefined)
    params.append("onSale", filters.onSale.toString());
  if (filters.sortBy) params.append("sortBy", filters.sortBy);
  if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

  params.append("page", filters.page.toString());
  params.append("limit", filters.limit.toString());

  return params.toString();
};

// Mock data for books (temporary until backend is ready)
const MOCK_BOOKS: Book[] = [
  {
    id: "1",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    description:
      "A classic novel about racial injustice in the American South.",
    price: 12.99,
    coverImage: "https://example.com/to-kill-a-mockingbird.jpg",
    isbn: "978-0061120084",
    publicationDate: "1960-07-11",
    publisher: "HarperCollins",
    pageCount: 336,
    genres: ["Fiction", "Classic", "Historical"],
    language: "English",
    stockQuantity: 25,
    rating: 4.8,
    isOnSale: false,
    createdAt: "2023-01-15T10:30:00Z",
    updatedAt: "2023-01-15T10:30:00Z",
  },
  {
    id: "2",
    title: "1984",
    author: "George Orwell",
    description: "A dystopian novel set in a totalitarian society.",
    price: 11.99,
    salePrice: 9.99,
    coverImage: "https://example.com/1984.jpg",
    isbn: "978-0451524935",
    publicationDate: "1949-06-08",
    publisher: "Penguin Books",
    pageCount: 328,
    genres: ["Fiction", "Dystopian", "Science Fiction"],
    language: "English",
    stockQuantity: 18,
    rating: 4.7,
    isOnSale: true,
    createdAt: "2023-01-16T14:20:00Z",
    updatedAt: "2023-01-16T14:20:00Z",
  },
  {
    id: "3",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    description:
      "A romantic novel about societal expectations and personal growth.",
    price: 10.99,
    coverImage: "https://example.com/pride-and-prejudice.jpg",
    isbn: "978-0141439518",
    publicationDate: "1813-01-28",
    publisher: "Penguin Classics",
    pageCount: 432,
    genres: ["Fiction", "Classic", "Romance"],
    language: "English",
    stockQuantity: 30,
    rating: 4.6,
    isOnSale: false,
    createdAt: "2023-01-17T09:10:00Z",
    updatedAt: "2023-01-17T09:10:00Z",
  },
  {
    id: "4",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    description: "A novel about decadence and excess in the Jazz Age.",
    price: 14.99,
    salePrice: 12.49,
    coverImage: "https://example.com/great-gatsby.jpg",
    isbn: "978-0743273565",
    publicationDate: "1925-04-10",
    publisher: "Scribner",
    pageCount: 180,
    genres: ["Fiction", "Classic", "Literary Fiction"],
    language: "English",
    stockQuantity: 15,
    rating: 4.5,
    isOnSale: true,
    createdAt: "2023-01-18T11:45:00Z",
    updatedAt: "2023-01-18T11:45:00Z",
  },
  {
    id: "5",
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    description: "A novel about teenage alienation and identity.",
    price: 11.49,
    coverImage: "https://example.com/catcher-in-the-rye.jpg",
    isbn: "978-0316769480",
    publicationDate: "1951-07-16",
    publisher: "Little, Brown and Company",
    pageCount: 234,
    genres: ["Fiction", "Classic", "Coming of Age"],
    language: "English",
    stockQuantity: 22,
    rating: 4.3,
    isOnSale: false,
    createdAt: "2023-01-19T13:30:00Z",
    updatedAt: "2023-01-19T13:30:00Z",
  },
];

// Get all books with filters (with mock implementation for now)
export const getBooks = async (
  filters: BookFilters
): Promise<BookListResponse> => {
  try {
    // In the future, this will be replaced with a real API call
    // const response = await axios.get(`${API_URL}/admin/books?${buildQueryParams(filters)}`, getAuthHeaders());
    // return response.data;

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate delay

    let filteredBooks = [...MOCK_BOOKS];

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredBooks = filteredBooks.filter(
        (book) =>
          book.title.toLowerCase().includes(searchLower) ||
          book.author.toLowerCase().includes(searchLower) ||
          book.description.toLowerCase().includes(searchLower)
      );
    }

    if (filters.author) {
      const authorLower = filters.author.toLowerCase();
      filteredBooks = filteredBooks.filter((book) =>
        book.author.toLowerCase().includes(authorLower)
      );
    }

    if (filters.minPrice !== undefined) {
      filteredBooks = filteredBooks.filter(
        (book) => (book.salePrice || book.price) >= filters.minPrice!
      );
    }

    if (filters.maxPrice !== undefined) {
      filteredBooks = filteredBooks.filter(
        (book) => (book.salePrice || book.price) <= filters.maxPrice!
      );
    }

    if (filters.genres && filters.genres.length > 0) {
      filteredBooks = filteredBooks.filter((book) =>
        filters.genres!.some((genre) => book.genres.includes(genre))
      );
    }

    if (filters.inStock !== undefined) {
      filteredBooks = filteredBooks.filter((book) =>
        filters.inStock ? book.stockQuantity > 0 : book.stockQuantity === 0
      );
    }

    if (filters.onSale !== undefined) {
      filteredBooks = filteredBooks.filter(
        (book) => book.isOnSale === filters.onSale
      );
    }

    // Apply sorting
    if (filters.sortBy) {
      const direction = filters.sortOrder === "desc" ? -1 : 1;

      filteredBooks.sort((a, b) => {
        switch (filters.sortBy) {
          case "title":
            return direction * a.title.localeCompare(b.title);
          case "author":
            return direction * a.author.localeCompare(b.author);
          case "price":
            const priceA = a.salePrice || a.price;
            const priceB = b.salePrice || b.price;
            return direction * (priceA - priceB);
          case "rating":
            return direction * (a.rating - b.rating);
          case "stockQuantity":
            return direction * (a.stockQuantity - b.stockQuantity);
          case "publicationDate":
            return (
              direction *
              (new Date(a.publicationDate).getTime() -
                new Date(b.publicationDate).getTime())
            );
          default:
            return 0;
        }
      });
    }

    // Calculate pagination
    const total = filteredBooks.length;
    const totalPages = Math.ceil(total / filters.limit);
    const startIndex = (filters.page - 1) * filters.limit;
    const endIndex = startIndex + filters.limit;
    const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

    return {
      books: paginatedBooks,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages,
    };
  } catch (error) {
    console.error("Error fetching books:", error);
    throw error;
  }
};

// Get a single book by ID
export const getBook = async (id: string): Promise<Book> => {
  try {
    // In the future, this will be replaced with a real API call
    // const response = await axios.get(`${API_URL}/admin/books/${id}`, getAuthHeaders());
    // return response.data;

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate delay

    const book = MOCK_BOOKS.find((b) => b.id === id);

    if (!book) {
      throw new Error("Book not found");
    }

    return book;
  } catch (error) {
    console.error(`Error fetching book with ID ${id}:`, error);
    throw error;
  }
};

// Create a new book
export const createBook = async (bookData: BookFormData): Promise<Book> => {
  try {
    // In a real implementation, we'd handle file uploads here
    // If bookData.coverImage is a File, we'd upload it first and get the URL
    // Then we'd send the bookData with the coverImageUrl to the API

    // const formData = new FormData();
    // Object.entries(bookData).forEach(([key, value]) => {
    //   if (key === 'coverImage' && value instanceof File) {
    //     formData.append('coverImage', value);
    //   } else if (key !== 'coverImage' && key !== 'coverImageUrl') {
    //     if (Array.isArray(value)) {
    //       value.forEach(item => formData.append(key + '[]', item));
    //     } else if (value !== undefined && value !== null) {
    //       formData.append(key, value.toString());
    //     }
    //   }
    // });

    // const response = await axios.post(`${API_URL}/admin/books`, formData, {
    //   ...getAuthHeaders(),
    //   headers: {
    //     ...getAuthHeaders().headers,
    //     'Content-Type': 'multipart/form-data',
    //   },
    // });
    // return response.data;

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay

    const newBook: Book = {
      id: String(MOCK_BOOKS.length + 1),
      ...bookData,
      coverImage:
        bookData.coverImageUrl || "https://example.com/default-book-cover.jpg",
      rating: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // In a real implementation, the server would add the book to the database
    // Here we're just returning the new book object

    return newBook;
  } catch (error) {
    console.error("Error creating book:", error);
    throw error;
  }
};

// Update an existing book
export const updateBook = async (
  id: string,
  bookData: BookFormData
): Promise<Book> => {
  try {
    // Similar to createBook, we'd handle file uploads here in a real implementation

    // const formData = new FormData();
    // Object.entries(bookData).forEach(([key, value]) => {
    //   if (key === 'coverImage' && value instanceof File) {
    //     formData.append('coverImage', value);
    //   } else if (key !== 'coverImage' && key !== 'coverImageUrl') {
    //     if (Array.isArray(value)) {
    //       value.forEach(item => formData.append(key + '[]', item));
    //     } else if (value !== undefined && value !== null) {
    //       formData.append(key, value.toString());
    //     }
    //   }
    // });

    // const response = await axios.put(`${API_URL}/admin/books/${id}`, formData, {
    //   ...getAuthHeaders(),
    //   headers: {
    //     ...getAuthHeaders().headers,
    //     'Content-Type': 'multipart/form-data',
    //   },
    // });
    // return response.data;

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay

    const bookIndex = MOCK_BOOKS.findIndex((b) => b.id === id);

    if (bookIndex === -1) {
      throw new Error("Book not found");
    }

    const updatedBook: Book = {
      ...MOCK_BOOKS[bookIndex],
      ...bookData,
      coverImage: bookData.coverImageUrl || MOCK_BOOKS[bookIndex].coverImage,
      updatedAt: new Date().toISOString(),
    };

    // In a real implementation, the server would update the book in the database
    // Here we're just returning the updated book object

    return updatedBook;
  } catch (error) {
    console.error(`Error updating book with ID ${id}:`, error);
    throw error;
  }
};

// Delete a book
export const deleteBook = async (id: string): Promise<void> => {
  try {
    // In the future, this will be replaced with a real API call
    // await axios.delete(`${API_URL}/admin/books/${id}`, getAuthHeaders());

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate delay

    const bookIndex = MOCK_BOOKS.findIndex((b) => b.id === id);

    if (bookIndex === -1) {
      throw new Error("Book not found");
    }

    // In a real implementation, the server would delete the book from the database
    // Here we're just simulating a successful deletion
  } catch (error) {
    console.error(`Error deleting book with ID ${id}:`, error);
    throw error;
  }
};
