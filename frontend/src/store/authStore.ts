import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  login as apiLogin,
  register as apiRegister,
  getCurrentUser as apiGetCurrentUser,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from "../api/auth";

type User = AuthResponse["user"];

type AuthState = {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const credentials: LoginRequest = { email, password };
          const response = await apiLogin(credentials);
          localStorage.setItem("token", response.token); // Store token
          set({
            token: response.token,
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "An error occurred during login",
            isLoading: false,
            isAuthenticated: false,
            token: null,
            user: null,
          });
        }
      },

      register: async (username, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const userData: RegisterRequest = { username, email, password };
          const response = await apiRegister(userData);
          localStorage.setItem("token", response.token); // Store token
          set({
            token: response.token,
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "An error occurred during registration",
            isLoading: false,
            isAuthenticated: false,
            token: null,
            user: null,
          });
        }
      },

      logout: () => {
        localStorage.removeItem("token"); // Remove token on logout
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      fetchCurrentUser: async () => {
        const token = get().token; // Get token from state
        if (!token) {
          // No token, so ensure user is logged out
          set({ user: null, isAuthenticated: false, token: null });
          return;
        }
        set({ isLoading: true, error: null });
        try {
          const user = await apiGetCurrentUser();
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // If fetching user fails (e.g., invalid token), log out
          localStorage.removeItem("token");
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to fetch user data",
            isLoading: false,
            isAuthenticated: false,
            token: null,
            user: null,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage", // name of the item in localStorage
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
