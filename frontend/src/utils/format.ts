/**
 * Format số thành chuỗi tiền tệ USD
 * @param amount Số tiền cần format
 * @returns Chuỗi đã format USD
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

/**
 * Format ngày và thời gian
 * @param dateString Chuỗi ngày cần format
 * @returns Chuỗi ngày đã format
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

/**
 * Format chỉ ngày
 * @param dateString Chuỗi ngày cần format
 * @returns Chuỗi ngày đã format
 */
export const formatDateOnly = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};
