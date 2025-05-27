import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VNPay, HashAlgorithm, VnpLocale, ProductCode } from 'vnpay';
import {
  Payment,
  PaymentDocument,
  PaymentStatus,
} from './schemas/payment.schema';
import { IVnpayService } from './interfaces/vnpay-service.interface';
import { VNPayCallbackDTO } from './dto/vnpay-callback.dto';
import {
  PaymentLoggingService,
  PaymentLogType,
} from './services/payment-logging.service';

// Định nghĩa interface cho VNPay Configuration
interface VNPayConfig {
  tmnCode: string;
  secureSecret: string;
  vnpayHost: string;
  testMode: boolean;
  hashAlgorithm: HashAlgorithm;
  enableLog: boolean;
  endpoints: {
    paymentEndpoint: string;
    queryDrRefundEndpoint: string;
    getBankListEndpoint: string;
  };
}

@Injectable()
export class VnpayService implements IVnpayService {
  private readonly vnpay: VNPay;
  private readonly logger = new Logger(VnpayService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly paymentLoggingService: PaymentLoggingService,
  ) {
    const config: VNPayConfig = {
      tmnCode: this.configService.get<string>('VNPAY_TMN_CODE'),
      secureSecret: this.configService.get<string>('VNPAY_HASH_SECRET'),
      vnpayHost: this.configService.get<string>('VNPAY_HOST'),
      testMode: this.configService.get<boolean>('VNPAY_TEST_MODE') ?? true,
      hashAlgorithm: HashAlgorithm.SHA512,
      enableLog: this.configService.get<boolean>('VNPAY_ENABLE_LOG') ?? true,
      endpoints: {
        paymentEndpoint: this.configService.get<string>(
          'VNPAY_PAYMENT_ENDPOINT',
        ),
        queryDrRefundEndpoint: this.configService.get<string>(
          'VNPAY_QUERY_DR_ENDPOINT',
        ),
        getBankListEndpoint: this.configService.get<string>(
          'VNPAY_BANK_LIST_ENDPOINT',
        ),
      },
    };

    this.validateConfig(config);
    this.vnpay = new VNPay(config);
  }

  private validateConfig(config: VNPayConfig): void {
    if (!config.tmnCode) {
      throw new Error('VNPAY_TMN_CODE is required');
    }
    if (!config.secureSecret) {
      throw new Error('VNPAY_HASH_SECRET is required');
    }
    if (!config.vnpayHost) {
      throw new Error('VNPAY_HOST is required');
    }
  }

  async createPaymentUrl(
    payment: PaymentDocument,
    ipAddr: string,
  ): Promise<string> {
    try {
      this.validatePayment(payment);

      const requestData = {
        vnp_Amount: this.formatAmount(payment.amount),
        vnp_IpAddr: ipAddr,
        vnp_TxnRef: payment._id.toString(),
        vnp_OrderInfo: `Thanh toan don hang ${payment.orderId}`,
        vnp_OrderType: ProductCode.Other,
        vnp_ReturnUrl: this.configService.get<string>('VNPAY_RETURN_URL'),
        vnp_Locale: VnpLocale.VN,
      };

      this.paymentLoggingService.logPaymentFlow(PaymentLogType.VNPAY_REQUEST, {
        paymentId: payment._id.toString(),
        orderId: payment.orderId,
        amount: payment.amount,
        requestData,
      });

      const paymentUrl = await this.vnpay.buildPaymentUrl(requestData);

      this.paymentLoggingService.logPaymentFlow(PaymentLogType.VNPAY_RESPONSE, {
        paymentId: payment._id.toString(),
        orderId: payment.orderId,
        responseData: { paymentUrl },
      });

      return paymentUrl;
    } catch (error) {
      this.paymentLoggingService.logPaymentFlow(PaymentLogType.PAYMENT_ERROR, {
        paymentId: payment._id.toString(),
        orderId: payment.orderId,
        error: {
          message: error.message,
          stack: error.stack,
        },
      });
      throw new BadRequestException(
        `Không thể tạo URL thanh toán VNPay: ${error.message}`,
      );
    }
  }

  private validatePayment(payment: PaymentDocument): void {
    if (!payment.amount || payment.amount <= 0) {
      throw new BadRequestException('Số tiền thanh toán không hợp lệ');
    }
    if (!payment.orderId) {
      throw new BadRequestException('Mã đơn hàng không hợp lệ');
    }
  }

  private formatAmount(amount: number): number {
    // Convert to smallest currency unit (VND doesn't have decimal points)
    return Math.round(amount * 100);
  }

  async verifyReturnUrl(query: any) {
    try {
      this.paymentLoggingService.logPaymentFlow(PaymentLogType.VNPAY_CALLBACK, {
        requestData: query,
      });

      const verify = this.vnpay.verifyReturnUrl(query);

      this.paymentLoggingService.logPaymentFlow(PaymentLogType.VNPAY_RESPONSE, {
        responseData: verify,
      });

      return verify;
    } catch (error) {
      this.paymentLoggingService.logPaymentFlow(PaymentLogType.PAYMENT_ERROR, {
        error: {
          message: error.message,
          stack: error.stack,
        },
        requestData: query,
      });
      throw new BadRequestException('Không thể xác thực kết quả thanh toán');
    }
  }

  async verifyIpnCall(query: any): Promise<any> {
    try {
      this.paymentLoggingService.logPaymentFlow(PaymentLogType.VNPAY_IPN, {
        requestData: query,
      });

      const verify = this.vnpay.verifyIpnCall(query);

      this.paymentLoggingService.logPaymentFlow(PaymentLogType.VNPAY_RESPONSE, {
        responseData: verify,
      });

      return verify;
    } catch (error) {
      this.paymentLoggingService.logPaymentFlow(PaymentLogType.PAYMENT_ERROR, {
        error: {
          message: error.message,
          stack: error.stack,
        },
        requestData: query,
      });
      throw new BadRequestException('Không thể xác thực IPN');
    }
  }

  async handleCallback(
    data: VNPayCallbackDTO,
  ): Promise<Partial<PaymentDocument>> {
    try {
      this.logger.log('Processing callback with data:', data);
      const verify = await this.verifyReturnUrl(data);

      if (!verify.isSuccess) {
        throw new BadRequestException('Chữ ký không hợp lệ');
      }

      const orderId = data.vnp_TxnRef;
      const amount = parseInt(data.vnp_Amount, 10) / 100;
      const responseCode = data.vnp_ResponseCode;
      const status =
        responseCode === '00' ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;

      // Parse payment date
      const paymentDate = this.parseVNPayDate(data.vnp_PayDate);

      const paymentUpdate: Partial<PaymentDocument> = {
        _id: orderId,
        status,
        amount,
        transactionId: data.vnp_TransactionNo,
        bankCode: data.vnp_BankCode,
        bankTransactionNo: data.vnp_BankTranNo,
        cardType: data.vnp_CardType,
        paymentDate,
        responseCode,
        metadata: {
          vnpayResponse: data,
        },
        completedAt:
          status === PaymentStatus.COMPLETED ? paymentDate : undefined,
      };

      this.logger.log(`Payment status updated: ${status}`);
      return paymentUpdate;
    } catch (error) {
      this.logger.error(`Error handling callback: ${error.message}`);
      throw new BadRequestException('Không thể xử lý callback từ VNPay');
    }
  }

  private parseVNPayDate(dateString: string): Date {
    // VNPay date format: yyyyMMddHHmmss
    const year = parseInt(dateString.substring(0, 4), 10);
    const month = parseInt(dateString.substring(4, 6), 10) - 1; // JS months are 0-based
    const day = parseInt(dateString.substring(6, 8), 10);
    const hour = parseInt(dateString.substring(8, 10), 10);
    const minute = parseInt(dateString.substring(10, 12), 10);
    const second = parseInt(dateString.substring(12, 14), 10);

    return new Date(year, month, day, hour, minute, second);
  }

  async refund(payment: PaymentDocument): Promise<{ success: boolean }> {
    try {
      const refundData = {
        vnp_Amount: this.formatAmount(payment.amount),
        vnp_TransactionType: '02',
        vnp_TxnRef: payment._id.toString(),
        vnp_TransactionNo: Number(payment.transactionId),
        vnp_CreateBy: 'admin',
        vnp_CreateDate: this.formatDateToNumber(new Date()),
        vnp_IpAddr: '127.0.0.1',
        vnp_OrderInfo: `Hoan tien don hang ${payment.orderId}`,
        vnp_RequestId: this.generateRequestId(),
        vnp_TransactionDate: this.formatDateToNumber(
          payment.completedAt || new Date(),
        ),
      };

      this.paymentLoggingService.logPaymentFlow(PaymentLogType.REFUND_REQUEST, {
        paymentId: payment._id.toString(),
        orderId: payment.orderId,
        amount: payment.amount,
        requestData: refundData,
      });

      const result = await this.vnpay.refund(refundData);

      this.paymentLoggingService.logPaymentFlow(
        PaymentLogType.REFUND_RESPONSE,
        {
          paymentId: payment._id.toString(),
          orderId: payment.orderId,
          responseData: result,
        },
      );

      return { success: result.isSuccess };
    } catch (error) {
      this.paymentLoggingService.logPaymentFlow(PaymentLogType.PAYMENT_ERROR, {
        paymentId: payment._id.toString(),
        orderId: payment.orderId,
        error: {
          message: error.message,
          stack: error.stack,
        },
      });
      throw new BadRequestException('Không thể xử lý yêu cầu hoàn tiền');
    }
  }

  private validateRefund(payment: PaymentDocument): void {
    if (!payment.completedAt) {
      throw new BadRequestException(
        'Chỉ có thể hoàn tiền cho giao dịch đã hoàn thành',
      );
    }
    if (!payment.transactionId) {
      throw new BadRequestException('Không tìm thấy mã giao dịch');
    }
  }

  private generateRequestId(): string {
    return `REF${Date.now()}`;
  }

  private formatDateToNumber(date: Date): number {
    return Number(
      date
        .toISOString()
        .replace(/[-T:]|\..*$/g, '')
        .slice(0, 14),
    );
  }

  async getBankList() {
    try {
      this.logger.log('Fetching bank list');
      const bankList = await this.vnpay.getBankList();
      this.logger.log(`Retrieved ${bankList.length} banks`);
      return bankList;
    } catch (error) {
      this.logger.error(`Error fetching bank list: ${error.message}`);
      throw new BadRequestException('Không thể lấy danh sách ngân hàng');
    }
  }

  async queryTransaction(transactionId: string) {
    try {
      if (!transactionId) {
        throw new BadRequestException('Mã giao dịch không được để trống');
      }

      const transactionNo = Number(transactionId);
      if (isNaN(transactionNo)) {
        throw new BadRequestException('Mã giao dịch phải là số');
      }

      const currentDate = new Date();
      this.logger.log(`Querying transaction: ${transactionId}`);
      const result = await this.vnpay.queryDr({
        vnp_TransactionNo: transactionNo,
        vnp_TransactionDate: this.formatDateToNumber(currentDate),
        vnp_RequestId: this.generateRequestId(),
        vnp_IpAddr: '127.0.0.1',
        vnp_TxnRef: transactionId,
        vnp_OrderInfo: `Query transaction ${transactionId}`,
        vnp_CreateDate: this.formatDateToNumber(currentDate),
      });

      this.logger.log(`Query result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`Error querying transaction: ${error.message}`);
      throw new BadRequestException('Không thể truy vấn giao dịch');
    }
  }
}
