import { Book } from "../api/books";

/**
 * Represents a shipping/billing address
 */
export interface Address {
  fullName: string;
  phoneNumber: string;
  email: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  zipCode?: string;
}

/**
 * Checks if the checkout process can proceed based on the current state
 * @returns Object with status and error message if applicable
 */
export const canProceedToCheckout = (
  shippingAddress: Address | null,
  paymentMethod: string | null,
  paymentDetails: any | null
): { canProceed: boolean; error?: string } => {
  if (!shippingAddress) {
    return {
      canProceed: false,
      error: "Vui lòng điền đầy đủ thông tin địa chỉ giao hàng",
    };
  }

  if (!paymentMethod) {
    return { canProceed: false, error: "Vui lòng chọn phương thức thanh toán" };
  }

  if (paymentMethod === "BANK_CARD" && !paymentDetails) {
    return {
      canProceed: false,
      error: "Vui lòng điền đầy đủ thông tin thẻ ngân hàng",
    };
  }

  return { canProceed: true };
};

/**
 * Handles the payment process
 * @returns Object with status and result
 */
export const processCheckoutPayment = async (
  placeOrder: () => Promise<any>,
  createPayment: () => Promise<any>,
  processPayment: () => Promise<{ redirectUrl?: string; success: boolean }>,
  paymentMethod: string | null
): Promise<{ success: boolean; redirectUrl?: string; error?: string }> => {
  try {
    // Tạo đơn hàng
    const order = await placeOrder();
    console.log("Order created:", order);

    // Tạo thanh toán
    const payment = await createPayment();
    console.log("Payment created:", payment);

    // Xử lý thanh toán
    const result = await processPayment();
    console.log("Payment processed:", result);

    // Nếu là VNPay, trả về URL để chuyển hướng
    if (paymentMethod === "VNPAY" && result.redirectUrl) {
      return {
        success: true,
        redirectUrl: result.redirectUrl,
      };
    }

    // Nếu là thẻ ngân hàng hoặc thanh toán thành công
    if (result.success) {
      return { success: true };
    }

    return { success: false, error: "Có lỗi xảy ra khi xử lý thanh toán" };
  } catch (err) {
    console.error("Error during checkout:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Có lỗi xảy ra khi xử lý thanh toán",
    };
  }
};

/**
 * Handles the Buy Now functionality for a book
 * @param book Book to purchase immediately
 * @returns Object indicating success status and any error
 */
export const buyNow = async (
  book: Book,
  addToCart: (book: Book, quantity?: number) => Promise<void>,
  isInCart: (bookId: string) => boolean
): Promise<boolean> => {
  try {
    // If book is not already in cart, add it
    if (!isInCart(book.id)) {
      await addToCart(book);
    }
    return true;
  } catch (error) {
    console.error("Error during buy now process:", error);
    return false;
  }
};
