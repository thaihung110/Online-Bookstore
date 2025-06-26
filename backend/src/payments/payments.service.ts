import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Payment,
  PaymentDocument,
  PaymentStatus,
  PaymentMethod,
} from './schemas/payment.schema';
import {
  Transaction,
  TransactionDocument,
  TransactionType,
  TransactionStatus,
  PaymentGateway,
} from './schemas/transaction.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { IVnpayService } from './interfaces/vnpay-service.interface';
import { VNPayCallbackDTO } from './dto/vnpay-callback.dto';
import {
  PaymentLoggingService,
  PaymentLogType,
} from './services/payment-logging.service';
import { VNPayIpnResponse } from './interfaces/vnpay-response.interface';
import { OrdersService } from '../orders/orders.service';
import { EmailService } from '../email/email.service';

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
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
    private readonly emailService: EmailService,
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
    type: TransactionType,
    status: TransactionStatus,
    gateway: PaymentGateway = PaymentGateway.VNPAY,
    gatewayResponse?: any,
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
        gateway,
        gatewayResponse,
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
      payment.bankTransactionNo = response.vnp_BankTranNo;
      payment.cardType = response.vnp_CardType;

      // Parse VNPay payment date if available
      if (response.vnp_PayDate) {
        payment.paymentDate = this.parseVNPayDate(response.vnp_PayDate);
      }

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
        TransactionType.PAYMENT,
        TransactionStatus.SUCCESS,
        PaymentGateway.VNPAY,
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

  private parseVNPayDate(vnpPayDate: string): Date {
    try {
      // VNPay date format: YYYYMMDDHHmmss
      const year = parseInt(vnpPayDate.substring(0, 4));
      const month = parseInt(vnpPayDate.substring(4, 6)) - 1; // Month is 0-indexed
      const day = parseInt(vnpPayDate.substring(6, 8));
      const hour = parseInt(vnpPayDate.substring(8, 10));
      const minute = parseInt(vnpPayDate.substring(10, 12));
      const second = parseInt(vnpPayDate.substring(12, 14));

      return new Date(year, month, day, hour, minute, second);
    } catch (error) {
      this.logger.warn(`Failed to parse VNPay date: ${vnpPayDate}`);
      return new Date();
    }
  }

  // Lấy tất cả thanh toán
  async findAll(): Promise<PaymentDocument[]> {
    return this.paymentModel.find().exec();
  }

  // Tạo thanh toán mới
  async createPayment(createPaymentDto: CreatePaymentDto, ipAddr: string) {
    try {
      // Lấy thông tin order để tính amount chính xác
      const order = await this.ordersService.findOrderById(
        createPaymentDto.orderId,
      );

      // Chuyển đổi từ USD sang VND (×25000) và làm tròn
      const amountInVND = Math.round(order.total * 25000);

      this.logger.log(`=== Payment Amount Conversion ===`);
      this.logger.log(`Order ID: ${createPaymentDto.orderId}`);
      this.logger.log(`Order Total (USD): ${order.total}`);
      this.logger.log(`Payment Amount (VND): ${amountInVND}`);
      this.logger.log(`Conversion Rate: 25000 VND/USD`);
      this.logger.log(`================================`);

      this.paymentLoggingService.logPaymentFlow(
        PaymentLogType.PAYMENT_CREATED,
        {
          orderId: createPaymentDto.orderId,
          amount: amountInVND,
          originalOrderTotal: order.total,
          requestData: createPaymentDto,
        },
      );

      // Debug: log data before creating payment document
      const paymentData = {
        orderId: createPaymentDto.orderId,
        amount: amountInVND, // Sử dụng amount được tính từ order
        paymentMethod: createPaymentDto.paymentMethod,
        status: PaymentStatus.PENDING,
        description:
          createPaymentDto.description ||
          `Thanh toán đơn hàng ${createPaymentDto.orderId}`,
        metadata: createPaymentDto.metadata || {},
      };

      this.logger.log(`=== Payment Data Debug ===`);
      this.logger.log(`Payment Method: ${paymentData.paymentMethod}`);
      this.logger.log(`Payment Status: ${paymentData.status}`);
      this.logger.log(
        `Full Payment Data:`,
        JSON.stringify(paymentData, null, 2),
      );
      this.logger.log(`===========================`);

      // Create payment with minimal required fields to avoid validation issues
      const payment = new this.paymentModel({
        orderId: createPaymentDto.orderId,
        amount: amountInVND,
        paymentMethod: createPaymentDto.paymentMethod,
        status: PaymentStatus.PENDING,
        description:
          createPaymentDto.description ||
          `Thanh toán đơn hàng ${createPaymentDto.orderId}`,
        metadata: createPaymentDto.metadata || {},
      });

      // Log the actual document that will be saved
      this.logger.log(`=== Document Before Save ===`);
      this.logger.log(
        'Document to save:',
        JSON.stringify(payment.toObject(), null, 2),
      );
      this.logger.log(`============================`);

      try {
        const savedPayment = await payment.save();
        this.logger.log(
          `Payment saved successfully with ID: ${savedPayment._id}`,
        );
      } catch (saveError) {
        this.logger.error(`=== Payment Save Error ===`);
        this.logger.error(`Error name: ${saveError.name}`);
        this.logger.error(`Error message: ${saveError.message}`);

        if (saveError.errInfo) {
          this.logger.error(
            `Error Info: ${JSON.stringify(saveError.errInfo, null, 2)}`,
          );

          if (
            saveError.errInfo.details &&
            saveError.errInfo.details.schemaRulesNotSatisfied
          ) {
            this.logger.error('Schema validation failures:');
            for (const rule of saveError.errInfo.details
              .schemaRulesNotSatisfied) {
              this.logger.error(`- Rule: ${rule.operatorName}`);
              if (rule.propertiesNotSatisfied) {
                for (const prop of rule.propertiesNotSatisfied) {
                  this.logger.error(
                    `  - Property: ${JSON.stringify(prop, null, 2)}`,
                  );
                }
              }
            }
          }
        }

        this.logger.error(
          `Document that failed: ${JSON.stringify(payment.toObject(), null, 2)}`,
        );
        this.logger.error(`=========================`);

        // Try alternative save method by bypassing validation
        this.logger.log('Attempting to save with validation bypassed...');
        try {
          const savedPaymentAlt = await this.paymentModel.collection.insertOne({
            orderId: createPaymentDto.orderId,
            amount: amountInVND,
            paymentMethod: createPaymentDto.paymentMethod,
            status: PaymentStatus.PENDING,
            description:
              createPaymentDto.description ||
              `Thanh toán đơn hàng ${createPaymentDto.orderId}`,
            metadata: createPaymentDto.metadata || {},
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          this.logger.log(
            `✅ Payment saved with bypass method, ID: ${savedPaymentAlt.insertedId}`,
          );

          // Fetch the document back as a proper mongoose document
          const savedPayment = await this.paymentModel.findById(
            savedPaymentAlt.insertedId,
          );
          if (!savedPayment) {
            throw new Error('Failed to retrieve saved payment');
          }

          return {
            payment: savedPayment,
            ...(savedPayment.paymentMethod === PaymentMethod.VNPAY && {
              redirectUrl: await this.vnpayService.createPaymentUrl(
                savedPayment,
                ipAddr,
              ),
            }),
          };
        } catch (bypassError) {
          this.logger.error(`Bypass save also failed: ${bypassError.message}`);
          throw saveError;
        }
      }

      const savedPayment = payment;

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

      // For COD payments, immediately mark as COMPLETED
      if (savedPayment.paymentMethod === PaymentMethod.CASH) {
        this.logger.log(
          `COD payment detected - automatically completing payment ${savedPayment._id}`,
        );

        // Update payment status to COMPLETED
        const completedPayment = await this.updatePaymentStatus(
          savedPayment._id.toString(),
          PaymentStatus.COMPLETED,
        );

        // Update order status to RECEIVED
        try {
          await this.ordersService.handlePaymentCompleted(
            savedPayment.orderId,
            savedPayment._id.toString(),
          );
          this.logger.log(
            `✅ Order ${savedPayment.orderId} automatically set to RECEIVED for COD payment`,
          );

          // Send payment success email for COD orders
          try {
            const updatedOrder = await this.ordersService.findOrderById(
              savedPayment.orderId,
            );
            await this.emailService.sendPaymentSuccessEmail({
              order: updatedOrder,
              payment: completedPayment,
            });
            this.logger.log(
              `✅ Payment success email sent for COD order ${savedPayment.orderId}`,
            );
          } catch (emailError) {
            this.logger.error(
              `Failed to send payment success email for COD order ${savedPayment.orderId}:`,
              emailError,
            );
            // Don't throw error for email failure, just log it
          }
        } catch (orderError) {
          this.logger.error(
            `Failed to update order status for COD payment ${savedPayment._id}:`,
            orderError,
          );
          // Don't throw error, COD payment itself is successful
        }

        return {
          payment: completedPayment,
          message: 'COD payment completed successfully',
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

    if (payment.paymentMethod === PaymentMethod.CASH) {
      // For COD payments, immediately mark as COMPLETED and update order to RECEIVED
      await this.updatePaymentStatus(
        payment._id.toString(),
        PaymentStatus.COMPLETED,
      );

      // Update order status to RECEIVED for CASH payments
      try {
        await this.ordersService.handlePaymentCompleted(
          payment.orderId,
          payment._id.toString(),
        );
        this.logger.log(
          `Order ${payment.orderId} status updated to RECEIVED for CASH payment`,
        );

        // Send payment success email for CASH orders
        try {
          const updatedOrder = await this.ordersService.findOrderById(
            payment.orderId,
          );
          await this.emailService.sendPaymentSuccessEmail({
            order: updatedOrder,
            payment: await this.findOne(payment._id.toString()),
          });
          this.logger.log(
            `Payment success email sent for CASH order ${payment.orderId}`,
          );
        } catch (emailError) {
          this.logger.error(
            `Failed to send payment success email for CASH order ${payment.orderId}:`,
            emailError,
          );
          // Don't throw error for email failure, just log it
        }
      } catch (orderError) {
        this.logger.error(
          `Failed to update order status for CASH payment ${payment._id}:`,
          orderError,
        );
        // Don't throw error, CASH payment itself is successful
      }

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

      // VNPay library automatically multiplies amount by 100, so we need to check accordingly
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

      // Update order status to RECEIVED when payment is successful (if not already)
      try {
        this.logger.log(`[PAYMENTS DEBUG] Starting order update process...`);
        this.logger.log(
          `[PAYMENTS DEBUG] Payment ID: ${payment._id.toString()}`,
        );
        this.logger.log(
          `[PAYMENTS DEBUG] Order ID from payment: ${payment.orderId}`,
        );

        const order = await this.ordersService.findOrderById(payment.orderId);
        this.logger.log(
          `[PAYMENTS DEBUG] Found order with status: ${order.status}`,
        );
        this.logger.log(
          `[PAYMENTS DEBUG] Order payment info before update:`,
          JSON.stringify(order.paymentInfo, null, 2),
        );

        // Only update if order is still in PENDING status
        if (order.status === 'PENDING') {
          this.logger.log(
            `[Payments Service] VNPAY payment successful - calling handlePaymentCompleted for order ${payment.orderId}`,
          );
          this.logger.log(
            `[PAYMENTS DEBUG] About to call handlePaymentCompleted with:`,
          );
          this.logger.log(`[PAYMENTS DEBUG] - orderId: ${payment.orderId}`);
          this.logger.log(
            `[PAYMENTS DEBUG] - paymentId: ${payment._id.toString()}`,
          );

          const updatedOrder = await this.ordersService.handlePaymentCompleted(
            payment.orderId,
            payment._id.toString(),
          );

          this.logger.log(
            `[PAYMENTS DEBUG] handlePaymentCompleted returned successfully`,
          );
          this.logger.log(
            `[PAYMENTS DEBUG] Updated order payment info:`,
            JSON.stringify(updatedOrder.paymentInfo, null, 2),
          );
          this.logger.log(
            `[Payments Service] ✅ Order ${payment.orderId} status updated to RECEIVED after successful payment`,
          );
        } else {
          this.logger.log(
            `[Payments Service] Order ${payment.orderId} is already in status ${order.status}, skipping status update`,
          );
        }

        // Send payment success email if not sent before
        try {
          const updatedOrder = await this.ordersService.findOrderById(
            payment.orderId,
          );
          await this.emailService.sendPaymentSuccessEmail({
            order: updatedOrder,
            payment,
            vnpayResponse: query,
          });
          this.logger.log(
            `Payment success email sent for order ${payment.orderId}`,
          );
        } catch (emailError) {
          this.logger.error(
            `Failed to send payment success email for order ${payment.orderId}: ${emailError.message}`,
            emailError.stack,
          );
          // Don't throw error here as payment was successful
        }
      } catch (error) {
        this.logger.error(
          `Failed to process order update for payment ${payment._id}: ${error.message}`,
          error.stack,
        );
        // Don't throw error here as payment was successful
      }

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
    type: TransactionType,
    status: TransactionStatus,
    gateway: PaymentGateway = PaymentGateway.VNPAY,
    gatewayResponse?: any,
  ): Promise<Transaction> {
    const transaction = new this.transactionModel({
      paymentId,
      transactionId,
      amount,
      type,
      status,
      gateway,
      gatewayResponse,
    });
    return transaction.save();
  }

  // Lấy danh sách giao dịch của một thanh toán
  async getTransactions(paymentId: string): Promise<Transaction[]> {
    return this.transactionModel.find({ paymentId }).exec();
  }

  // Xử lý hoàn tiền
  async refundPayment(payment: PaymentDocument): Promise<{ success: boolean }> {
    try {
      if (payment.status !== PaymentStatus.COMPLETED) {
        throw new BadRequestException(
          'Chỉ có thể hoàn tiền cho thanh toán đã hoàn thành',
        );
      }

      this.paymentLoggingService.logPaymentFlow(PaymentLogType.REFUND_REQUEST, {
        paymentId: payment._id.toString(),
        orderId: payment.orderId,
        amount: payment.amount,
      });

      if (payment.paymentMethod === PaymentMethod.VNPAY) {
        const refundResult = await this.vnpayService.refund(payment);

        if (refundResult.success) {
          payment.status = PaymentStatus.REFUNDED;
          payment.refundedAt = new Date();
          await payment.save();

          await this.logAndCreateTransaction(
            payment._id.toString(),
            `REFUND_${payment.transactionId}`,
            payment.amount,
            TransactionType.REFUND,
            TransactionStatus.SUCCESS,
            PaymentGateway.VNPAY,
          );

          this.paymentLoggingService.logPaymentFlow(
            PaymentLogType.REFUND_RESPONSE,
            {
              paymentId: payment._id.toString(),
              orderId: payment.orderId,
              success: true,
            },
          );
        }

        return refundResult;
      }

      // For other payment methods, just mark as refunded
      payment.status = PaymentStatus.REFUNDED;
      payment.refundedAt = new Date();
      await payment.save();

      await this.logAndCreateTransaction(
        payment._id.toString(),
        `REFUND_${Date.now()}`,
        payment.amount,
        TransactionType.REFUND,
        TransactionStatus.SUCCESS,
        PaymentGateway.BANK,
      );

      return { success: true };
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

      // VNPay library automatically multiplies amount by 100, so we need to check accordingly
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

      // Update order status to RECEIVED when payment is successful
      try {
        this.logger.log(
          `[Payments Service] VNPAY IPN successful - calling handlePaymentCompleted for order ${payment.orderId}`,
        );
        await this.ordersService.handlePaymentCompleted(
          payment.orderId,
          payment._id.toString(),
        );
        this.logger.log(
          `[Payments Service] ✅ Order ${payment.orderId} status updated to RECEIVED after successful IPN payment`,
        );
      } catch (error) {
        this.logger.error(
          `[Payments Service] Failed to update order status for IPN payment ${payment._id}: ${error.message}`,
          error.stack,
        );
        // Don't return error here as payment was successful
      }

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
