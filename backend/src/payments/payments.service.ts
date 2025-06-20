import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Payment,
  PaymentDocument,
  PaymentStatus,
  PaymentMethod,
} from './schemas/payment.schema';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { IVnpayService } from './interfaces/vnpay-service.interface';
import { VNPayCallbackDTO } from './dto/vnpay-callback.dto';
import {
  PaymentLoggingService,
  PaymentLogType,
} from './services/payment-logging.service';
import { VNPayIpnResponse } from './interfaces/vnpay-response.interface';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    @Inject('VnpayService')
    private readonly vnpayService: IVnpayService,
    private readonly paymentLoggingService: PaymentLoggingService,
  ) {}

  private validatePaymentAmount(actualAmount: number, expectedAmount: number) {
    if (actualAmount !== expectedAmount) {
      this.logger.error(
        `Amount mismatch: actual=${actualAmount}, expected=${expectedAmount}`,
      );
      throw new BadRequestException('Số tiền thanh toán không hợp lệ');
    }
  }

  private async logAndCreateTransaction(
    paymentId: string,
    transactionId: string,
    amount: number,
    type: string,
    status: string,
    metadata?: any,
  ) {
    try {
      this.logger.log(
        `Creating transaction record: payment=${paymentId}, transaction=${transactionId}, type=${type}`,
      );
      await this.createTransaction(
        paymentId,
        transactionId,
        amount,
        type,
        status,
        metadata,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create transaction record: ${error.message}`,
        error.stack,
      );
      // Don't throw error here as this is a non-critical operation
    }
  }

  private async updatePaymentWithResponse(
    payment: PaymentDocument,
    response: VNPayCallbackDTO,
    source: string,
  ) {
    try {
      payment.status = PaymentStatus.COMPLETED;
      payment.transactionId = response.vnp_TransactionNo;
      payment.completedAt = new Date();
      payment.bankCode = response.vnp_BankCode;
      payment.responseCode = response.vnp_ResponseCode;
      payment.metadata = {
        ...payment.metadata,
        [`vnpay${source}Response`]: response,
      };

      await payment.save();
      this.logger.log(
        `Payment ${payment._id} updated successfully from ${source}`,
      );

      await this.logAndCreateTransaction(
        payment._id.toString(),
        response.vnp_TransactionNo,
        payment.amount,
        'PAYMENT',
        'SUCCESS',
        response,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update payment ${payment._id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Lấy tất cả thanh toán
  async findAll(): Promise<PaymentDocument[]> {
    return this.paymentModel.find().exec();
  }

  // Tạo thanh toán mới
  async createPayment(createPaymentDto: CreatePaymentDto, ipAddr: string) {
    try {
      this.paymentLoggingService.logPaymentFlow(
        PaymentLogType.PAYMENT_CREATED,
        {
          orderId: createPaymentDto.orderId,
          amount: createPaymentDto.amount,
          requestData: createPaymentDto,
        },
      );
      const payment = new this.paymentModel({
        ...createPaymentDto,
        status: PaymentStatus.PENDING,
      });
      const savedPayment = await payment.save();
      if (savedPayment.paymentMethod === PaymentMethod.VNPAY) {
        const paymentUrl = await this.vnpayService.createPaymentUrl(
          savedPayment,
          ipAddr,
        );
        return {
          payment: savedPayment,
          redirectUrl: paymentUrl,
        };
      }
      return {
        payment: savedPayment,
      };
    } catch (error) {
      this.paymentLoggingService.logPaymentFlow(PaymentLogType.PAYMENT_ERROR, {
        orderId: createPaymentDto.orderId,
        error: {
          message: error.message,
          stack: error.stack,
        },
      });
      throw error;
    }
  }

  // Tìm thanh toán theo ID
  async findOne(id: string): Promise<PaymentDocument> {
    const payment = await this.paymentModel.findById(id).exec();
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    return payment;
  }

  // Tìm thanh toán theo Order ID
  async findByOrderId(orderId: string): Promise<PaymentDocument> {
    const payment = await this.paymentModel.findOne({ orderId }).exec();
    if (!payment) {
      throw new NotFoundException(`Payment with Order ID ${orderId} not found`);
    }
    return payment;
  }

  // Xử lý thanh toán dựa trên phương thức
  async processPayment(
    id: string,
  ): Promise<{ redirectUrl?: string; success: boolean }> {
    const payment = await this.findOne(id);

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(
        `Payment with ID ${id} is already ${payment.status.toLowerCase()}`,
      );
    }

    if (payment.paymentMethod === PaymentMethod.VNPAY) {
      const paymentUrl = await this.vnpayService.createPaymentUrl(
        payment,
        '127.0.0.1',
      );
      return { redirectUrl: paymentUrl, success: true };
    }

    if (payment.paymentMethod === PaymentMethod.COD) {
      await this.updatePaymentStatus(
        payment._id.toString(),
        PaymentStatus.PENDING,
      );
      return { success: true };
    }

    throw new BadRequestException(
      `Unsupported payment method: ${payment.paymentMethod}`,
    );
  }

  // Xử lý callback từ cổng thanh toán
  async handleVnpayCallback(query: VNPayCallbackDTO) {
    try {
      this.paymentLoggingService.logPaymentFlow(PaymentLogType.VNPAY_CALLBACK, {
        requestData: query,
      });

      const verify = await this.vnpayService.verifyReturnUrl(query);
      if (!verify.isSuccess) {
        this.paymentLoggingService.logPaymentFlow(
          PaymentLogType.PAYMENT_ERROR,
          {
            requestData: query,
            error: {
              message: 'Verification failed',
              verifyResult: verify,
            },
          },
        );
        throw new BadRequestException('Thanh toán thất bại');
      }

      const payment = await this.findOne(query.vnp_TxnRef);
      if (!payment) {
        this.paymentLoggingService.logPaymentFlow(
          PaymentLogType.PAYMENT_ERROR,
          {
            requestData: query,
            error: {
              message: 'Payment not found',
              paymentId: query.vnp_TxnRef,
            },
          },
        );
        throw new NotFoundException('Không tìm thấy thanh toán');
      }

      if (Number(query.vnp_Amount) !== payment.amount * 100) {
        this.paymentLoggingService.logPaymentFlow(
          PaymentLogType.PAYMENT_ERROR,
          {
            paymentId: payment._id.toString(),
            requestData: query,
            error: {
              message: 'Amount mismatch',
              expected: payment.amount * 100,
              received: Number(query.vnp_Amount),
            },
          },
        );
        throw new BadRequestException('Số tiền thanh toán không hợp lệ');
      }

      await this.updatePaymentWithResponse(payment, query, 'callback');
      return payment;
    } catch (error) {
      this.paymentLoggingService.logPaymentFlow(PaymentLogType.PAYMENT_ERROR, {
        error: {
          message: error.message,
          stack: error.stack,
        },
        requestData: query,
      });
      throw error;
    }
  }

  // Cập nhật trạng thái thanh toán
  async updatePaymentStatus(
    id: string,
    status: PaymentStatus,
    transactionId?: string,
  ): Promise<PaymentDocument> {
    const update: any = {
      status,
      ...(status === PaymentStatus.COMPLETED && { completedAt: new Date() }),
      ...(status === PaymentStatus.REFUNDED && { refundedAt: new Date() }),
      ...(transactionId && { transactionId }),
    };

    const payment = await this.paymentModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  // Tạo giao dịch mới
  async createTransaction(
    paymentId: string,
    transactionId: string,
    amount: number,
    type: string,
    status: string,
    gatewayResponse?: any,
  ): Promise<Transaction> {
    const transaction = new this.transactionModel({
      paymentId,
      transactionId,
      amount,
      type,
      status,
      gatewayResponse: gatewayResponse || {},
    });

    return transaction.save();
  }

  // Lấy danh sách giao dịch của một thanh toán
  async getTransactions(paymentId: string): Promise<Transaction[]> {
    return this.transactionModel
      .find({ paymentId })
      .sort({ createdAt: -1 })
      .exec();
  }

  // Xử lý hoàn tiền
  async refundPayment(payment: PaymentDocument): Promise<{ success: boolean }> {
    try {
      this.paymentLoggingService.logPaymentFlow(PaymentLogType.REFUND_REQUEST, {
        paymentId: payment._id.toString(),
        orderId: payment.orderId,
        amount: payment.amount,
      });

      if (payment.status !== PaymentStatus.COMPLETED) {
        throw new BadRequestException(
          'Chỉ có thể hoàn tiền cho các thanh toán đã hoàn thành',
        );
      }

      if (payment.paymentMethod === PaymentMethod.VNPAY) {
        const result = await this.vnpayService.refund(payment);
        if (result.success) {
          const updatedPayment = await this.updatePaymentStatus(
            payment._id.toString(),
            PaymentStatus.REFUNDED,
          );

          await this.createTransaction(
            payment._id.toString(),
            `REF${payment.transactionId}`,
            payment.amount,
            'REFUND',
            'SUCCESS',
            result,
          );

          this.paymentLoggingService.logPaymentFlow(
            PaymentLogType.REFUND_RESPONSE,
            {
              paymentId: payment._id.toString(),
              orderId: payment.orderId,
              responseData: result,
            },
          );

          return result;
        }
        return result;
      }

      if (payment.paymentMethod === PaymentMethod.COD) {
        await this.updatePaymentStatus(
          payment._id.toString(),
          PaymentStatus.REFUNDED,
        );

        // Tạo transaction record cho hoàn tiền COD
        await this.createTransaction(
          payment._id.toString(),
          `REF${Date.now()}`,
          payment.amount,
          'REFUND',
          'SUCCESS',
          { method: 'COD' },
        );

        return { success: true };
      }

      throw new BadRequestException(
        `Không hỗ trợ hoàn tiền cho phương thức ${payment.paymentMethod}`,
      );
    } catch (error) {
      this.paymentLoggingService.logPaymentFlow(PaymentLogType.PAYMENT_ERROR, {
        paymentId: payment._id.toString(),
        orderId: payment.orderId,
        error: {
          message: error.message,
          stack: error.stack,
        },
      });
      throw error;
    }
  }

  async handleVnpayIpn(query: VNPayCallbackDTO): Promise<VNPayIpnResponse> {
    try {
      const verify = await this.vnpayService.verifyIpnCall(query);
      if (!verify.isSuccess) {
        return {
          RspCode: '99',
          Message: 'Xác thực thất bại',
        };
      }

      const payment = await this.findOne(query.vnp_TxnRef);
      if (!payment) {
        return {
          RspCode: '01',
          Message: 'Không tìm thấy thanh toán',
        };
      }

      if (Number(query.vnp_Amount) !== payment.amount * 100) {
        return {
          RspCode: '04',
          Message: 'Số tiền không hợp lệ',
        };
      }

      if (payment.status === PaymentStatus.COMPLETED) {
        return {
          RspCode: '02',
          Message: 'Thanh toán đã được xử lý',
        };
      }

      await this.updatePaymentWithResponse(payment, query, 'ipn');

      return {
        RspCode: '00',
        Message: 'Xác nhận thanh toán thành công',
      };
    } catch (error) {
      return {
        RspCode: '99',
        Message: `Lỗi xử lý IPN: ${error.message}`,
      };
    }
  }
}
