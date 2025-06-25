import api from "./axios";

export type PaymentMethod = "VNPAY" | "COD";
export type PaymentStatus =
  | "PENDING"
  | "RECEIVED"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED";

// Interface cho thông tin VNPay
export interface VNPayDetails {
  returnUrl?: string;
}

// Interface cho thông tin item thanh toán
// Xoá interface PaymentCartItem

// Interface cho yêu cầu tạo thanh toán (theo backend CreatePaymentDto)
export interface CreatePaymentRequest {
  orderId: string;
  paymentMethod: PaymentMethod;
  amount?: number; // Optional vì backend tự tính từ order
  description?: string;
  metadata?: Record<string, any>; // Chứa thông tin customer, shipping, vnpay
  vnpayDetails?: VNPayDetails;
}

// Interface cho thông tin thanh toán
export interface Payment {
  id: string;
  orderId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  transactionId?: string;
  paymentDetails?: any;
  bankCode?: string;
  responseCode?: string;
  vnpTransactionNo?: string;
  secureHash?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// Interface cho callback từ VNPay
export interface VNPayCallbackRequest {
  vnp_Amount: string;
  vnp_BankCode?: string;
  vnp_CardType?: string;
  vnp_OrderInfo: string;
  vnp_PayDate: string;
  vnp_ResponseCode: string;
  vnp_TmnCode: string;
  vnp_TransactionNo: string;
  vnp_TxnRef: string;
  vnp_SecureHashType: string;
  vnp_SecureHash: string;
}

// Interface cho response từ VNPay
export interface VNPayResponse {
  success: boolean;
  message: string;
  orderId?: string;
  paymentId?: string;
  transactionId?: string;
  amount?: number;
  paymentStatus?: PaymentStatus;
  orderStatus?: string;
}

// Interface cho refund request
export interface RefundRequest {
  paymentId: string;
  amount: number;
  reason: string;
  transactionDate: string;
}

// Interface cho refund response
export interface RefundResponse {
  success: boolean;
  message: string;
  refundTransactionId?: string;
  refundAmount?: number;
  refundStatus?: string;
  vnpayResponse?: any;
}

// Interface cho thông tin giao dịch
export interface Transaction {
  id: string;
  paymentId: string;
  transactionId: string;
  amount: number;
  type: "PAYMENT" | "REFUND";
  status: "PENDING" | "COMPLETED" | "FAILED";
  gatewayResponse: any;
  createdAt: string;
  updatedAt: string;
}

/**
 * Tạo thanh toán mới
 * @param data Thông tin thanh toán
 */
export const createPayment = async (
  data: CreatePaymentRequest
): Promise<Payment> => {
  try {
    const response = await api.post("/payments", data);
    // Nếu response.data có trường payment, trả về payment
    if (response.data && response.data.payment) {
      return response.data.payment;
    }
    // Nếu không, trả về response.data (giữ tương thích)
    return response.data;
  } catch (error) {
    console.error("Error creating payment:", error);
    throw error;
  }
};

/**
 * Xử lý thanh toán
 * @param id ID của thanh toán
 */
export const processPayment = async (
  id: string
): Promise<{ redirectUrl?: string; success: boolean }> => {
  try {
    const response = await api.post(`/payments/${id}/process`);
    return response.data;
  } catch (error) {
    console.error(`Error processing payment ${id}:`, error);
    throw error;
  }
};

/**
 * Lấy thông tin thanh toán
 * @param id ID của thanh toán
 */
export const getPayment = async (id: string): Promise<Payment> => {
  try {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error getting payment ${id}:`, error);
    throw error;
  }
};

/**
 * Lấy danh sách giao dịch của một thanh toán
 * @param paymentId ID của thanh toán
 */
export const getTransactions = async (
  paymentId: string
): Promise<Transaction[]> => {
  try {
    const response = await api.get(`/payments/${paymentId}/transactions`);
    return response.data;
  } catch (error) {
    console.error(
      `Error getting transactions for payment ${paymentId}:`,
      error
    );
    throw error;
  }
};

// --- New API Functions from Backend ---

/**
 * Xử lý callback từ VNPay sau khi thanh toán
 * @param callbackData Dữ liệu callback từ VNPay
 */
export const vnpayCallback = async (
  callbackData: VNPayCallbackRequest
): Promise<VNPayResponse> => {
  try {
    console.log("[Payment API] Processing VNPay callback:", callbackData);
    const response = await api.post("/payments/vnpay/callback", callbackData);
    console.log(
      "[Payment API] VNPay callback processed successfully:",
      response.data
    );
    return response.data;
  } catch (error: any) {
    console.error("Error processing VNPay callback:", error);

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          throw new Error(data.message || "Invalid callback data from VNPay.");
        case 404:
          throw new Error("Payment or order not found.");
        case 409:
          throw new Error("Payment has already been processed.");
        case 500:
          throw new Error("Server error processing payment callback.");
        default:
          throw new Error(
            data.message || `VNPay callback failed with status ${status}`
          );
      }
    } else if (error.request) {
      throw new Error(
        "Network error. Please check your connection and try again."
      );
    } else {
      throw new Error(
        "An unexpected error occurred while processing VNPay callback."
      );
    }
  }
};

/**
 * Yêu cầu hoàn tiền qua VNPay
 * @param refundData Thông tin yêu cầu hoàn tiền
 */
export const requestRefund = async (
  refundData: RefundRequest
): Promise<RefundResponse> => {
  try {
    console.log("[Payment API] Requesting refund:", refundData);
    const response = await api.post("/payments/refund", refundData);
    console.log("[Payment API] Refund requested successfully:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error requesting refund:", error);

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          throw new Error(data.message || "Invalid refund request data.");
        case 401:
          throw new Error("Authentication required. Please log in.");
        case 403:
          throw new Error("You don't have permission to request refunds.");
        case 404:
          throw new Error("Payment not found or cannot be refunded.");
        case 409:
          throw new Error(
            "Payment has already been refunded or cannot be refunded."
          );
        case 500:
          throw new Error("Server error processing refund request.");
        default:
          throw new Error(
            data.message || `Refund request failed with status ${status}`
          );
      }
    } else if (error.request) {
      throw new Error(
        "Network error. Please check your connection and try again."
      );
    } else {
      throw new Error("An unexpected error occurred while requesting refund.");
    }
  }
};

/**
 * Lấy trạng thái thanh toán theo order ID
 * @param orderId ID của đơn hàng
 */
export const getPaymentByOrderId = async (
  orderId: string
): Promise<Payment | null> => {
  try {
    console.log("[Payment API] Getting payment by order ID:", orderId);
    const response = await api.get(`/payments/order/${orderId}`);
    console.log("[Payment API] Payment fetched successfully:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error getting payment by order ID:", error);

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 404:
          // Return null if payment not found instead of throwing error
          console.log("No payment found for order:", orderId);
          return null;
        case 401:
          throw new Error("Authentication required. Please log in.");
        case 403:
          throw new Error("You don't have permission to view this payment.");
        case 500:
          throw new Error("Server error. Please try again later.");
        default:
          throw new Error(
            data.message || `Failed to get payment with status ${status}`
          );
      }
    } else if (error.request) {
      throw new Error(
        "Network error. Please check your connection and try again."
      );
    } else {
      throw new Error("An unexpected error occurred while getting payment.");
    }
  }
};

/**
 * Lấy danh sách tất cả payments (admin only)
 * @param params Query parameters for filtering and pagination
 */
export const getAllPayments = async (params?: {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
}): Promise<{
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
}> => {
  try {
    console.log("[Payment API] Getting all payments:", params);

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.paymentMethod)
      queryParams.append("paymentMethod", params.paymentMethod);

    const queryString = queryParams.toString();
    const url = queryString ? `/payments?${queryString}` : "/payments";

    const response = await api.get(url);
    console.log(
      "[Payment API] All payments fetched successfully:",
      response.data
    );
    return response.data;
  } catch (error: any) {
    console.error("Error getting all payments:", error);

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          throw new Error("Authentication required. Please log in.");
        case 403:
          throw new Error("You don't have permission to view all payments.");
        case 500:
          throw new Error("Server error. Please try again later.");
        default:
          throw new Error(
            data.message || `Failed to get payments with status ${status}`
          );
      }
    } else if (error.request) {
      throw new Error(
        "Network error. Please check your connection and try again."
      );
    } else {
      throw new Error("An unexpected error occurred while getting payments.");
    }
  }
};
