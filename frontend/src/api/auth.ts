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
  try {
    // Log the API URL being used
    console.log("🌐 API URL:", api.defaults.baseURL);

    console.log("🔑 Attempting login with credentials:", {
      email: credentials.email,
      hasPassword: !!credentials.password,
      passwordLength: credentials.password?.length || 0,
    });

    const response = await api.post<AuthResponse>("/auth/login", credentials);

    console.log("✅ Login API Response:", {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      hasToken: !!response.data.token,
      userData: {
        id: response.data.user.id,
        email: response.data.user.email,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("❌ Login failed - Detailed error:", {
      message: error.message,
      response: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
      },
      request: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        headers: error.config?.headers,
      },
    });

    // Thêm thông tin lỗi chi tiết
    if (error.response?.status === 401) {
      throw new Error("Email hoặc mật khẩu không đúng");
    }

    if (error.response?.status === 422) {
      throw new Error(
        error.response.data.message || "Dữ liệu đăng nhập không hợp lệ"
      );
    }

    if (!error.response) {
      throw new Error(
        "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và đảm bảo server đang chạy."
      );
    }

    throw error;
  }
};

/**
 * Register a new user
 * @param userData - User registration data
 * @returns Auth response with token and user info
 */
export const register = async (
  userData: RegisterRequest
): Promise<AuthResponse> => {
  try {
    console.log("📝 Attempting registration with data:", {
      email: userData.email,
      username: userData.username,
      hasPassword: !!userData.password,
    });

    const response = await api.post<AuthResponse>("/auth/register", userData);

    console.log("✅ Registration successful:", {
      userId: response.data.user.id,
      email: response.data.user.email,
      hasToken: !!response.data.token,
    });

    return response.data;
  } catch (error: any) {
    console.error("❌ Registration failed:", {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // Thêm thông tin lỗi chi tiết
    if (error.response?.status === 409) {
      throw new Error("Email hoặc tên người dùng đã tồn tại");
    }

    if (error.response?.status === 422) {
      throw new Error(
        error.response.data.message || "Dữ liệu đăng ký không hợp lệ"
      );
    }

    if (!error.response) {
      throw new Error(
        "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn."
      );
    }

    throw error;
  }
};

/**
 * Get current user profile using JWT token
 * @returns User profile information
 */
export const getCurrentUser = async (): Promise<AuthResponse["user"]> => {
  try {
    console.log("👤 Fetching current user profile");
    const response = await api.get<AuthResponse["user"]>("/auth/profile");

    console.log("✅ User profile fetched:", {
      userId: response.data.id,
      email: response.data.email,
    });

    return response.data;
  } catch (error: any) {
    console.error("❌ Failed to fetch user profile:", {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    if (error.response?.status === 401) {
      throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }

    if (!error.response) {
      throw new Error(
        "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn."
      );
    }

    throw error;
  }
};
