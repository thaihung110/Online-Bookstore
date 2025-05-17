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

export const login = async (
  credentials: LoginRequest
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/login", credentials);
  return response.data;
};

export const register = async (
  userData: RegisterRequest
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/register", userData);
  return response.data;
};

export const getCurrentUser = async (): Promise<AuthResponse["user"]> => {
  const response = await api.get<AuthResponse["user"]>("/auth/me");
  return response.data;
};
