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
  if (filters.director) params.append("director", filters.director);
  if (filters.studio) params.append("studio", filters.studio);
  if (filters.filmtype) params.append("filmtype", filters.filmtype);
  if (filters.disctype) params.append("disctype", filters.disctype);
  if (filters.sortBy) params.append("sortBy", filters.sortBy);
  if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());

  return params.toString();
};

// Get all DVDs with filtering
export const getDVDs = async (filters: DVDFilters = {}): Promise<DVDListResponse> => {
  try {
    const queryParams = buildQueryParams(filters);
    const url = `${API_URL}/admin/dvds${queryParams ? `?${queryParams}` : ""}`;
    
    const response = await axios.get<DVDListResponse>(url, getAuthHeaders());
    return response.data;
  } catch (error: any) {
    console.error("Error fetching DVDs:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch DVDs");
  }
};

// Get DVD by ID
export const getDVDById = async (id: string): Promise<DVD> => {
  try {
    const response = await axios.get<DVD>(
      `${API_URL}/admin/dvds/${id}`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching DVD:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch DVD");
  }
};

// Create a new DVD
export const createDVD = async (dvdData: DVDFormData): Promise<DVD> => {
  try {
    const response = await axios.post<DVD>(
      `${API_URL}/admin/dvds`,
      dvdData,
      getAuthHeaders()
    );
    return response.data;
  } catch (error: any) {
    console.error("Error creating DVD:", error);
    throw new Error(error.response?.data?.message || "Failed to create DVD");
  }
};

// Update an existing DVD
export const updateDVD = async (id: string, dvdData: DVDFormData): Promise<DVD> => {
  try {
    const response = await axios.patch<DVD>(
      `${API_URL}/admin/dvds/${id}`,
      dvdData,
      getAuthHeaders()
    );
    return response.data;
  } catch (error: any) {
    console.error("Error updating DVD:", error);
    throw new Error(error.response?.data?.message || "Failed to update DVD");
  }
};

// Delete a DVD
export const deleteDVD = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/admin/dvds/${id}`, getAuthHeaders());
  } catch (error: any) {
    console.error("Error deleting DVD:", error);
    throw new Error(error.response?.data?.message || "Failed to delete DVD");
  }
};

// Get all DVD film types
export const getDVDFilmTypes = async (): Promise<string[]> => {
  try {
    const response = await axios.get<string[]>(
      `${API_URL}/dvds/film-types`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching DVD film types:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch DVD film types");
  }
};

// Get all DVD disc types
export const getDVDDiscTypes = async (): Promise<string[]> => {
  try {
    const response = await axios.get<string[]>(
      `${API_URL}/dvds/disc-types`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching DVD disc types:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch DVD disc types");
  }
};