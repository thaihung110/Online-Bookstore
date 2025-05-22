import api from "./axios";

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

/**
 * Login with email and password
 * @param credentials - Login credentials (email, password)
 * @returns Auth response with token and user info
 */
export const login = async (
  credentials: LoginRequest
): Promise<AuthResponse> => {
  // /api tiền tố đã được cấu hình trong baseURL của axios instance
  const response = await api.post<AuthResponse>("/auth/login", credentials);
  return response.data;
};

/**
 * Register a new user
 * @param userData - User registration data
 * @returns Auth response with token and user info
 */
export const register = async (
  userData: RegisterRequest
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/register", userData);
  return response.data;
};

/**
 * Get current user profile using JWT token
 * @returns User profile information
 */
export const getCurrentUser = async (): Promise<AuthResponse["user"]> => {
  // Sửa từ /auth/me thành /auth/profile để khớp với backend API
  const response = await api.get<AuthResponse["user"]>("/auth/profile");
  return response.data;
};
