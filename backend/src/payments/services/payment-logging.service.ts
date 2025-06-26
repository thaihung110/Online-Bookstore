import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PaymentLog,
  PaymentLogDocument,
  PaymentLogType,
  LogLevel,
} from '../schemas/payment-log.schema';

// Legacy enum for backward compatibility
export { PaymentLogType };

export interface PaymentLogData {
  paymentId?: string;
  orderId?: string;
  amount?: number;
  requestData?: any;
  responseData?: any;
  error?: {
    message: string;
    stack?: string;
    // Additional error details for better debugging
    verifyResult?: any;
    paymentId?: string;
    expected?: number;
    received?: number;
    [key: string]: any; // Allow additional error properties
  };
  [key: string]: any;
}

@Injectable()
export class PaymentLoggingService {
  private readonly logger = new Logger(PaymentLoggingService.name);

  constructor(
    @InjectModel(PaymentLog.name)
    private paymentLogModel: Model<PaymentLogDocument>,
  ) {}

  async logPaymentFlow(
    type: PaymentLogType,
    data: PaymentLogData,
    level: LogLevel = LogLevel.INFO,
  ): Promise<PaymentLogDocument> {
    try {
      const logEntry = new this.paymentLogModel({
        paymentId: data.paymentId,
        orderId: data.orderId,
        type,
        level,
        message: this.generateMessage(type, data),
        data: this.sanitizeData(data),
        source: 'PaymentService',
        timestamp: new Date(),
      });

      const savedLog = await logEntry.save();

      // Also log to console for development
      this.logToConsole(type, data, level);

      return savedLog;
    } catch (error) {
      this.logger.error(
        `Failed to save payment log: ${error.message}`,
        error.stack,
      );
      // Don't throw error to avoid breaking main flow
      return null;
    }
  }

  private generateMessage(type: PaymentLogType, data: PaymentLogData): string {
    const baseInfo = `Payment: ${data.paymentId || 'N/A'}, Order: ${data.orderId || 'N/A'}`;

    switch (type) {
      case PaymentLogType.PAYMENT_CREATED:
        return `${baseInfo} - Payment created with amount: ${data.amount}`;
      case PaymentLogType.VNPAY_REQUEST:
        return `${baseInfo} - VNPay payment request sent`;
      case PaymentLogType.VNPAY_RESPONSE:
        return `${baseInfo} - VNPay response received`;
      case PaymentLogType.VNPAY_CALLBACK:
        return `${baseInfo} - VNPay callback received`;
      case PaymentLogType.VNPAY_IPN:
        return `${baseInfo} - VNPay IPN received`;
      case PaymentLogType.REFUND_REQUEST:
        return `${baseInfo} - Refund request initiated`;
      case PaymentLogType.REFUND_RESPONSE:
        return `${baseInfo} - Refund response received`;
      case PaymentLogType.PAYMENT_ERROR:
        return `${baseInfo} - Payment error: ${data.error?.message || 'Unknown error'}`;
      default:
        return `${baseInfo} - ${type}`;
    }
  }

  private sanitizeData(data: PaymentLogData): Record<string, any> {
    const sanitized = { ...data };

    // Remove sensitive information
    const sensitiveFields = ['vnp_SecureHash', 'password', 'secret', 'key'];

    const removeSensitiveFields = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj;

      if (Array.isArray(obj)) {
        return obj.map(removeSensitiveFields);
      }

      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        if (
          sensitiveFields.some((field) =>
            key.toLowerCase().includes(field.toLowerCase()),
          )
        ) {
          result[key] = '[REDACTED]';
        } else {
          result[key] = removeSensitiveFields(value);
        }
      }
      return result;
    };

    return removeSensitiveFields(sanitized);
  }

  private logToConsole(
    type: PaymentLogType,
    data: PaymentLogData,
    level: LogLevel,
  ): void {
    const message = this.generateMessage(type, data);

    switch (level) {
      case LogLevel.ERROR:
        this.logger.error(message, data.error?.stack);
        break;
      case LogLevel.WARN:
        this.logger.warn(message);
        break;
      case LogLevel.DEBUG:
        this.logger.debug(message);
        break;
      default:
        this.logger.log(message);
    }
  }

  // Query methods for retrieving logs
  async getPaymentLogs(
    paymentId: string,
    limit: number = 50,
  ): Promise<PaymentLogDocument[]> {
    return this.paymentLogModel
      .find({ paymentId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  async getLogsByOrderId(
    orderId: string,
    limit: number = 50,
  ): Promise<PaymentLogDocument[]> {
    return this.paymentLogModel
      .find({ orderId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  async getLogsByType(
    type: PaymentLogType,
    limit: number = 100,
  ): Promise<PaymentLogDocument[]> {
    return this.paymentLogModel
      .find({ type })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  async getErrorLogs(limit: number = 100): Promise<PaymentLogDocument[]> {
    return this.paymentLogModel
      .find({ level: LogLevel.ERROR })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }
}
