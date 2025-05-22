import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { format } from 'date-fns';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { PaymentsService } from './payments.service';

@Injectable()
export class VnpayService {
  private readonly logger = new Logger(VnpayService.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    private configService: ConfigService,
  ) {}

  // Tạo thanh toán VNPay và trả về URL chuyển hướng
  async createPayment(
    payment: Payment | PaymentDocument,
  ): Promise<{ redirectUrl: string; success: boolean }> {
    try {
      const tmnCode =
        this.configService.get('VNPAY_TMN_CODE') || 'VNPAY_TMN_CODE';
      const secretKey =
        this.configService.get('VNPAY_HASH_SECRET') || 'VNPAY_HASH_SECRET';
      const vnpUrl =
        this.configService.get('VNPAY_URL') ||
        'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
      const returnUrl =
        this.configService.get('VNPAY_RETURN_URL') ||
        'http://localhost:3000/payment/vnpay-callback';

      // Tạo tham số cho VNPay
      const dateFormat = format(new Date(), 'yyyyMMddHHmmss');
      const orderId = `${dateFormat}_${payment.id}`;

      const vnpParams = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: tmnCode,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: orderId,
        vnp_OrderInfo: `Thanh toan don hang ${payment.orderId}`,
        vnp_OrderType: '190000',
        vnp_Amount: payment.amount * 100, // VNPay yêu cầu amount * 100
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: '127.0.0.1',
        vnp_CreateDate: dateFormat,
      };

      // Sắp xếp tham số theo thứ tự
      const sortedParams = this.sortObject(vnpParams);

      // Tạo chuỗi hash
      let signData =
        this.configService.get('VNPAY_HASH_SECRET') || 'VNPAY_HASH_SECRET';
      const query = Object.keys(sortedParams)
        .map((key) => `${key}=${sortedParams[key]}`)
        .join('&');

      signData += query;
      const hmac = crypto.createHmac('sha512', secretKey);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      // Thêm chữ ký vào tham số
      vnpParams['vnp_SecureHash'] = signed;

      // Tạo URL để chuyển hướng
      const vnpQueryStr = Object.keys(vnpParams)
        .map((key) => `${key}=${encodeURIComponent(vnpParams[key])}`)
        .join('&');

      const redirectUrl = `${vnpUrl}?${vnpQueryStr}`;

      // Lưu thông tin giao dịch VNPay
      await this.transactionModel.create({
        paymentId: payment.id,
        transactionId: orderId,
        amount: payment.amount,
        type: 'PAYMENT',
        status: 'PENDING',
        gatewayResponse: {
          vnpParams,
          redirectUrl,
        },
      });

      return {
        redirectUrl,
        success: true,
      };
    } catch (error) {
      this.logger.error(
        `Error creating VNPay payment: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to create VNPay payment');
    }
  }

  // Xử lý callback từ VNPay
  async handleCallback(data: any): Promise<Payment> {
    try {
      this.logger.log(`Received VNPay callback: ${JSON.stringify(data)}`);

      // Xác thực chữ ký
      const secureHash = data.vnp_SecureHash;
      delete data.vnp_SecureHash;
      delete data.vnp_SecureHashType;

      const secretKey =
        this.configService.get('VNPAY_HASH_SECRET') || 'VNPAY_HASH_SECRET';
      const sortedData = this.sortObject(data);

      let signData = secretKey;
      const query = Object.keys(sortedData)
        .map((key) => `${key}=${sortedData[key]}`)
        .join('&');

      signData += query;
      const hmac = crypto.createHmac('sha512', secretKey);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      // Kiểm tra chữ ký
      if (secureHash !== signed) {
        throw new BadRequestException('Invalid signature');
      }

      // Kiểm tra trạng thái giao dịch
      const txnRef = data.vnp_TxnRef; // Format: yyyyMMddHHmmss_paymentId
      const paymentId = txnRef.split('_')[1];
      const responseCode = data.vnp_ResponseCode;

      // Tìm thanh toán
      const payment = await this.paymentModel.findById(paymentId);
      if (!payment) {
        throw new BadRequestException(`Payment with ID ${paymentId} not found`);
      }

      // Cập nhật trạng thái giao dịch
      await this.transactionModel.findOneAndUpdate(
        { transactionId: txnRef },
        {
          status: responseCode === '00' ? 'COMPLETED' : 'FAILED',
          gatewayResponse: data,
        },
        { new: true },
      );

      // Cập nhật trạng thái thanh toán
      const paymentStatus = responseCode === '00' ? 'COMPLETED' : 'FAILED';
      const updatedPayment = await this.paymentModel.findByIdAndUpdate(
        paymentId,
        {
          status: paymentStatus,
          ...(paymentStatus === 'COMPLETED' ? { completedAt: new Date() } : {}),
        },
        { new: true },
      );

      return updatedPayment!;
    } catch (error) {
      this.logger.error(
        `Error handling VNPay callback: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Sắp xếp object theo key
  private sortObject(obj: any): any {
    const sorted: any = {};
    const keys = Object.keys(obj).sort();

    for (const key of keys) {
      sorted[key] = obj[key];
    }

    return sorted;
  }
}
