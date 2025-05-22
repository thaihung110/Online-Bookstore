import { create } from "zustand";
import axios from "axios";

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

      // In a real implementation, this would call the actual API
      // For now we'll simulate an API call with local storage
      // TODO: Replace with actual API call when backend is ready

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock admin login - replace with actual API call
      if (email === "admin@bookstore.com" && password === "admin123") {
        const adminData = {
          id: "1",
          name: "Admin User",
          email: "admin@bookstore.com",
        };

        // Store token in localStorage (replace with JWT from actual API)
        localStorage.setItem("adminToken", "mock-jwt-token");
        localStorage.setItem("adminData", JSON.stringify(adminData));

        set({
          admin: adminData,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        set({
          admin: null,
          isAuthenticated: false,
          isLoading: false,
          error: "Invalid email or password",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      set({
        admin: null,
        isAuthenticated: false,
        isLoading: false,
        error: "Login failed. Please try again.",
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

      // Get admin data from localStorage
      const adminDataStr = localStorage.getItem("adminData");

      if (adminDataStr) {
        const adminData = JSON.parse(adminDataStr);
        set({
          admin: adminData,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          admin: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }

      // TODO: Replace with actual API verification of token
      // when backend is ready
      // const response = await axios.get('/api/admin/auth/me', {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // set({ admin: response.data, isAuthenticated: true, isLoading: false });
    } catch (error) {
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
