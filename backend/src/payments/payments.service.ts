import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';
// @ts-ignore
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';
// @ts-ignore
import { VnpayService } from './vnpay.service';
// @ts-ignore
import { BankCardService } from './bank-card.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    private vnpayService: VnpayService,
    private bankCardService: BankCardService,
  ) {}

  // Tạo thanh toán mới
  async createPayment(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    // Prepare paymentDetails based on the payment method
    let paymentDetails: any = {};

    if (createPaymentDto.paymentMethod === 'BANK_CARD') {
      if (!createPaymentDto.bankCardDetails) {
        throw new BadRequestException(
          'Bank card details are required for BANK_CARD payment method',
        );
      }
      paymentDetails = createPaymentDto.bankCardDetails;
    } else if (createPaymentDto.paymentMethod === 'VNPAY') {
      if (!createPaymentDto.vnpayDetails) {
        throw new BadRequestException(
          'VNPAY details are required for VNPAY payment method',
        );
      }
      paymentDetails = createPaymentDto.vnpayDetails;
    }

    const newPayment = new this.paymentModel({
      orderId: createPaymentDto.orderId,
      paymentMethod: createPaymentDto.paymentMethod,
      amount: createPaymentDto.amount,
      paymentDetails,
      status: 'PENDING',
    });

    return newPayment.save();
  }

  // Tìm thanh toán theo ID
  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentModel.findById(id).exec();
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    return payment;
  }

  // Xử lý thanh toán dựa trên phương thức
  async processPayment(
    paymentId: string,
  ): Promise<{ redirectUrl?: string; success: boolean }> {
    const payment = await this.findOne(paymentId);

    if (payment.status !== 'PENDING') {
      throw new BadRequestException(
        `Payment with ID ${paymentId} is already ${payment.status.toLowerCase()}`,
      );
    }

    if (payment.paymentMethod === 'VNPAY') {
      return this.vnpayService.createPayment(payment);
    } else if (payment.paymentMethod === 'BANK_CARD') {
      return this.bankCardService.processPayment(payment);
    }

    throw new BadRequestException(
      `Unsupported payment method: ${payment.paymentMethod}`,
    );
  }

  // Xử lý callback từ cổng thanh toán
  async handleCallback(paymentMethod: string, data: any): Promise<Payment> {
    if (paymentMethod === 'VNPAY') {
      return this.vnpayService.handleCallback(data);
    }

    throw new BadRequestException(
      `Callback for ${paymentMethod} is not supported`,
    );
  }

  // Cập nhật trạng thái thanh toán
  async updatePaymentStatus(
    id: string,
    status: string,
    transactionId?: string,
  ): Promise<Payment> {
    const update: any = { status };

    if (status === 'COMPLETED') {
      update.completedAt = new Date();
    }

    if (transactionId) {
      update.transactionId = transactionId;
    }

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
}
