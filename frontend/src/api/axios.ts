import axios from "axios";

// Base API URL - would be set from environment in production
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3000/api";

// Đảm bảo URL có định dạng chính xác với /api ở cuối
const ensureApiSuffix = (url: string) => {
  if (!url) return "http://localhost:3000/api";

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
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    console.log(
      `Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${
        config.url
      }`,
      config.params || {}
    );

    const token = localStorage.getItem("auth-storage")
      ? JSON.parse(localStorage.getItem("auth-storage") || "{}")?.state?.token
      : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error("API Error:", error);

    // Xử lý chi tiết hơn về lỗi
    if (error.response) {
      // Có response từ server nhưng status code không thành công
      console.error(
        `Response error status: ${error.response.status}`,
        error.response.data
      );
      error.userMessage =
        error.response.data?.message ||
        `Server error: ${error.response.status}`;
    } else if (error.request) {
      // Request được gửi nhưng không nhận được response
      console.error("No response received:", error.request);
      if (error.code === "ECONNABORTED") {
        error.userMessage =
          "Request timeout. The server is taking too long to respond.";
      } else {
        error.userMessage =
          "No response from server. Please check your connection.";
      }
    } else {
      // Lỗi khi thiết lập request
      console.error("Error setting up request:", error.message);
      error.userMessage = `Error setting up request: ${error.message}`;
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      // Clear localStorage and redirect to login
      localStorage.removeItem("auth-storage");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
