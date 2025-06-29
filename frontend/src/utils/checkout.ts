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
      error: "Please fill in complete shipping address information",
    };
  }

  if (!paymentMethod) {
    return { canProceed: false, error: "Please select a payment method" };
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
  processPayment: (
    id: string
  ) => Promise<{ redirectUrl?: string; success: boolean }>,
  paymentMethod: string | null
): Promise<{ success: boolean; redirectUrl?: string; error?: string }> => {
  try {
    // Create order
    const order = await placeOrder();
    console.log("Order created:", order);

    // Create payment
    const paymentResponse = await createPayment();
    console.log("Payment created:", paymentResponse);

    // COD payments are automatically completed when created, no need to process
    if (paymentMethod === "COD") {
      console.log(
        "[DEBUG] COD payment - already completed, skipping processPayment"
      );
      return { success: true };
    }

    // VNPAY: if redirectUrl is provided from createPayment, use it directly
    if (paymentMethod === "VNPAY" && paymentResponse.redirectUrl) {
      console.log(
        "[DEBUG] VNPAY redirectUrl received from createPayment:",
        paymentResponse.redirectUrl
      );
      return {
        success: true,
        redirectUrl: paymentResponse.redirectUrl,
      };
    }

    // Fallback: Process payment if no redirectUrl from createPayment
    const payment = paymentResponse.payment || paymentResponse;
    if (!payment || !payment.id) {
      throw new Error("Unable to get payment id for payment processing");
    }
    console.log("[DEBUG] Call processPayment with id:", payment.id);
    const result = await processPayment(payment.id);
    console.log("Payment processed:", result);

    // If payment successful
    if (result.success) {
      return { success: true };
    }

    return {
      success: false,
      error: "An error occurred while processing payment",
    };
  } catch (err) {
    console.error("Error during checkout:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "An error occurred while processing payment",
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
