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
import api from "../api/axios";

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
    (set: any, get: any) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const credentials: LoginRequest = { email, password };
          console.log("Đang đăng nhập với:", email);
          console.log("API URL:", api.defaults.baseURL);

          const response = await apiLogin(credentials);
          console.log("Đăng nhập thành công:", response);

          localStorage.setItem("token", response.token); // Store token
          set({
            token: response.token,
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          console.error("Chi tiết lỗi đăng nhập:", error);

          let errorMessage = "Đã xảy ra lỗi trong quá trình đăng nhập";

          // Sử dụng thông báo lỗi chi tiết từ axios interceptor nếu có
          if (error.userMessage) {
            errorMessage = error.userMessage;
          } else if (error.message === "Network Error") {
            errorMessage =
              "Lỗi kết nối: Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối của bạn hoặc trạng thái máy chủ.";
          }

          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
            token: null,
            user: null,
          });
        }
      },

      register: async (username: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const userData: RegisterRequest = { username, email, password };
          console.log("Đang đăng ký với:", email);

          const response = await apiRegister(userData);
          console.log("Đăng ký thành công:", response);

          localStorage.setItem("token", response.token); // Store token
          set({
            token: response.token,
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          console.error("Chi tiết lỗi đăng ký:", error);

          let errorMessage = "Đã xảy ra lỗi trong quá trình đăng ký";

          // Sử dụng thông báo lỗi chi tiết từ axios interceptor nếu có
          if (error.userMessage) {
            errorMessage = error.userMessage;
          } else if (error.message === "Network Error") {
            errorMessage =
              "Lỗi kết nối: Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối của bạn hoặc trạng thái máy chủ.";
          } else if (error.response?.data?.message) {
            // Có thể là lỗi xác thực hoặc email/username đã tồn tại
            errorMessage = error.response.data.message;
          }

          set({
            error: errorMessage,
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
          console.log("Đang lấy thông tin người dùng hiện tại");
          const user = await apiGetCurrentUser();
          console.log("Đã nhận thông tin người dùng:", user);
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          console.error("Chi tiết lỗi khi lấy thông tin người dùng:", error);

          let errorMessage = "Không thể lấy thông tin người dùng";

          // Sử dụng thông báo lỗi chi tiết từ axios interceptor nếu có
          if (error.userMessage) {
            errorMessage = error.userMessage;
          }

          // If fetching user fails (e.g., invalid token), log out
          localStorage.removeItem("token");
          set({
            error: errorMessage,
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
      name: "auth-storage",
      partialize: (state: AuthState) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
