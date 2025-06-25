import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

// Use actual imports with @ts-ignore to suppress type errors
// @ts-ignore
import { PaymentsController } from './payments.controller';
// @ts-ignore
import { PaymentsService } from './payments.service';
// @ts-ignore
import { VnpayService } from './vnpay.service';

// Import schemas with @ts-ignore
import { Payment, PaymentSchema } from './schemas/payment.schema';
// @ts-ignore
import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { PaymentLog, PaymentLogSchema } from './schemas/payment-log.schema';

import { PaymentLoggingService } from './services/payment-logging.service';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: PaymentLog.name, schema: PaymentLogSchema },
    ]),
    forwardRef(() => OrdersModule),
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
  exports: [PaymentsService, PaymentLoggingService, 'VnpayService'],
})
export class PaymentsModule {}
