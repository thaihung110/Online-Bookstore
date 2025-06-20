import { Injectable, Logger } from '@nestjs/common';

export enum PaymentLogType {
  PAYMENT_CREATED = 'PAYMENT_CREATED',
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
  VNPAY_REQUEST = 'VNPAY_REQUEST',
  VNPAY_RESPONSE = 'VNPAY_RESPONSE',
  VNPAY_CALLBACK = 'VNPAY_CALLBACK',
  VNPAY_IPN = 'VNPAY_IPN',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  REFUND_REQUEST = 'REFUND_REQUEST',
  REFUND_RESPONSE = 'REFUND_RESPONSE',
}

export interface PaymentLogData {
  paymentId?: string;
  orderId?: string;
  amount?: number;
  requestData?: any;
  responseData?: any;
  error?: any;
  metadata?: Record<string, any>;
}

@Injectable()
export class PaymentLoggingService {
  private readonly logger = new Logger('PaymentService');

  logPaymentFlow(type: PaymentLogType, data: PaymentLogData) {
    const logData = {
      type,
      timestamp: new Date(),
      correlationId: this.generateCorrelationId(),
      ...data,
    };

    switch (type) {
      case PaymentLogType.PAYMENT_ERROR:
        this.logger.error(
          `Payment Error - ID: ${data.paymentId}`,
          JSON.stringify(logData, null, 2),
        );
        break;
      default:
        this.logger.log(JSON.stringify(logData, null, 2));
    }
  }

  private generateCorrelationId(): string {
    return `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
