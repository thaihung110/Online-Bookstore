import api from "./axios";

export type PaymentMethod = "VNPAY" | "BANK_CARD";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

// Interface cho thông tin thẻ ngân hàng
export interface BankCardDetails {
  cardNumber: string;
  cardholderName: string;
  expiryDate: string; // Định dạng MM/YY
  cvv: string;
}

// Interface cho thông tin VNPay
export interface VNPayDetails {
  returnUrl?: string;
}

// Interface cho yêu cầu tạo thanh toán
export interface CreatePaymentRequest {
  orderId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  paymentDetails: BankCardDetails | VNPayDetails;
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
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
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
