import axios from "axios";
import {
  DVD,
  DVDFilters,
  DVDFormData,
  DVDListResponse,
} from "../types/dvd.types";

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

// Function to convert DVDFilters to query params
const buildQueryParams = (filters: DVDFilters): string => {
  const params = new URLSearchParams();

  if (filters.search) params.append("search", filters.search);

  if (filters.minPrice !== undefined)
    params.append("minPrice", filters.minPrice.toString());
  if (filters.maxPrice !== undefined)
    params.append("maxPrice", filters.maxPrice.toString());
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




// Get all dvds with filters
export const getDVDs = async (
  filters: DVDFilters
): Promise<DVDListResponse> => {
  const response = await axios.get(`${API_URL}/admin/dvds?${buildQueryParams(filters)}`, getAuthHeaders());
  return response.data;
};

// Get a single dvd by ID
export const getDVD = async (id: string): Promise<DVD> => {
  const response = await axios.get(`${API_URL}/admin/dvds/${id}`, getAuthHeaders());
  return response.data;
};

// Create a new dvd
export const createDVD = async (dvdData: DVDFormData): Promise<DVD> => {
  const response = await axios.post(`${API_URL}/admin/dvds`, dvdData, getAuthHeaders());
  return response.data;
};

// Update an existing dvd
export const updateDVD = async (
  id: string,
  dvdData: DVDFormData
): Promise<DVD> => {
  const response = await axios.put(`${API_URL}/admin/dvds/${id}`, dvdData, getAuthHeaders());
  return response.data;
};

// Delete a dvd
export const deleteDVD = async (id: string): Promise<void> => {
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

// Get presigned URL for uploading dvd cover image
export const getUploadPresignedUrl = async (
  fileName: string,
  contentType: string
): Promise<UploadPresignedUrlResponse> => {
  try {
    const response = await axios.post(
      `${API_URL}/admin/dvds/upload-presigned-url`,
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
export const uploadDVDCover = async (
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

    // Step 3: Return S3 key for saving with dvd data
    return s3Key;
  } catch (error) {
    console.error("Failed to upload dvd cover:", error);
    throw error;
  }
};

