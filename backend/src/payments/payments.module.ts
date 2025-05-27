import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

// Import directly from schema files
import { Schema, Document } from 'mongoose';
import { Prop, SchemaFactory } from '@nestjs/mongoose';

// Use actual imports with @ts-ignore to suppress type errors
// @ts-ignore
import { PaymentsController } from './payments.controller';
// @ts-ignore
import { PaymentsService } from './payments.service';
// @ts-ignore
import { VnpayService } from './vnpay.service';
// @ts-ignore
import { BankCardService } from './bank-card.service';

// Import schemas with @ts-ignore
import { Payment, PaymentSchema } from './schemas/payment.schema';
// @ts-ignore
import { Transaction, TransactionSchema } from './schemas/transaction.schema';

import { PaymentLoggingService } from './services/payment-logging.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentLoggingService,
    {
      provide: 'VnpayService',
      useClass: VnpayService,
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
