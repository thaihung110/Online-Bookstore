import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  createPayment,
  processPayment,
  getPayment,
  getTransactions,
  CreatePaymentRequest,
  CreatePaymentResponse,
  Payment,
  VNPayDetails,
} from "../api/payments";
import {
  createOrder as apiCreateOrder,
  CreateOrderRequest,
  Order as ApiOrder,
  PaymentMethod,
  getOrderById,
  createOrderFromCart,
  CreateOrderFromCartRequest,
} from "../api/orders";
import { useCartStore } from "./cartStore";
import { Address } from "../utils/checkout";
import { vndToUsd } from "../utils/currency";
import { calculateOrderTotal } from "../utils/price-calculator";

// Use the Order interface from API instead of local definition
export type Order = ApiOrder;

// Interface cho state của checkout store
interface CheckoutState {
  // Dữ liệu
  shippingAddress: Address | null;
  billingAddress: Address | null;
  useShippingAsBilling: boolean;
  paymentMethod: PaymentMethod | null;
  paymentDetails: VNPayDetails | null;
  order: Order | null;
  payment: Payment | null;
  isRushOrder: boolean;

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
  setIsRushOrder: (value: boolean) => void;
  getShippingCost: () => number;

  // Thao tác với API
  placeOrder: () => Promise<Order>;
  createPayment: () => Promise<CreatePaymentResponse>;
  processPayment: (
    id: string
  ) => Promise<{ redirectUrl?: string; success: boolean }>;
  getPayment: (id: string) => Promise<Payment>;
  getOrder: (id: string) => Promise<Order>;

  // Utilities
  reset: () => void;
  clearError: () => void;

  // New actions
  removeCartItem: (id: string) => void;
}

// Real API order creation using createOrderFromCart - simplified approach
const createOrderFromCartApi = async (data: {
  shippingAddress: Address;
  paymentMethod: string;
  isRushOrder?: boolean;
}): Promise<Order> => {
  try {
    console.log(
      "[Checkout Store] Creating order from cart with real API:",
      data
    );

    // Map checkout data to API format for CreateOrderFromCartRequest
    const orderRequest: CreateOrderFromCartRequest = {
      shippingAddress: {
        fullName: data.shippingAddress.fullName,
        addressLine1: data.shippingAddress.address,
        addressLine2: data.shippingAddress.ward || "",
        city: data.shippingAddress.city,
        state: data.shippingAddress.district || "",
        postalCode: data.shippingAddress.zipCode || "",
        country: "Vietnam",
        phoneNumber: data.shippingAddress.phoneNumber,
        email: data.shippingAddress.email,
      },
      paymentInfo: {
        method: data.paymentMethod as PaymentMethod,
      },
      isGift: false,
      isRushOrder: data.isRushOrder || false,
    };

    console.log("[Checkout Store] API Request payload:", orderRequest);

    // Call real API - createOrderFromCart automatically uses cart items
    const apiOrder = await createOrderFromCart(orderRequest);

    console.log("[Checkout Store] Order created successfully:", apiOrder);

    // Return the API response directly
    return apiOrder;
  } catch (error) {
    console.error("[Checkout Store] Order creation failed:", error);
    throw error;
  }
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
      isRushOrder: false,

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

      setIsRushOrder: (value: boolean) => set({ isRushOrder: value }),

      // Get shipping cost from cart data (backend calculated)
      getShippingCost: () => {
        const cartStore = useCartStore.getState();
        return cartStore.cart?.shippingCost || 0;
      },

      // Thao tác với API
      placeOrder: async (retryCount = 0) => {
        const maxRetries = 3;
        try {
          set({ isLoading: true, error: null });

          const { shippingAddress, paymentMethod, isRushOrder } = get();

          console.log(
            "[Checkout Store] Placing order with shipping address:",
            shippingAddress
          );
          console.log("[Checkout Store] Payment method:", paymentMethod);
          console.log("[Checkout Store] Rush order:", isRushOrder);

          if (!shippingAddress) {
            throw new Error("Shipping address is required");
          }

          if (!paymentMethod) {
            throw new Error("Payment method is required");
          }

          // Gọi API tạo đơn hàng từ cart - backend tự động lấy ticked items từ cart
          const order = await createOrderFromCartApi({
            shippingAddress,
            paymentMethod,
            isRushOrder,
          });

          console.log(
            "[Checkout Store] Order placed successfully, cart should be cleared by backend"
          );
          set({ order, isLoading: false });
          return order;
        } catch (error) {
          console.error(
            "[Checkout Store] Failed to place order (attempt " +
              (retryCount + 1) +
              "):",
            error
          );

          // Check if this is a retryable error and we haven't exceeded max retries
          const isRetryableError =
            error instanceof Error &&
            (error.message.includes("Network error") ||
              error.message.includes("Server error") ||
              error.message.includes("timeout"));

          if (isRetryableError && retryCount < maxRetries) {
            console.log("[Checkout Store] Retrying order creation...");
            // Wait a bit before retrying (exponential backoff)
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, retryCount) * 1000)
            );
            return get().placeOrder(retryCount + 1);
          }

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
          let amount = order.total; // Use 'total' field from API response
          if (paymentMethod === "VNPAY") {
            if (amount < 1000) {
              amount = Math.round(amount * 25000);
            }
          }

          // Chuẩn bị dữ liệu gửi lên theo format backend CreatePaymentDto
          const paymentRequest: CreatePaymentRequest = {
            orderId: order._id, // Use '_id' field from API response
            paymentMethod,
            description: `Thanh toán đơn hàng #${order._id}`,
            metadata: {
              customerInfo: {
                fullName: shippingAddress.fullName,
                phone: shippingAddress.phoneNumber,
                email: shippingAddress.email,
              },
              shippingInfo: {
                address: shippingAddress.address,
                city: shippingAddress.city,
                district: shippingAddress.district,
                ward: shippingAddress.ward,
              },
              ...(paymentMethod === "VNPAY"
                ? {
                    vnpayInfo: {
                      orderType: "billpayment",
                      // Xoá bankCode để user có thể chọn phương thức thanh toán trên VNPAY
                    },
                  }
                : {}),
            },
            ...(paymentMethod === "VNPAY" ? { vnpayDetails: {} } : {}),
          };

          // Log thông tin để debug
          console.log("[Payment] Creating payment request:", paymentRequest);

          const paymentResponse = await createPayment(paymentRequest);

          // Save payment to store
          set({ payment: paymentResponse.payment, isLoading: false });

          return paymentResponse;
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

          // Nếu có payment và orderId, lấy luôn thông tin order
          if (payment && payment.orderId) {
            try {
              // Use the existing API function
              const order = await getOrderById(payment.orderId);
              console.log("[Checkout Store] Fetched order data:", order);
              set({ payment, order, isLoading: false });
              return payment;
            } catch (orderError) {
              console.warn(
                "[Checkout Store] Failed to fetch order data:",
                orderError
              );
              // Continue with just payment data
            }
          }

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

      // Add new getOrder function
      getOrder: async (id: string) => {
        try {
          set({ isLoading: true, error: null });

          const order = await getOrderById(id);
          set({ order, isLoading: false });
          return order;
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Failed to get order",
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
          isRushOrder: false,
          error: null,
          activeStep: 0,
        }),

      clearError: () => set({ error: null }),

      // New actions
      removeCartItem: (id: string) =>
        set((state: any) => ({
          cartItems: state.cartItems.filter(
            (item: any) => item.product.id !== id
          ),
        })),
    }),
    { name: "checkout-store" }
  )
);
