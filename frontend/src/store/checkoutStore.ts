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
import { vndToUsd } from "../utils/currency";

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
  setShippingAddress: (address: any) => void;
  setBillingAddress: (address: any) => void;
  setUseShippingAsBilling: (value: boolean) => void;
  setPaymentMethod: (method: any) => void;
  setPaymentDetails: (details: any) => void;
  setActiveStep: (step: number) => void;

  // Thao tác với API
  placeOrder: () => Promise<Order>;
  createPayment: () => Promise<Payment>;
  processPayment: (
    id: string
  ) => Promise<{ redirectUrl?: string; success: boolean }>;
  getPayment: (id: string) => Promise<Payment>;

  // Utilities
  reset: () => void;
  clearError: () => void;

  // New actions
  removeCartItem: (id: string) => void;
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
    (set: any, get: any) => ({
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
      setShippingAddress: (address: any) => set({ shippingAddress: address }),

      setBillingAddress: (address: any) => set({ billingAddress: address }),

      setUseShippingAsBilling: (value: boolean) =>
        set({ useShippingAsBilling: value }),

      setPaymentMethod: (method: any) => {
        set({ paymentMethod: method });
        // Nếu chọn VNPAY, paymentDetails là object rỗng
        if (method === "VNPAY") {
          set({ paymentDetails: {} });
        }
      },

      setPaymentDetails: (details: any) => set({ paymentDetails: details }),

      setActiveStep: (step: number) => set({ activeStep: step }),

      // Thao tác với API
      placeOrder: async () => {
        try {
          set({ isLoading: true, error: null });

          const { shippingAddress, billingAddress, useShippingAsBilling } =
            get();
          const cartStore = useCartStore.getState();
          const cartItems = cartStore.getCartItems();
          const tickedItems = cartItems.filter(
            (item) => (item as any).isTicked !== false
          );
          const paymentItems = tickedItems.map((item) => ({
            bookId: item.book.id,
            quantity: item.quantity,
            priceAtAdd: item.priceAtAdd,
          }));

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
            items: paymentItems,
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

          let { order, paymentMethod, shippingAddress } = get();

          if (!order) {
            throw new Error("Order not found");
          }

          if (!paymentMethod) {
            throw new Error("Payment method is required");
          }

          if (!shippingAddress) {
            throw new Error("Shipping address is required");
          }

          // Nếu là VNPAY, amount phải là VND
          let amount = order.totalAmount;
          if (paymentMethod === "VNPAY") {
            if (amount < 1000) {
              amount = Math.round(amount * 25000);
            }
          }

          // Lấy danh sách item được tick từ cart
          const cartStore = useCartStore.getState();
          const cartItems = cartStore.getCartItems();
          const tickedItems = cartItems.filter(
            (item) => (item as any).isTicked !== false
          );
          const paymentItems = tickedItems.map((item) => ({
            bookId: item.book.id,
            quantity: item.quantity,
            priceAtAdd: item.priceAtAdd,
          }));

          // Chuẩn bị dữ liệu gửi lên
          const paymentRequest: CreatePaymentRequest = {
            orderId: order.id,
            paymentMethod,
            amount,
            fullName: shippingAddress.fullName,
            city: shippingAddress.city,
            address: shippingAddress.address,
            phone: shippingAddress.phoneNumber,
            ...(paymentMethod === "VNPAY" ? { vnpayDetails: {} } : {}),
            items: paymentItems,
          };

          console.log("[DEBUG] Sending paymentRequest:", paymentRequest);

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

      processPayment: async (id: string) => {
        try {
          set({ isLoading: true, error: null });
          if (!id) {
            throw new Error("Payment id is required");
          }
          // Gọi API xử lý thanh toán
          const result = await processPayment(id);
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

      getPayment: async (id: string) => {
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

      // New actions
      removeCartItem: (id: string) =>
        set((state: any) => ({
          cartItems: state.cartItems.filter((item: any) => item.book.id !== id),
        })),
    }),
    { name: "checkout-store" }
  )
);
