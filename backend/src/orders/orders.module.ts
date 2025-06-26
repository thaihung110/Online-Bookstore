import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { OrdersController } from './orders.controller';
import { OrderViewController } from './order-view.controller';
import { OrdersService } from './orders.service';
import { OrdersSchedulerService } from './orders-scheduler.service';
import { UsersModule } from '../users';
import { BooksModule } from '../books';
import { CartsModule } from '../carts'; // CartsService is used to clear cart
import { UploadModule } from '../upload/upload.module';
import { PaymentsModule } from '../payments/payments.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    UsersModule, // For UsersService dependency
    BooksModule, // For BooksService dependency
    CartsModule, // For CartsService dependency (clearing cart)
    UploadModule, // For UploadService dependency (image processing)
    forwardRef(() => PaymentsModule), // For PaymentsService dependency (order view)
    EmailModule, // For EmailService dependency (order view)
  ],
  controllers: [OrdersController, OrderViewController],
  providers: [OrdersService, OrdersSchedulerService],
  exports: [OrdersService],
})
export class OrdersModule {}
