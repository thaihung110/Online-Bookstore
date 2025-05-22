import { create } from "zustand";
import {
  Book,
  BookQuery,
  getBooks,
  getBookById,
  getAllGenres,
} from "../api/books";

interface BookState {
  books: Book[];
  featuredBooks: Book[];
  currentBook: Book | null;
  totalBooks: number;
  currentPage: number;
  limit: number;
  isLoading: boolean;
  error: string | null;
  filters: BookQuery;
  genres: string[];

  // Actions
  fetchBooks: (query?: BookQuery) => Promise<void>;
  fetchBookById: (id: string) => Promise<void>;
  setFilters: (filters: Partial<BookQuery>) => void;
  resetFilters: () => void;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  setPage: (page: number) => Promise<void>;
  clearError: () => void;
  loadGenres: () => Promise<void>;
}

const defaultFilters: BookQuery = {
  page: 1,
  limit: 12,
  sortBy: "title",
  sortOrder: "asc",
};

export const useBookStore = create<BookState>((set, get) => ({
  books: [],
  featuredBooks: [],
  currentBook: null,
  totalBooks: 0,
  currentPage: 1,
  limit: 10,
  isLoading: false,
  error: null,
  filters: defaultFilters,
  genres: [],

  fetchBooks: async (query) => {
    try {
      set({ isLoading: true, error: null });

      // Merge current filters with new query params
      const mergedQuery = query
        ? { ...get().filters, ...query }
        : get().filters;

      console.log(
        "BookStore: Fetching books with query:",
        JSON.stringify(mergedQuery)
      );

      // Check specifically for genres filter
      if (mergedQuery.genres) {
        console.log(
          "BookStore: Using genres filter:",
          Array.isArray(mergedQuery.genres)
            ? mergedQuery.genres
            : [mergedQuery.genres]
        );
      }

      const response = await getBooks(mergedQuery);
      console.log("BookStore: Books API response:", response);

      set({
        books: response.books,
        totalBooks: response.total,
        currentPage: response.page,
        limit: response.limit,
        filters: mergedQuery,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching books:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to fetch books",
        isLoading: false,
      });
    }
  },

  fetchBookById: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const book = await getBookById(id);
      set({ currentBook: book, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch book details",
        isLoading: false,
      });
    }
  },

  setFilters: (filters) => {
    const updatedFilters = { ...get().filters, ...filters, page: 1 }; // Reset to page 1 when filters change
    set({ filters: updatedFilters });
    get().fetchBooks(updatedFilters);
  },

  resetFilters: () => {
    set({ filters: defaultFilters });
    get().fetchBooks(defaultFilters);
  },

  nextPage: async () => {
    const { currentPage, totalBooks, limit, filters } = get();
    const totalPages = Math.ceil(totalBooks / limit);

    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      await get().setPage(newPage);
    }
  },

  prevPage: async () => {
    const { currentPage } = get();

    if (currentPage > 1) {
      const newPage = currentPage - 1;
      await get().setPage(newPage);
    }
  },

  setPage: async (page) => {
    const updatedFilters = { ...get().filters, page };
    set({ filters: updatedFilters });
    await get().fetchBooks(updatedFilters);
  },

  clearError: () => set({ error: null }),

  loadGenres: async () => {
    try {
      console.log("Loading genres...");
      const genres = await getAllGenres();
      console.log("Genres loaded:", genres);

      if (!genres || genres.length === 0) {
        console.warn("No genres returned from API, using fallback list");
        // Fallback list trong trường hợp API trả về rỗng
        set({
          genres: [
            "Fiction",
            "Non-Fiction",
            "Science Fiction",
            "Fantasy",
            "Mystery",
            "Romance",
            "Thriller",
            "Biography",
            "History",
            "Business",
          ],
        });
      } else {
        set({ genres });
      }
    } catch (error) {
      console.error("Error loading genres:", error);
      // Fallback khi có lỗi
      set({
        genres: [
          "Fiction",
          "Non-Fiction",
          "Science Fiction",
          "Fantasy",
          "Mystery",
        ],
        error: error instanceof Error ? error.message : "Failed to load genres",
      });
    }
  },
}));
