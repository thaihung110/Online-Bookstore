import axios, { AxiosError } from "axios";

// Define types for API error response
interface ApiErrorResponse {
  message?: string;
  code?: string;
}

// Base API URL - would be set from environment in production
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001/api";

// Đảm bảo URL có định dạng chính xác với /api ở cuối
const ensureApiSuffix = (url: string) => {
  if (!url) return "http://localhost:3001/api";

  // Loại bỏ dấu / ở cuối nếu có
  const cleanUrl = url.endsWith("/") ? url.slice(0, -1) : url;

  // Thêm /api nếu chưa có
  return cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;
};

const baseURL = ensureApiSuffix(API_BASE_URL);

console.log("API_BASE_URL configured as:", baseURL);

// Create axios instance with default config
const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  // Thêm timeout để tránh chờ quá lâu khi server không phản hồi
  timeout: process.env.REACT_APP_API_TIMEOUT
    ? parseInt(process.env.REACT_APP_API_TIMEOUT as string)
    : 10000,
  // Thêm withCredentials để gửi cookies
  withCredentials: true,
  // Thêm cấu hình paramsSerializer mặc định
  paramsSerializer: {
    serialize: (params) => {
      return Object.entries(params)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return value
              .map((v) => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`)
              .join("&");
          }
          return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        })
        .join("&");
    },
  },
});

// Simple retry mechanism
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config;

    // Only retry GET requests
    if (!config || !config.method || config.method.toLowerCase() !== "get") {
      return Promise.reject(error);
    }

    config._retryCount = config._retryCount || 0;

    // Maximum of 3 retries
    if (config._retryCount >= 3) {
      return Promise.reject(error);
    }

    // Retry on network errors or 5xx errors
    if (
      !error.response ||
      (error.response.status >= 500 && error.response.status <= 599)
    ) {
      config._retryCount += 1;

      // Exponential backoff
      const delay = Math.pow(2, config._retryCount) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));

      return api(config);
    }

    return Promise.reject(error);
  }
);

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const requestInfo = `${config.method?.toUpperCase()} ${config.baseURL}${
      config.url
    }`;
    console.log(`📡 Request: ${requestInfo}`, {
      params: config.params || {},
      data: config.data, // Log request data
      headers: config.headers, // Log headers
    });

    // Lấy token từ localStorage
    const authStorage = localStorage.getItem("auth-storage");
    const token = authStorage ? JSON.parse(authStorage)?.state?.token : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("🔑 Token added to request:", token);
    } else {
      console.log("⚠️ No token found in storage");
    }

    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response from ${response.config.url}:`, {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers,
    });
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    console.error("❌ API Error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data,
      },
    });

    // Enhance error object with user-friendly message
    const enhanceError = (err: AxiosError<ApiErrorResponse>) => {
      const baseError = {
        message: "An unexpected error occurred",
        code: "UNKNOWN_ERROR",
        status: err.response?.status,
        timestamp: new Date().toISOString(),
      };

      if (err.response) {
        // Handle specific error cases
        switch (err.response.status) {
          case 401:
            return {
              ...baseError,
              message: "Unauthorized: Please log in again",
              code: "UNAUTHORIZED",
            };
          case 403:
            return {
              ...baseError,
              message: "Forbidden: You don't have permission",
              code: "FORBIDDEN",
            };
          case 404:
            return {
              ...baseError,
              message: "Resource not found",
              code: "NOT_FOUND",
            };
          case 422:
            return {
              ...baseError,
              message: err.response.data?.message || "Validation error",
              code: "VALIDATION_ERROR",
            };
          default:
            return {
              ...baseError,
              message:
                err.response.data?.message ||
                `Server error: ${err.response.status}`,
              code: err.response.data?.code || `HTTP_${err.response.status}`,
            };
        }
      }

      if (err.request) {
        if (err.code === "ECONNABORTED") {
          return {
            ...baseError,
            message: "Request timeout - Server is taking too long to respond",
            code: "TIMEOUT",
          };
        }
        return {
          ...baseError,
          message: "Network error - Unable to connect to the server",
          code: "NETWORK_ERROR",
        };
      }

      return { ...baseError, message: err.message };
    };

    const enhancedError = enhanceError(error);
    (error as any).enhanced = enhancedError;
    (error as any).userMessage = enhancedError.message;

    // Handle authentication errors
    if (error.response?.status === 401) {
      console.log("🔐 Authentication error detected, clearing storage...");
      localStorage.removeItem("auth-storage");
      // Chỉ redirect nếu không phải đang ở trang login
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

// Add type for retry count in config
declare module "axios" {
  export interface AxiosRequestConfig {
    _retryCount?: number;
  }
}

export default api;
