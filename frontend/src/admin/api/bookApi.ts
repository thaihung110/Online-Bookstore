// import axios from "axios";
// import {
//   Book,
//   BookFilters,
//   BookFormData,
//   BookListResponse,
// } from "../types/book.types";

// const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

// // Helper function to get admin token
// const getAdminToken = (): string | null => {
//   return localStorage.getItem("adminToken");
// };

// // Helper function to set auth header
// const getAuthHeaders = () => {
//   const token = getAdminToken();
//   return {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   };
// };

// // Function to convert BookFilters to query params
// const buildQueryParams = (filters: BookFilters): string => {
//   const params = new URLSearchParams();

//   if (filters.search) params.append("search", filters.search);
//   if (filters.author) params.append("author", filters.author);
//   if (filters.minPrice !== undefined)
//     params.append("minPrice", filters.minPrice.toString());
//   if (filters.maxPrice !== undefined)
//     params.append("maxPrice", filters.maxPrice.toString());
//   if (filters.genres && filters.genres.length > 0) {
//     filters.genres.forEach((genre) => params.append("genres", genre));
//   }
//   if (filters.inStock !== undefined)
//     params.append("inStock", filters.inStock.toString());
//   if (filters.onSale !== undefined)
//     params.append("onSale", filters.onSale.toString());
//   if (filters.sortBy) params.append("sortBy", filters.sortBy);
//   if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

//   params.append("page", filters.page.toString());
//   params.append("limit", filters.limit.toString());

//   return params.toString();
// };



// // Get all books with filters
// export const getBooks = async (
//   filters: BookFilters
// ): Promise<BookListResponse> => {
//   const response = await axios.get(`${API_URL}/admin/books?${buildQueryParams(filters)}`, getAuthHeaders());
//   return response.data;
// };

// // Get a single book by ID
// export const getBook = async (id: string): Promise<Book> => {
//   const response = await axios.get(`${API_URL}/admin/books/${id}`, getAuthHeaders());
//   return response.data;
// };

// // Create a new book
// export const createBook = async (bookData: BookFormData): Promise<Book> => {
//   const response = await axios.post(`${API_URL}/admin/books`, bookData, getAuthHeaders());
//   return response.data;
// };

// // Update an existing book
// export const updateBook = async (
//   id: string,
//   bookData: BookFormData
// ): Promise<Book> => {
//   const response = await axios.put(`${API_URL}/admin/books/${id}`, bookData, getAuthHeaders());
//   return response.data;
// };

// // Delete a book
// export const deleteBook = async (id: string): Promise<void> => {
//   await axios.delete(`${API_URL}/admin/products/one/${id}`, getAuthHeaders());
// };

// // Types for presigned URL upload
// export interface UploadPresignedUrlRequest {
//   fileName: string;
//   contentType: string;
// }

// export interface UploadPresignedUrlResponse {
//   uploadUrl: string;
//   s3Key: string;
//   expiresIn: number;
// }

// // Get presigned URL for uploading book cover image
// export const getUploadPresignedUrl = async (
//   fileName: string,
//   contentType: string
// ): Promise<UploadPresignedUrlResponse> => {
//   try {
//     const response = await axios.post(
//       `${API_URL}/admin/books/upload-presigned-url`,
//       { fileName, contentType },
//       getAuthHeaders()
//     );
//     return response.data;
//   } catch (error) {
//     console.error("Failed to get presigned URL:", error);
//     throw new Error("Failed to get upload URL");
//   }
// };

// // Upload file to R2 using presigned URL
// export const uploadToR2 = async (
//   file: File,
//   uploadUrl: string,
//   onProgress?: (progress: number) => void
// ): Promise<void> => {
//   try {
//     await axios.put(uploadUrl, file, {
//       headers: {
//         'Content-Type': file.type,
//       },
//       onUploadProgress: (progressEvent) => {
//         if (onProgress && progressEvent.total) {
//           const progress = Math.round(
//             (progressEvent.loaded * 100) / progressEvent.total
//           );
//           onProgress(progress);
//         }
//       },
//     });
//   } catch (error) {
//     console.error("Failed to upload file to R2:", error);
//     throw new Error("Failed to upload file");
//   }
// };

// // Complete upload flow: get presigned URL and upload file
// export const uploadBookCover = async (
//   file: File,
//   onProgress?: (progress: number) => void
// ): Promise<string> => {
//   try {
//     // Step 1: Get presigned URL
//     const { uploadUrl, s3Key } = await getUploadPresignedUrl(
//       file.name,
//       file.type
//     );

//     // Step 2: Upload file to R2
//     await uploadToR2(file, uploadUrl, onProgress);

//     // Step 3: Return S3 key for saving with book data
//     return s3Key;
//   } catch (error) {
//     console.error("Failed to upload book cover:", error);
//     throw error;
//   }
// };


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

// Types for history entries
export interface HistoryEntry {
  productName: string;
  action: 'create' | 'update' | 'delete';
  timestamp: string;
}

export interface HistoryResponse {
  history: HistoryEntry[];
  total?: number;
  page?: number;
  limit?: number;
}

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

// Get all books with filters
export const getBooks = async (
  filters: BookFilters
): Promise<BookListResponse> => {
  const response = await axios.get(`${API_URL}/admin/books?${buildQueryParams(filters)}`, getAuthHeaders());
  return response.data;
};

// Get a single book by ID
export const getBook = async (id: string): Promise<Book> => {
  const response = await axios.get(`${API_URL}/admin/books/${id}`, getAuthHeaders());
  return response.data;
};

// Get history data
export const getHistory = async (): Promise<HistoryEntry[]> => {
  try {
    const response = await axios.get(`${API_URL}/admin/products/history`, getAuthHeaders());
    
    // Handle different response formats
    if (response.data.history && Array.isArray(response.data.history)) {
      return response.data.history;
    } else if (Array.isArray(response.data)) {
      return response.data;
    } else {
      console.warn('Unexpected API response format:', response.data);
      return [];
    }
  } catch (error) {
    console.error("Failed to fetch history:", error);
    throw new Error("Failed to load history data");
  }
};

// Create a new book
export const createBook = async (bookData: BookFormData): Promise<Book> => {
  const response = await axios.post(`${API_URL}/admin/books`, bookData, getAuthHeaders());
  return response.data;
};

// Update an existing book
export const updateBook = async (
  id: string,
  bookData: BookFormData
): Promise<Book> => {
  const response = await axios.put(`${API_URL}/admin/books/${id}`, bookData, getAuthHeaders());
  return response.data;
};

// Delete a book
export const deleteBook = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/admin/products/one/${id}`, getAuthHeaders());
};

// Types for presigned URL upload
export interface UploadPresignedUrlRequest {
  fileName: string;
  contentType: string;
}

export interface UploadPresignedUrlResponse {
  uploadUrl: string;
  s3Key: string;
  expiresIn: number;
}

// Get presigned URL for uploading book cover image
export const getUploadPresignedUrl = async (
  fileName: string,
  contentType: string
): Promise<UploadPresignedUrlResponse> => {
  try {
    const response = await axios.post(
      `${API_URL}/admin/books/upload-presigned-url`,
      { fileName, contentType },
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error("Failed to get presigned URL:", error);
    throw new Error("Failed to get upload URL");
  }
};

// Upload file to R2 using presigned URL
export const uploadToR2 = async (
  file: File,
  uploadUrl: string,
  onProgress?: (progress: number) => void
): Promise<void> => {
  try {
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    });
  } catch (error) {
    console.error("Failed to upload file to R2:", error);
    throw new Error("Failed to upload file");
  }
};

// Complete upload flow: get presigned URL and upload file
export const uploadBookCover = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    // Step 1: Get presigned URL
    const { uploadUrl, s3Key } = await getUploadPresignedUrl(
      file.name,
      file.type
    );

    // Step 2: Upload file to R2
    await uploadToR2(file, uploadUrl, onProgress);

    // Step 3: Return S3 key for saving with book data
    return s3Key;
  } catch (error) {
    console.error("Failed to upload book cover:", error);
    throw error;
  }
};