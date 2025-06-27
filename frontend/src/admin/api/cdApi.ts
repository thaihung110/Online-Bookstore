import axios from "axios";
import {
  CD,
  CDFilters,
  CDFormData,
  CDListResponse,
} from "../types/cd.types";

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

// Function to convert CDFilters to query params
const buildQueryParams = (filters: CDFilters): string => {
  const params = new URLSearchParams();

  if (filters.search) params.append("search", filters.search);
  if (filters.artist) params.append("artist", filters.artist);
  if (filters.albumTitle) params.append("albumTitle", filters.albumTitle);
  if (filters.category) params.append("category", filters.category);
  if (filters.sortBy) params.append("sortBy", filters.sortBy);
  if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());

  return params.toString();
};

// Get all CDs with filtering
export const getCDs = async (filters: CDFilters = {}): Promise<CDListResponse> => {
  try {
    const queryParams = buildQueryParams(filters);
    const url = `${API_URL}/admin/cds${queryParams ? `?${queryParams}` : ""}`;
    
    const response = await axios.get<CDListResponse>(url, getAuthHeaders());
    return response.data;
  } catch (error: any) {
    console.error("Error fetching CDs:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch CDs");
  }
};

// Get CD by ID
export const getCDById = async (id: string): Promise<CD> => {
  try {
    const response = await axios.get<CD>(
      `${API_URL}/admin/cds/${id}`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching CD:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch CD");
  }
};

// Create a new CD
export const createCD = async (cdData: CDFormData): Promise<CD> => {
  try {
    const response = await axios.post<CD>(
      `${API_URL}/admin/cds`,
      cdData,
      getAuthHeaders()
    );
    return response.data;
  } catch (error: any) {
    console.error("Error creating CD:", error);
    throw new Error(error.response?.data?.message || "Failed to create CD");
  }
};

// Update an existing CD
export const updateCD = async (id: string, cdData: CDFormData): Promise<CD> => {
  try {
    const response = await axios.patch<CD>(
      `${API_URL}/admin/cds/${id}`,
      cdData,
      getAuthHeaders()
    );
    return response.data;
  } catch (error: any) {
    console.error("Error updating CD:", error);
    throw new Error(error.response?.data?.message || "Failed to update CD");
  }
};

// Delete a CD
export const deleteCD = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/admin/cds/${id}`, getAuthHeaders());
  } catch (error: any) {
    console.error("Error deleting CD:", error);
    throw new Error(error.response?.data?.message || "Failed to delete CD");
  }
};

// Get all CD categories
export const getCDCategories = async (): Promise<string[]> => {
  try {
    const response = await axios.get<string[]>(
      `${API_URL}/cds/categories`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching CD categories:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch CD categories");
  }
};