import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  createPayment,
  processPayment,
  getPayment,
  getTransactions,
  CreatePaymentRequest,
  Payment,
  PaymentMethod,
  BankCardDetails,
  VNPayDetails,
} from "../api/payments";
import { useCartStore } from "./cartStore";
import { Address } from "../utils/checkout";

// Interface cho đơn hàng
export interface Order {
  id: string;
  items: any[]; // CartItem[]
  totalAmount: number;
  shippingAddress: Address;
  billingAddress?: Address;
  status: string;
  createdAt: string;
}

// Interface cho state của checkout store
interface CheckoutState {
  // Dữ liệu
  shippingAddress: Address | null;
  billingAddress: Address | null;
  useShippingAsBilling: boolean;
  paymentMethod: PaymentMethod | null;
  paymentDetails: BankCardDetails | VNPayDetails | null;
  order: Order | null;
  payment: Payment | null;

  // Trạng thái
  isLoading: boolean;
  error: string | null;
  activeStep: number;

  // Actions
  setShippingAddress: (address: Address) => void;
  setBillingAddress: (address: Address) => void;
  setUseShippingAsBilling: (value: boolean) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setPaymentDetails: (details: BankCardDetails | VNPayDetails) => void;
  setActiveStep: (step: number) => void;

  // Thao tác với API
  placeOrder: () => Promise<Order>;
  createPayment: () => Promise<Payment>;
  processPayment: () => Promise<{ redirectUrl?: string; success: boolean }>;
  getPayment: (id: string) => Promise<Payment>;

  // Utilities
  reset: () => void;
  clearError: () => void;
}

// Mock API tạo đơn hàng (sẽ được thay thế bằng API thực)
const createOrder = async (data: any): Promise<Order> => {
  // Giả lập gọi API
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    id: `ORD-${Date.now()}`,
    items: data.items,
    totalAmount: data.totalAmount,
    shippingAddress: data.shippingAddress,
    billingAddress: data.billingAddress,
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };
};

export const useCheckoutStore = create<CheckoutState>()(
  devtools(
    (set, get) => ({
      // Dữ liệu
      shippingAddress: null,
      billingAddress: null,
      useShippingAsBilling: true,
      paymentMethod: null,
      paymentDetails: null,
      order: null,
      payment: null,

      // Trạng thái
      isLoading: false,
      error: null,
      activeStep: 0,

      // Actions
      setShippingAddress: (address) => set({ shippingAddress: address }),

      setBillingAddress: (address) => set({ billingAddress: address }),

      setUseShippingAsBilling: (value) => set({ useShippingAsBilling: value }),

      setPaymentMethod: (method) => set({ paymentMethod: method }),

      setPaymentDetails: (details) => set({ paymentDetails: details }),

      setActiveStep: (step) => set({ activeStep: step }),

      // Thao tác với API
      placeOrder: async () => {
        try {
          set({ isLoading: true, error: null });

          const { shippingAddress, billingAddress, useShippingAsBilling } =
            get();
          const cartStore = useCartStore.getState();
          const cartItems = cartStore.getCartItems();
          const totalAmount = cartStore.getTotalPrice();

          if (!shippingAddress) {
            throw new Error("Shipping address is required");
          }

          // Dùng địa chỉ giao hàng làm địa chỉ thanh toán nếu đã chọn
          const finalBillingAddress = useShippingAsBilling
            ? shippingAddress
            : billingAddress;

          // Gọi API tạo đơn hàng
          const order = await createOrder({
            items: cartItems,
            totalAmount,
            shippingAddress,
            billingAddress: finalBillingAddress,
          });

          set({ order, isLoading: false });
          return order;
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Failed to place order",
            isLoading: false,
          });
          throw error;
        }
      },

      createPayment: async () => {
        try {
          set({ isLoading: true, error: null });

          const { order, paymentMethod, paymentDetails } = get();

          if (!order) {
            throw new Error("Order not found");
          }

          if (!paymentMethod) {
            throw new Error("Payment method is required");
          }

          if (!paymentDetails) {
            throw new Error("Payment details are required");
          }

          // Gọi API tạo thanh toán
          const paymentRequest: CreatePaymentRequest = {
            orderId: order.id,
            paymentMethod,
            amount: order.totalAmount,
            paymentDetails,
          };

          const payment = await createPayment(paymentRequest);

          set({ payment, isLoading: false });
          return payment;
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to create payment",
            isLoading: false,
          });
          throw error;
        }
      },

      processPayment: async () => {
        try {
          set({ isLoading: true, error: null });

          const { payment } = get();

          if (!payment) {
            throw new Error("Payment not found");
          }

          // Gọi API xử lý thanh toán
          const result = await processPayment(payment.id);

          set({ isLoading: false });
          return result;
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to process payment",
            isLoading: false,
          });
          throw error;
        }
      },

      getPayment: async (id) => {
        try {
          set({ isLoading: true, error: null });

          // Gọi API lấy thông tin thanh toán
          const payment = await getPayment(id);

          set({ payment, isLoading: false });
          return payment;
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Failed to get payment",
            isLoading: false,
          });
          throw error;
        }
      },

      // Utilities
      reset: () =>
        set({
          shippingAddress: null,
          billingAddress: null,
          useShippingAsBilling: true,
          paymentMethod: null,
          paymentDetails: null,
          order: null,
          payment: null,
          error: null,
          activeStep: 0,
        }),

      clearError: () => set({ error: null }),
    }),
    { name: "checkout-store" }
  )
);
