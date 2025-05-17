import axios from "axios";

// Base API URL - would be set from environment in production
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:4000/api";

console.log("API_BASE_URL configured as:", API_BASE_URL);

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
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

    const { response } = error;

    if (response) {
      console.error(`Response error status: ${response.status}`, response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }

    // Handle authentication errors
    if (response?.status === 401) {
      // Clear localStorage and redirect to login
      localStorage.removeItem("auth-storage");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
