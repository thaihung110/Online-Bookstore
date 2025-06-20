import { create } from "zustand";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

interface Admin {
  id: string;
  name: string;
  email: string;
}

interface AdminAuthState {
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  admin: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true
  error: null,

  // Login admin
  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });

      // Real API call to backend
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      const { token, user } = response.data;

      // Check if user has admin role
      if (user.role !== 'admin') {
        set({
          admin: null,
          isAuthenticated: false,
          isLoading: false,
          error: "Access denied. Admin privileges required.",
        });
        return;
      }

      // Store token and admin data
      localStorage.setItem("adminToken", token);
      localStorage.setItem("adminData", JSON.stringify({
        id: user.id,
        name: user.username || user.email,
        email: user.email,
      }));

      set({
        admin: {
          id: user.id,
          name: user.username || user.email,
          email: user.email,
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error("Login error:", error);

      let errorMessage = "Login failed. Please try again.";
      if (error.response?.status === 401) {
        errorMessage = "Invalid email or password";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      set({
        admin: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      });
    }
  },

  // Logout admin
  logout: () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    set({
      admin: null,
      isAuthenticated: false,
      error: null,
    });
  },

  // Check if admin is authenticated
  checkAuth: async () => {
    try {
      set({ isLoading: true });

      // Check for token in localStorage
      const token = localStorage.getItem("adminToken");

      if (!token) {
        set({
          admin: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      // Verify token with backend
      const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const user = response.data;

      // Check if user has admin role
      if (user.role !== 'admin') {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminData");
        set({
          admin: null,
          isAuthenticated: false,
          isLoading: false,
          error: "Access denied. Admin privileges required.",
        });
        return;
      }

      // Update admin data
      const adminData = {
        id: user.id,
        name: user.username || user.email,
        email: user.email,
      };

      localStorage.setItem("adminData", JSON.stringify(adminData));
      set({
        admin: adminData,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      console.error("Auth check error:", error);
      // If verification fails, clear storage and set not authenticated
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminData");
      set({
        admin: null,
        isAuthenticated: false,
        isLoading: false,
        error: "Authentication failed. Please login again.",
      });
    }
  },
}));
