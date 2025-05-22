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

// Mock data for users (temporary until backend is ready)
const MOCK_USERS: User[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    role: UserRole.USER,
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    address: "123 Main St, Anytown, USA",
    phone: "555-123-4567",
    isActive: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: UserRole.USER,
    avatar: "https://randomuser.me/api/portraits/women/2.jpg",
    address: "456 Oak Ave, Somewhere, USA",
    phone: "555-987-6543",
    isActive: true,
    createdAt: "2024-01-02",
    updatedAt: "2024-01-02",
  },
  {
    id: "3",
    name: "Admin User",
    email: "admin@bookstore.com",
    role: UserRole.ADMIN,
    avatar: "https://randomuser.me/api/portraits/men/10.jpg",
    address: "789 Admin St, Adminville, USA",
    phone: "555-111-2222",
    isActive: true,
    createdAt: "2024-01-03",
    updatedAt: "2024-01-03",
  },
  {
    id: "4",
    name: "Bob Johnson",
    email: "bob.johnson@example.com",
    role: UserRole.USER,
    avatar: "https://randomuser.me/api/portraits/men/3.jpg",
    address: "789 Pine Rd, Elsewhere, USA",
    phone: "555-555-5555",
    isActive: false,
    createdAt: "2024-01-04",
    updatedAt: "2024-01-04",
  },
  {
    id: "5",
    name: "Sarah Williams",
    email: "sarah.williams@example.com",
    role: UserRole.USER,
    avatar: "https://randomuser.me/api/portraits/women/4.jpg",
    address: "321 Maple Dr, Nowhere, USA",
    phone: "555-222-3333",
    isActive: true,
    createdAt: "2024-01-05",
    updatedAt: "2024-01-05",
  },
];

// Get all users with filters (with mock implementation for now)
export const getUsers = async (
  filters: UserFilters
): Promise<UserListResponse> => {
  try {
    // In the future, this will be replaced with a real API call
    // const response = await axios.get(`${API_URL}/admin/users?${buildQueryParams(filters)}`, getAuthHeaders());
    // return response.data;

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate delay

    let filteredUsers = [...MOCK_USERS];

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
      );
    }

    if (filters.role) {
      filteredUsers = filteredUsers.filter(
        (user) => user.role === filters.role
      );
    }

    if (filters.isActive !== undefined) {
      filteredUsers = filteredUsers.filter(
        (user) => user.isActive === filters.isActive
      );
    }

    // Apply sorting
    if (filters.sortBy) {
      const direction = filters.sortOrder === "desc" ? -1 : 1;

      filteredUsers.sort((a, b) => {
        switch (filters.sortBy) {
          case "name":
            return direction * a.name.localeCompare(b.name);
          case "email":
            return direction * a.email.localeCompare(b.email);
          case "role":
            return direction * a.role.localeCompare(b.role);
          case "createdAt":
            return (
              direction *
              (new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime())
            );
          default:
            return 0;
        }
      });
    }

    // Calculate pagination
    const total = filteredUsers.length;
    const totalPages = Math.ceil(total / filters.limit);
    const startIndex = (filters.page - 1) * filters.limit;
    const endIndex = startIndex + filters.limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return {
      users: paginatedUsers,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages,
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// Get a single user by ID
export const getUser = async (id: string): Promise<User> => {
  try {
    // In the future, this will be replaced with a real API call
    // const response = await axios.get(`${API_URL}/admin/users/${id}`, getAuthHeaders());
    // return response.data;

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate delay

    const user = MOCK_USERS.find((u) => u.id === id);

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    console.error(`Error fetching user with ID ${id}:`, error);
    throw error;
  }
};

// Create a new user
export const createUser = async (userData: UserFormData): Promise<User> => {
  try {
    // In the future, this will be replaced with a real API call
    // const response = await axios.post(`${API_URL}/admin/users`, userData, getAuthHeaders());
    // return response.data;

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay

    const newUser: User = {
      id: String(MOCK_USERS.length + 1),
      ...userData,
      avatar: `https://randomuser.me/api/portraits/${
        userData.name.includes("Jane") || userData.name.includes("Sarah")
          ? "women"
          : "men"
      }/${Math.floor(Math.random() * 100)}.jpg`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // In a real implementation, the server would add the user to the database
    // Here we're just returning the new user object

    return newUser;
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
    // In the future, this will be replaced with a real API call
    // const response = await axios.put(`${API_URL}/admin/users/${id}`, userData, getAuthHeaders());
    // return response.data;

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay

    const userIndex = MOCK_USERS.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      throw new Error("User not found");
    }

    const updatedUser: User = {
      ...MOCK_USERS[userIndex],
      ...userData,
      updatedAt: new Date().toISOString(),
    };

    // In a real implementation, the server would update the user in the database
    // Here we're just returning the updated user object

    return updatedUser;
  } catch (error) {
    console.error(`Error updating user with ID ${id}:`, error);
    throw error;
  }
};

// Delete a user
export const deleteUser = async (id: string): Promise<void> => {
  try {
    // In the future, this will be replaced with a real API call
    // await axios.delete(`${API_URL}/admin/users/${id}`, getAuthHeaders());

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate delay

    const userIndex = MOCK_USERS.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      throw new Error("User not found");
    }

    // In a real implementation, the server would delete the user from the database
    // Here we're just simulating a successful deletion
  } catch (error) {
    console.error(`Error deleting user with ID ${id}:`, error);
    throw error;
  }
};
