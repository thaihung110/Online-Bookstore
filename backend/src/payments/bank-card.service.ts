import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';

@Injectable()
export class BankCardService {
  private readonly logger = new Logger(BankCardService.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
  ) {}

  // Process bank card payment
  async processPayment(
    payment: Payment | PaymentDocument,
  ): Promise<{ success: boolean }> {
    try {
      this.logger.log(`Processing bank card payment for ${payment.id}`);

      // Validate payment details
      const paymentDetails = payment.paymentDetails as any;
      if (
        !paymentDetails ||
        !paymentDetails.cardNumber ||
        !paymentDetails.cardholderName ||
        !paymentDetails.expiryDate ||
        !paymentDetails.cvv
      ) {
        throw new Error('Invalid card details');
      }

      // Simple validation for card number (should use a proper validation library in production)
      const cardNumber = paymentDetails.cardNumber.replace(/\s/g, '');
      if (!/^\d{13,19}$/.test(cardNumber)) {
        throw new Error('Invalid card number');
      }

      // Check expiry date (MM/YY format)
      const expiryDate = paymentDetails.expiryDate;
      if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
        throw new Error('Invalid expiry date format. Required format: MM/YY');
      }

      // Parse expiry date
      const [month, year] = expiryDate
        .split('/')
        .map((part) => parseInt(part, 10));
      const expiryMonth = month;
      const expiryYear = 2000 + year; // Convert YY to 20YY

      // Get current date
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // JS months are 0-based
      const currentYear = currentDate.getFullYear();

      // Check if card is expired
      if (
        expiryYear < currentYear ||
        (expiryYear === currentYear && expiryMonth < currentMonth)
      ) {
        throw new Error('Card has expired');
      }

      // Validate CVV
      if (!/^\d{3,4}$/.test(paymentDetails.cvv)) {
        throw new Error('Invalid CVV');
      }

      // Simulate a payment gateway call
      await this.simulateGatewayCall();

      // Generate a transaction ID
      const transactionId = `BC-${Date.now()}-${Math.floor(
        Math.random() * 1000,
      )}`;

      // Create transaction record
      await this.transactionModel.create({
        paymentId: payment.id,
        transactionId,
        amount: payment.amount,
        type: 'PAYMENT',
        status: 'COMPLETED',
        gatewayResponse: {
          success: true,
          cardLast4: cardNumber.slice(-4),
          transactionId,
        },
      });

      // Update payment status
      await this.paymentModel.findByIdAndUpdate(
        payment.id,
        {
          status: 'COMPLETED',
          transactionId,
          completedAt: new Date(),
        },
        { new: true },
      );

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error processing bank card payment: ${error.message}`,
        error.stack,
      );

      // Create failed transaction
      const errorTransactionId = `BC-ERR-${Date.now()}`;
      await this.transactionModel.create({
        paymentId: payment.id,
        transactionId: errorTransactionId,
        amount: payment.amount,
        type: 'PAYMENT',
        status: 'FAILED',
        gatewayResponse: {
          success: false,
          error: error.message,
        },
      });

      // Update payment status
      await this.paymentModel.findByIdAndUpdate(
        payment.id,
        {
          status: 'FAILED',
        },
        { new: true },
      );

      throw new BadRequestException(error.message);
    }
  }

  // Simulate a payment gateway call with delay
  private async simulateGatewayCall(): Promise<void> {
    return new Promise((resolve) => {
      // Randomly succeed or fail (90% success rate)
      const isSuccessful = Math.random() > 0.1;

      // Simulate network delay
      setTimeout(() => {
        if (isSuccessful) {
          resolve();
        } else {
          throw new Error('Payment declined by gateway');
        }
      }, 1500);
    });
  }
}
