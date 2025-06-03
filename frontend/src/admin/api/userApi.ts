import axios from "axios";
import {
  User,
  UserFilters,
  UserFormData,
  UserListResponse,
  UserRole,
} from "../types/user.types";

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

// Function to convert UserFilters to query params
const buildQueryParams = (filters: UserFilters): string => {
  const params = new URLSearchParams();

  if (filters.search) params.append("search", filters.search);
  if (filters.role) params.append("role", filters.role);
  if (filters.isActive !== undefined)
    params.append("isActive", filters.isActive.toString());
  if (filters.sortBy) params.append("sortBy", filters.sortBy);
  if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

  params.append("page", filters.page.toString());
  params.append("limit", filters.limit.toString());

  return params.toString();
};

// Get all users from backend API
export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await axios.get(`${API_URL}/users`);
    // Map _id to id if needed
    return response.data.map((user: any) => ({
      ...user,
      id: user._id || user.id,
    }));
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// Get a single user by ID
export const getUser = async (id: string): Promise<User> => {
  try {
    const response = await axios.get(`${API_URL}/users/${id}`);
    const user = response.data;
    return { ...user, id: user._id || user.id };
  } catch (error) {
    console.error(`Error fetching user with ID ${id}:`, error);
    throw error;
  }
};

// Create a new user
export const createUser = async (userData: UserFormData): Promise<User> => {
  try {
    // Map name -> username, chỉ gửi các trường backend yêu cầu
    const payload: any = {
      username: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role,
    };
    const response = await axios.post(`${API_URL}/users`, payload);
    const user = response.data;
    return { ...user, id: user._id || user.id };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

// Update an existing user
export const updateUser = async (
  id: string,
  userData: UserFormData
): Promise<User> => {
  try {
    // Map name -> username, chỉ gửi các trường backend yêu cầu
    const payload: any = {
      username: userData.name,
      email: userData.email,
      role: userData.role,
    };
    if (userData.password) {
      payload.password = userData.password;
    }
    const response = await axios.put(`${API_URL}/users/${id}`, payload);
    const user = response.data;
    return { ...user, id: user._id || user.id };
  } catch (error) {
    console.error(`Error updating user with ID ${id}:`, error);
    throw error;
  }
};

// Delete a user
export const deleteUser = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/users/${id}`);
  } catch (error) {
    console.error(`Error deleting user with ID ${id}:`, error);
    throw error;
  }
};
