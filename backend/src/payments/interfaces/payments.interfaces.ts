export interface PaymentGatewayResponse {
  success: boolean;
  redirectUrl?: string;
  error?: string;
  transactionId?: string;
}

export enum PaymentMethod {
  VNPAY = 'VNPAY',
  BANK_CARD = 'BANK_CARD',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum TransactionType {
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface BankCardDetails {
  cardNumber: string;
  cardholderName: string;
  expiryDate: string;
  cvv: string;
}

export interface VNPayDetails {
  returnUrl?: string;
}
